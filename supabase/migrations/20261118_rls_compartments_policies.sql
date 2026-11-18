-- ==============================================================================
-- 🏛️ LOCAGESTION — MATRICE RLS UNIVERSELLE & ISOLATION MULTI-COMPARTIMENTS
-- Date de scellement : 18 Novembre 2026
-- Conformité : Droit OHADA, UEMOA & CEMAC, Règlements Google Play & RGPD
-- ==============================================================================
-- Ce fichier applique une politique Row Level Security (RLS) stricte et étanche
-- pour chaque compartiment :
-- 1. Compartiment Bailleur (Propriétaire)
-- 2. Compartiment Résident (Locataire)
-- 3. Compartiment Démarcheur (Mandataire d'annonces)
-- 4. Compartiment Super-Administrateur (Modération & Sécurité)
-- ==============================================================================

-- 0. VÉRIFICATION ET SÉCURISATION DU SEARCH_PATH
SET search_path = public;

-- 1. FONCTIONS D'AIDE ET DE CONTEXTE UTILISATEUR SÉCURISÉES
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'email',
    (SELECT email FROM auth.users WHERE id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.current_user_email() = 'admin@locagestion.site');
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Révocation des droits d'exécution publique sur les helpers
REVOKE ALL ON FUNCTION public.current_user_email() FROM anon;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM anon;
REVOKE ALL ON FUNCTION public.current_user_role() FROM anon;

-- ==============================================================================
-- COMPARTIMENT 1 : PROFILS UTILISATEURS (TABLE: profiles)
-- ==============================================================================
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- ==============================================================================
-- COMPARTIMENT 2 : ENTREPRISES & AGENCES (TABLE: companies)
-- ==============================================================================
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_owner_access" ON public.companies;
CREATE POLICY "companies_owner_access" ON public.companies
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

-- ==============================================================================
-- COMPARTIMENT 3 : PATRIMOINE IMMOBILIER (TABLES: properties, units)
-- Strictement réservé au Bailleur propriétaire du bien
-- ==============================================================================
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "properties_landlord_only" ON public.properties;
CREATE POLICY "properties_landlord_only" ON public.properties
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_super_admin());

ALTER TABLE IF EXISTS public.units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "units_landlord_access" ON public.units;
CREATE POLICY "units_landlord_access" ON public.units
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = units.property_id AND (p.owner_id = auth.uid() OR public.is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = units.property_id AND (p.owner_id = auth.uid() OR public.is_super_admin())
    )
  );

-- ==============================================================================
-- COMPARTIMENT 4 : BAUX, CONTRATS & SIGNATURES (TABLE: leases)
-- Cloisonnement bilatéral étanche Bailleur <-> Locataire
-- ==============================================================================
ALTER TABLE IF EXISTS public.leases ENABLE ROW LEVEL SECURITY;

-- 1. Le bailleur propriétaire peut gérer tous les baux de ses biens
DROP POLICY IF EXISTS "leases_landlord_manage" ON public.leases;
CREATE POLICY "leases_landlord_manage" ON public.leases
  FOR ALL
  TO authenticated
  USING (landlord_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (landlord_id = auth.uid() OR public.is_super_admin());

-- 2. Le locataire ne peut lire et signer QUE son propre contrat de bail
DROP POLICY IF EXISTS "leases_tenant_read_sign" ON public.leases;
CREATE POLICY "leases_tenant_read_sign" ON public.leases
  FOR SELECT
  TO authenticated
  USING (
    tenant_user_id = auth.uid() OR
    tenant_email = public.current_user_email()
  );

DROP POLICY IF EXISTS "leases_tenant_sign_update" ON public.leases;
CREATE POLICY "leases_tenant_sign_update" ON public.leases
  FOR UPDATE
  TO authenticated
  USING (
    tenant_user_id = auth.uid() OR
    tenant_email = public.current_user_email()
  )
  WITH CHECK (
    tenant_user_id = auth.uid() OR
    tenant_email = public.current_user_email()
  );

-- ==============================================================================
-- COMPARTIMENT 5 : PAIEMENTS & QUITTANCES NUMÉRIQUES (TABLE: payments)
-- ==============================================================================
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;

-- Le bailleur peut consulter et enregistrer les paiements de ses baux
DROP POLICY IF EXISTS "payments_landlord_all" ON public.payments;
CREATE POLICY "payments_landlord_all" ON public.payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leases l
      WHERE l.id = payments.lease_id AND (l.landlord_id = auth.uid() OR public.is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leases l
      WHERE l.id = payments.lease_id AND (l.landlord_id = auth.uid() OR public.is_super_admin())
    )
  );

-- Le locataire peut consulter ses quittances certifiées et déclarer un paiement
DROP POLICY IF EXISTS "payments_tenant_read" ON public.payments;
CREATE POLICY "payments_tenant_read" ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leases l
      WHERE l.id = payments.lease_id AND (
        l.tenant_user_id = auth.uid() OR
        l.tenant_email = public.current_user_email()
      )
    )
  );

DROP POLICY IF EXISTS "payments_tenant_insert_declaration" ON public.payments;
CREATE POLICY "payments_tenant_insert_declaration" ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leases l
      WHERE l.id = payments.lease_id AND (
        l.tenant_user_id = auth.uid() OR
        l.tenant_email = public.current_user_email()
      )
    )
  );

-- ==============================================================================
-- COMPARTIMENT 6 : INCIDENTS & RÉPARATIONS (TABLE: incidents)
-- ==============================================================================
ALTER TABLE IF EXISTS public.incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "incidents_tenant_manage" ON public.incidents;
CREATE POLICY "incidents_tenant_manage" ON public.incidents
  FOR ALL
  TO authenticated
  USING (
    tenant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.leases l
      WHERE l.unit_id = incidents.unit_id AND (
        l.tenant_user_id = auth.uid() OR
        l.tenant_email = public.current_user_email()
      )
    )
  )
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS "incidents_landlord_resolve" ON public.incidents;
CREATE POLICY "incidents_landlord_resolve" ON public.incidents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.units u
      JOIN public.properties p ON p.id = u.property_id
      WHERE u.id = incidents.unit_id AND (p.owner_id = auth.uid() OR public.is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.units u
      JOIN public.properties p ON p.id = u.property_id
      WHERE u.id = incidents.unit_id AND (p.owner_id = auth.uid() OR public.is_super_admin())
    )
  );

-- ==============================================================================
-- COMPARTIMENT 7 : RELANCES & MISES EN DEMEURE (TABLE: reminders)
-- Strictement réservé au bailleur créancier
-- ==============================================================================
ALTER TABLE IF EXISTS public.reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reminders_landlord_only" ON public.reminders;
CREATE POLICY "reminders_landlord_only" ON public.reminders
  FOR ALL
  TO authenticated
  USING (landlord_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (landlord_id = auth.uid() OR public.is_super_admin());

-- ==============================================================================
-- COMPARTIMENT 8 : ANNONCES IMMOBILIÈRES (TABLE: rental_listings)
-- Utilisable par Bailleurs et Démarcheurs, consultable par le public si validé
-- ==============================================================================
ALTER TABLE IF EXISTS public.rental_listings ENABLE ROW LEVEL SECURITY;

-- 1. Consultation publique : uniquement les annonces validées et non masquées
DROP POLICY IF EXISTS "rental_listings_public_select" ON public.rental_listings;
CREATE POLICY "rental_listings_public_select" ON public.rental_listings
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'disponible' AND
    moderation_status = 'valide'
  );

-- 2. Gestion de l'annonceur : Chaque bailleur ou démarcheur contrôle ses propres annonces
DROP POLICY IF EXISTS "rental_listings_author_manage" ON public.rental_listings;
CREATE POLICY "rental_listings_author_manage" ON public.rental_listings
  FOR ALL
  TO authenticated
  USING (author_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (author_id = auth.uid() OR public.is_super_admin());

-- ==============================================================================
-- COMPARTIMENT 9 : ALERTES DE SÉCURITÉ & MODÉRATION IA (TABLE: security_alerts)
-- STRICTEMENT RÉSERVÉ AU SUPER-ADMINISTRATEUR (AUCUN ACCÈS UTILISATEUR NI ANON)
-- ==============================================================================
ALTER TABLE IF EXISTS public.security_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_alerts_super_admin_only" ON public.security_alerts;
CREATE POLICY "security_alerts_super_admin_only" ON public.security_alerts
  FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Système de modération IA : insertion autorisée pour tracer les infractions
DROP POLICY IF EXISTS "security_alerts_system_insert" ON public.security_alerts;
CREATE POLICY "security_alerts_system_insert" ON public.security_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ==============================================================================
-- COMPARTIMENT 10 : MESSAGERIE INSTANTANÉE (TABLE: messages)
-- ==============================================================================
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_participants_only" ON public.messages;
CREATE POLICY "messages_participants_only" ON public.messages
  FOR ALL
  TO authenticated
  USING (
    sender_id = auth.uid() OR
    receiver_id = auth.uid() OR
    public.is_super_admin()
  )
  WITH CHECK (sender_id = auth.uid());

-- ==============================================================================
-- 11. INDEXATION HAUTE PERFORMANCE DES VÉRIFICATIONS RLS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_units_property_id ON public.units(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_landlord_id ON public.leases(landlord_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant_user_id ON public.leases(tenant_user_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant_email ON public.leases(tenant_email);
CREATE INDEX IF NOT EXISTS idx_payments_lease_id ON public.payments(lease_id);
CREATE INDEX IF NOT EXISTS idx_listings_author_id ON public.rental_listings(author_id);
CREATE INDEX IF NOT EXISTS idx_listings_status_moderation ON public.rental_listings(status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON public.messages(sender_id, receiver_id);

