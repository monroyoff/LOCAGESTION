# 🏛️ LOCAGESTION — Guide d'Architecture & Manuel Maître du Projet

> **Fichier de référence technique et fonctionnelle universelle pour les développeurs et modèles d'Intelligence Artificielle.**  
> Ce document synthétise l'intégralité de la vision, des fonctionnalités, des règles métier, de la stack technique, de la structure des fichiers et des directives d'ingénierie régissant **LOCAGESTION**.

---

## 📌 Sommaire
1. [Vision & Présentation Générale](#1-vision--présentation-générale)
2. [Modèle Multi-Espaces & Rôles (3 Espaces Étanches)](#2-modèle-multi-espaces--rôles-3-espaces-étanches)
3. [Moteur Juridique & Monétaire Multi-Pays (UEMOA / CEMAC / Diaspora)](#3-moteur-juridique--monétaire-multi-pays-uemoa--cemac--diaspora)
4. [Fonctionnalités Détaillées par Module](#4-fonctionnalités-détaillées-par-module)
5. [Parcours d'Authentification & Onboarding Conversationnel](#5-parcours-dauthentification--onboarding-conversationnel)
6. [Moteur de Documents Officiels & PDF Haute Fidélité](#6-moteur-de-documents-officiels--pdf-haute-fidélité)
7. [Sécurité, RLS & Multi-Tenancy (Supabase / PostgreSQL)](#7-sécurité-rls--multi-tenancy-supabase--postgresql)
8. [Cartographie Complète de la Structure des Fichiers](#8-cartographie-complète-de-la-structure-des-fichiers)
9. [Technologies & Dépendances](#9-technologies--dépendances)
10. [Design System & Principes UI/UX](#10-design-system--principes-uiux)
11. [Instructions Strictes & Règles d'Or pour les Futurs Modèles IA](#11-instructions-strictes--règles-dor-pour-les-futurs-modèles-ia)
12. [Règles de Sécurité Strictes & Modération IA Automatique](#12-règles-de-sécurité-strictes--modération-ia-automatique)

---

## 1. Vision & Présentation Générale

**LOCAGESTION** (conçu par le groupe OMEGA, accessible sur **https://locagestion.site**) est la première plateforme PropTech SaaS d'Afrique francophone dédiée à la gestion locative intégrale, à la sécurisation des baux d'habitation et commerciaux, et à l'intermédiation immobilière de confiance.

### Problématiques résolues en Afrique francophone (UEMOA & CEMAC) :
- **Absence d'écrits et d'actes juridiques certifiés :** La majorité des baux étaient conclus verbalement ou sur des brouillons fragiles. LOCAGESTION génère des contrats de baux électroniques conformes aux codes civils nationaux et à l'Acte Uniforme OHADA portant sur le Droit Commercial Général.
- **Délivrance complexe de quittances légales :** Émission instantanée de quittances de loyer numériques et téléchargeables en PDF A4 vectoriel avec QR Code de certification scellé (vérifiable par banques, ambassades et administrations).
- **Régulation des cautions et avances :** Respect automatisé des plafonds légaux par pays (ex: maximum 3 mois au Bénin selon la Loi 2018-12, 2 mois de caution + 2 mois d'avance en Côte d'Ivoire selon la Loi 2019-576).
- **Paiements fragmentés :** Prise en charge native du Franc CFA (XOF / XAF) et intégration de l'écosystème Mobile Money (Wave, MTN Mobile Money, Moov Money, Orange Money, Airtel Money) en plus des virements bancaires et règlements en espèces.
- **Inclusion de la Diaspora :** Permet à un ressortissant ou investisseur expatrié (France, Canada, Belgique, USA, etc.) de piloter ses biens ou de trouver un logement en Afrique avec géolocalisation intelligente et rattachement au pays de projet.

---

## 2. Modèle Multi-Espaces & Rôles (3 Espaces Étanches)

L'architecture applicative repose sur **3 espaces strictement cloisonnés** définis dans le type `UserSpace = 'bailleur' | 'locataire' | 'demarcheur'`.

```
                        ┌─────────────────────────────────────┐
                        │      LOCAGESTION ROUTING ROOT       │
                        └──────────────────┬──────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌─────────────────┐               ┌─────────────────┐               ┌─────────────────┐
│ ESPACE BAILLEUR │               │ ESPACE RÉSIDENT │               │  DÉMARCHEUR /   │
│   (PROPRIÉTAIRE)│               │   (LOCATAIRE)   │               │   ANNONCES      │
├─────────────────┤               ├─────────────────┤               ├─────────────────┤
│ Route : /       │               │ Route : /portal │               │ Route : /listings│
│ - Dashboard KPIs│               │ - Quittances    │               │ - Feed annonces │
│ - Propriétés    │               │ - Paiements     │               │ - Mes pubs (CRUD)│
│ - Baux & Tenants│               │ - Incidents     │               │ - Visites       │
│ - Relances/Mises│               │ - Messagerie    │               │ - Pas d'IFU     │
│ - Incidents     │               │ - Départ/Préavis│               │   requis        │
└─────────────────┘               └─────────────────┘               └─────────────────┘
```

### 1. Espace Bailleur (`role: 'bailleur'`)
- **Point d'entrée :** `/` (Tableau de bord).
- **Menu Sidebar dédié :** Dashboard, Propriétés (`/properties`), Baux (`/leases`), Locataires (`/tenants`), Paiements (`/payments`), Relances & Mises en demeure (`/reminders`), Incidents & Travaux (`/incidents`), Messagerie (`/messages`).
- **Isolation :** Les boutons *"Publier une annonce"* et *"Mes publications"* ont été retirés de la barre latérale du bailleur afin de garder un espace de gestion administrative épuré (ils restent naturellement accessibles depuis la page Annonces).
- **Pouvoirs :** Création et validation des baux, émission de quittances certifiées, suivi des impayés, génération de lettres de préavis d'expulsion huissier/tribunal.

### 2. Espace Résident / Locataire (`role: 'locataire'`)
- **Point d'entrée :** `/portal`.
- **Fonctionnalités :**
  - Téléchargement des quittances mensuelles certifiées (PDF avec QR code scellé).
  - Déclaration et paiement de loyer par Mobile Money ou virement.
  - Signalement d'incidents domestiques (plomberie, serrurerie, électricité) avec photo et degré d'urgence.
  - Signature électronique du contrat de bail.
  - Préavis de départ avec suivi de la restitution du dépôt de garantie sous 30 jours.
  - Discussion directe avec son bailleur dans `/messages`.

### 3. Espace Démarcheur / Agent Immobilier (`role: 'demarcheur'`)
- **Point d'entrée :** `/listings`.
- **Règles métier fondamentales :**
  - **AUCUNE OBLIGATION D'IFU :** Les démarcheurs et agents de terrain ne sont pas soumis à l'obligation de renseigner un Numéro d'Identifiant Fiscal Unique (IFU), à l'inverse du bailleur qui le renseigne facultativement pour la conformité fiscale des quittances.
  - **Console "Mes publications" :** Vue dédiée filtrable pour piloter ses mandats : **Modifier** l'annonce, **Mettre en pause** (masquage public immédiat), **Réactiver** ou **Supprimer**.
  - **Publication d'annonces optimisée Afrique :** Prise en compte des spécificités locales (repères géographiques, type de compteur d'eau/courant Cash Power, gardiennage, forage).

---

## 3. Moteur Juridique & Monétaire Multi-Pays (UEMOA / CEMAC / Diaspora)

Le fichier `src/lib/legal/country-tenancy-law.ts` constitue le moteur de conformité juridique de l'application pour les 14 pays membres :

### Zone UEMOA (Union Économique et Monétaire Ouest Africaine) — Monnaie : Franc CFA (XOF)
- **Bénin (BJ) :** Loi n° 2018-12 du 02 juillet 2018. Caution plafonnée à 3 mois, avance plafonnée à 3 mois. Restitution sous 30 jours. Juridiction : Tribunal de Première Instance de Cotonou. Mentions fiscales DGI / ANDF.
- **Côte d’Ivoire (CI) :** Loi n° 2019-576 du 26 juin 2019. Caution plafonnée à 2 mois, avance plafonnée à 2 mois. Juridiction : Tribunal de Commerce / Première Instance d'Abidjan.
- **Sénégal (SN) :** Loi n° 81-52 (Code des obligations civiles et commerciales) & Décrets sur la régulation des loyers. Caution max 2 mois. Juridiction : Tribunal d'Instance de Dakar.
- **Togo (TG) :** Décret n° 2022-034/PR sur le plafonnement des cautions (max 3 mois).
- **Burkina Faso (BF), Mali (ML), Niger (NE), Guinée-Bissau (GW) :** Régimes contractuels conformes aux codes civils nationaux et directives régionales UEMOA.

### Zone CEMAC (Communauté Économique et Monétaire de l'Afrique Centrale) — Monnaie : Franc CFA (XAF)
- **Cameroun (CM) :** Loi régissant les baux d'habitation et commerciaux. Juridiction : TPI de Douala / Yaoundé.
- **Gabon (GA) :** Loi n° 15/88 fixant le régime des loyers. Juridiction : Libreville.
- **Congo (CG), Centrafrique (CF), Tchad (TD), Guinée Équatoriale (GQ).

### Gestion de la Diaspora & Investisseurs Internationaux
- **Lieu de naissance :** Libre et mondial (ex: né à Paris, Lyon, Montréal, Bruxelles, Cotonou ou Abidjan).
- **Lieu de résidence :** Détecté par géolocalisation ou sélection manuelle. Si l'utilisateur réside hors UEMOA/CEMAC (ex: France), le système exige la saisie du **Pays du projet immobilier** (qui doit impérativement faire partie des 14 pays UEMOA/CEMAC).
- **Juridiction applicable :** C'est toujours la situation géographique de l'immeuble qui dicte la loi applicable, la compétence judiciaire et la monnaie du bail.

---

## 4. Fonctionnalités Détaillées par Module

### 📊 1. Dashboard & Analytique Financière (`/`)
- KPI temps réel : Loyers encaissés, Dépenses totales, Loyer moyen, Revenu net, Taux d'occupation global.
- Camembert analytique de recouvrement : À jour (vert), Partiel (ambre), En retard (rose/rouge).
- Alertes de paiement et actions rapides (Enregistrer un loyer, Créer un bail, Relance WhatsApp).

### 🏢 2. Propriétés & Lots (`/properties`)
- Gestion d'immeubles, villas, résidences, appartements, boutiques et bureaux.
- Fiche détaillée de la propriété : localisation, loyer moyen, historique des occupants, charges communes.
- Modal de création de propriété avec répartition par lot.

### 📝 3. Gestion des Baux (`/leases`)
- Génération de contrat de bail juridique avec clauses spécifiques selon le pays du bien.
- Signature électronique bilatérale horodatée (Bailleur & Locataire) avec empreinte cryptographique SHA-256.
- États des lieux d'entrée et de sortie contradictoires (`/leases` via `InspectionModal`).
- Transmission dématérialisée du bail par WhatsApp ou Email.

### 👥 4. Gestion des Locataires (`/tenants`)
- Fiches locataires complètes avec scoring de fiabilité (Excellent, Fiable, À surveiller, À risque).
- Suivi du loyer, date d'entrée, coordonnées téléphoniques directes et statut de paiement.

### 💳 5. Paiements & Quittances Numériques (`/payments`)
- Suivi des flux financiers par canal : Wave, MTN Mobile Money, Moov Money, Orange Money, Virement, Espèces.
- Vérification et scellement des preuves de paiement (reçus de transfert).
- Téléchargement et envoi de la Quittance Officielle PDF avec QR Code.

### 🚨 6. Relances & Procédures de Recouvrement (`/reminders`)
- Matrice de relance graduelle :
  1. Relance courtoise J+3 (WhatsApp / SMS / Email).
  2. Avertissement formel J+7.
  3. Mise en demeure formelle avant poursuites judiciaires (J+15) avec visa de la loi nationale applicable.
  4. Préavis légal de résiliation de bail pour défaut de paiement.

### 🛠️ 7. Maintenance & Incidents Locatifs (`/incidents`)
- Suivi des déclarations des locataires (fuites d'eau, pannes électriques, climatisation, fissures).
- Qualification de la responsabilité légale : Charge Bailleur (gros œuvre, vétusté) vs Charge Locataire (entretien courant).
- Assignation d'artisans locaux, devis et clôture contradictoire.

### 🌐 8. Portail Annonces & Visites (`/listings`)
- Moteur de recherche multi-critères : Pays, Ville, Quartier, Repère local, Type de bien, Budget max en FCFA, Nombre de chambres.
- Calcul de proximité GPS en kilomètres entre le visiteur et le logement.
- Prise de rendez-vous de visite en direct.
- Espace **"Mes publications"** avec gestion de cycle de vie (Modifier, Mettre en pause, Supprimer).

### 💬 9. Messagerie Directe & Notifications (`/messages`)
- Chat bidirectionnel temps réel entre Bailleur, Locataire et Démarcheur.
- Mini-carte de contexte intégrée dans le header : avatar du contact, statut en ligne, vignette du logement concerné, prix du loyer en FCFA.
- Header mobile-responsive ultra-optimisé (aucun chevauchement d'éléments).

### 🔍 10. Guichet Public de Vérification (`/verify/[code]`)
- Page publique autonome permettant à toute autorité de vérifier la validité d'une quittance scellée par son numéro unique ou via scan du QR Code.

---

## 5. Parcours d'Authentification & Onboarding Conversationnel

L'authentification a été modernisée pour offrir une expérience fluide, sécurisée et adaptée aux spécificités africaines :

### Connexion Universelle (`/auth/login`)
- Connexion indifféremment par **Adresse Email** OU **Numéro de téléphone** (support des indicatifs internationaux ex: `+229 97 00 00 00` ou format local).
- Boutons de démonstration instantanée (`quickLogin`) pour tester immédiatement les 3 rôles (Mamadou Diallo, Kofi Mensah, Aïcha Touré).

### Inscription Conversationnelle par Étapes (`/auth/register`)
Le formulaire est orchestré sous forme de questions séquentielles ("questions l'une après l'autre", 6 étapes) :

1. **Étape 1 — Espace en Primo :** Sélection du rôle principal (`Bailleur`, `Locataire`, ou `Démarcheur`).
2. **Étape 2 — Identité :** Nom & Prénoms. Si entreprise/agence : raison sociale. Pour le bailleur : Numéro IFU (facultatif). **Aucun IFU n'est requis ni demandé au démarcheur.**
3. **Étape 3 — Coordonnées :** Email obligatoire ET Numéro de téléphone obligatoire avec sélecteur d'indicatifs nationaux.
4. **Étape 4 — État Civil :** Date de naissance et Lieu de naissance mondial (aucune restriction géographique).
5. **Étape 5 — Résidence & Géolocalisation :**
   - Détection automatique par GPS / Réseau / Fuseau horaire.
   - Si la résidence est hors Afrique (ex: France, Belgique, Canada), une question conditionnelle obligatoire s'affiche : **"Quel est le pays de votre projet immobilier ?"** (limité aux 14 pays UEMOA & CEMAC).
6. **Étape 6 — Sécurité & Validation :** Mot de passe, confirmation et récapitulatif du profil avant création du compte.

---

## 6. Moteur de Documents Officiels & PDF Haute Fidélité

Le service `src/lib/export/pdf-download.ts` génère des fichiers PDF vectoriels A4 par programmation pure avec la bibliothèque `jsPDF` :

1. **Quittance de Loyer Numérique :**
   - En-tête certifié avec identité du bailleur, IFU, coordonnées du locataire, lot concerné.
   - Période de loyer acquittée, montant en chiffres et lettres FCFA, date et canal d'encaissement.
   - Sceau officiel numérique OMEGA LOCAGESTION et QR Code pointant sur l'URL de vérification `/verify/<receiptNumber>`.
2. **Contrat de Bail Conforme UEMOA / CEMAC / OHADA :**
   - 10 à 12 articles contractuels complets rédigés selon le droit applicable du pays.
   - Plafonnement légal des dépôts de garantie et avances.
   - Bloc de signature électronique avec horodatage et hash d'intégrité SHA-256.
3. **Mise en Demeure / Sommation de Payer :**
   - Courrier légal avec mention des délais d'injonction de payer et menaces de résiliation de plein droit devant les tribunaux compétents.

---

## 7. Sécurité, RLS & Multi-Tenancy (Supabase / PostgreSQL)

Le schéma de base de données PostgreSQL (intégré avec Supabase) dispose d'une politique de sécurité de niveau entreprise :

1. **Suppression des politiques permissives :** Aucune règle du type `Allow all access to...`.
2. **Isolation RLS Multi-Tenant étanche :**
   - Table `companies` : Seul le propriétaire authentifié (`user_id = auth.uid()`) peut lire et modifier son organisation.
   - Tables `payments`, `invoices`, `clients`, `products` : Accessibles uniquement si le `company_id` appartient à l'utilisateur connecté (`WHERE user_id = auth.uid()`).
   - Tables `invoice_items`, `invoice_installments` : Protégées par jointure d'appartenance sur la facture parente.
3. **Blocage absolu du rôle Anonyme (`anon`) :** Tout accès non authentifié aux données privées est rejeté au niveau de la couche SQL.
4. **Verrouillage des fonctions RPC & Triggers :**
   - `search_path = public` strictement figé pour prévenir les attaques par détournement de schéma.
   - Droits d'exécution révoqués sur `public` et `anon` pour `auto_confirm_user`, `rls_auto_enable` et `fn_sync_invoice_payments`.
5. **Indexation B-tree haute performance :** Index sur `user_id`, `company_id` et `invoice_id` garantissant des temps de vérification RLS inférieurs à 1 ms.

---

## 8. Cartographie Complète de la Structure des Fichiers

```
LOCAGESTION/
├── GEMINI.md                            # Ce fichier : Guide maître universel du projet
├── README.md                            # Présentation synthétique
├── package.json                         # Dépendances et scripts de démarrage
├── tsconfig.json                        # Configuration TypeScript
├── tailwind.config.ts                   # Thème StayWise, palettes et tokens de style
├── postcss.config.mjs                   # Configuration PostCSS
├── scripts/                             # Scripts de cycle de vie et daemon de production
│   ├── com.locagestion.server.plist    # Définition Launchd macOS (daemon port 3001)
│   ├── start-service.sh                # Démarrage du serveur en arrière-plan
│   ├── stop-service.sh                 # Arrêt propre du processus serveur
│   ├── restart-service.sh              # Redémarrage et vérification de santé HTTP
│   └── status-service.sh               # Vérification du code HTTP et du PID
├── src/
│   ├── app/                             # Pages Next.js 14 (App Router)
│   │   ├── layout.tsx                   # Layout racine avec Metadata & OpenGraph locagestion.site
│   │   ├── robots.ts                    # Génération automatique de robots.txt
│   │   ├── sitemap.ts                   # Génération automatique du sitemap.xml
│   │   ├── page.tsx                     # Tableau de bord principal du Bailleur
│   │   ├── globals.css                  # Feuilles de style Tailwind et animations
│   │   ├── auth/                        # Authentification
│   │   │   ├── login/page.tsx           # Connexion universelle (email ou téléphone)
│   │   │   └── register/page.tsx        # Inscription conversationnelle 6 étapes
│   │   ├── portal/page.tsx              # Espace Résident / Locataire
│   │   ├── listings/page.tsx            # Place de marché annonces & "Mes publications"
│   │   ├── properties/page.tsx          # Gestion du patrimoine immobilier
│   │   ├── leases/                      # Baux & Contrats
│   │   │   ├── page.tsx                 # Liste des baux, états des lieux et signatures
│   │   │   └── new/page.tsx             # Assistant de création d'un nouveau bail
│   │   ├── tenants/page.tsx             # Gestion et scoring des locataires
│   │   ├── payments/page.tsx            # Suivi des encaissements et quittances
│   │   ├── reminders/page.tsx           # Relances d'impayés et mises en demeure
│   │   ├── incidents/page.tsx           # Signalement et maintenance des réparations
│   │   ├── messages/page.tsx            # Messagerie directe avec contexte logement
│   │   ├── verify/[code]/page.tsx       # Guichet public de vérification des quittances
│   │   └── api/notifications/route.ts   # Endpoint API d'envoi d'emails/alertes
│   ├── components/                      # Composants d'interface modulaires
│   │   ├── layout/                      # Layout global
│   │   │   ├── Header.tsx               # En-tête (menu burger, profil, notifications)
│   │   │   ├── Sidebar.tsx              # Barre latérale (navigation selon rôle)
│   │   │   └── Footer.tsx               # Pied de page légal et mentions OHADA
│   │   ├── dashboard/                   # Composants du tableau de bord
│   │   │   ├── StatCards.tsx            # Cartes KPI
│   │   │   ├── RentCollectionBreakdown.tsx # Graphique de recouvrement
│   │   │   ├── RecentPaymentsTable.tsx  # Derniers encaissements
│   │   │   ├── ReceiptModal.tsx         # Modal d'affichage et téléchargement quittance
│   │   │   ├── WhatsAppReminderModal.tsx# Modèle de relance WhatsApp
│   │   │   ├── LandlordIncidentsSection.tsx # Incidents vus par le bailleur
│   │   │   └── QuickActionModal.tsx     # Actions rapides
│   │   ├── listings/                    # Annonces
│   │   │   ├── PublishListingModal.tsx  # Formulaire de publication d'annonce
│   │   │   └── EditListingModal.tsx     # Modal de modification d'une annonce
│   │   ├── leases/                      # Baux
│   │   │   ├── InspectionModal.tsx      # État des lieux contradictoire
│   │   │   ├── TenantSignLeaseModal.tsx # Signature locataire
│   │   │   ├── TransmitLeaseModal.tsx   # Envoi dématérialisé
│   │   │   └── ConfirmTerminateLeaseModal.tsx # Résiliation de bail
│   │   ├── portal/                      # Portail locataire
│   │   │   └── TenantDepartureModal.tsx # Déclaration de départ et restitution caution
│   │   ├── properties/                  # Propriétés
│   │   │   ├── NewPropertyModal.tsx     # Ajout d'immeuble ou maison
│   │   │   └── PropertyDetailModal.tsx  # Fiche technique d'un lot
│   │   ├── reminders/                   # Recouvrement
│   │   │   ├── IssueNoticeModal.tsx     # Émission de mise en demeure
│   │   │   ├── NoticeDetailsModal.tsx   # Détail juridique du préavis
│   │   │   └── NoticeEmailModal.tsx     # Notification électronique
│   │   ├── payments/
│   │   │   └── VerifyPaymentModal.tsx   # Validation de paiement Mobile Money
│   │   ├── profile/
│   │   │   └── UserProfileModal.tsx     # Modification du profil et pays du projet
│   │   ├── search/
│   │   │   └── GlobalSearchModal.tsx    # Recherche globale instantanée
│   │   └── ui/                          # Toasts et composants primitifs
│   │       ├── GlobalCenterToast.tsx    # Notifications centrales
│   │       └── GlobalDownloadToast.tsx  # Confirmation de téléchargement PDF
│   └── lib/                             # Logique métier, services et état global
│       ├── types.ts                     # Modèles TypeScript complets de l'application
│       ├── config/
│       │   └── site.ts                  # Configuration du domaine locagestion.site & URLs
│       ├── context/
│       │   └── space-context.tsx        # Contexte d'authentification et gestion d'espace
│       ├── legal/
│       │   └── country-tenancy-law.ts   # Moteur de lois locatives des 14 pays
│       ├── services/                    # Services métier découpés
│       │   ├── auth-service.ts          # Gestion session, stockage et démo users
│       │   ├── geo-service.ts           # Géolocalisation, GPS et coordonnées UEMOA/CEMAC
│       │   ├── listings-service.ts      # Gestion des annonces et de "Mes publications"
│       │   ├── lease-service.ts         # Cycle de vie et signatures des baux
│       │   ├── payment-service.ts       # Traitement des encaissements
│       │   ├── notice-service.ts        # Recouvrement et mises en demeure
│       │   ├── incident-service.ts      # Incidents domestiques et réparations
│       │   └── inspection-service.ts    # États des lieux
│       ├── export/
│       │   ├── pdf-download.ts          # Moteur de génération PDF haute fidélité
│       │   ├── csv-export.ts            # Exportation comptable au format CSV
│       │   └── download-notifier.ts     # Déclenchement des alertes de téléchargement
│       ├── money/
│       │   └── format.ts                # Formatage monétaire Franc CFA (XOF / XAF)
│       ├── notifications/
│       │   └── action-notifier.ts       # Dispatcher d'événements UI
│       └── data/
│           └── mock-data.ts             # Données de démonstration complètes
```

---

## 9. Technologies & Dépendances

| Technologie | Version | Rôle & Usage dans le projet |
|---|---|---|
| **Next.js** | `14.2.15` | Framework React Fullstack avec App Router, Server/Client Components |
| **React** | `18.3.1` | Bibliothèque d'interface utilisateur réactive |
| **TypeScript** | `5.6.3` | Typage statique strict sur l'ensemble des modules |
| **Tailwind CSS** | `3.4.14` | Framework CSS utilitaire avec palette de couleurs sur mesure |
| **Lucide React** | `0.453.0` | Pack d'icônes vectorielles cohérentes et légères |
| **jsPDF** | `4.2.1` | Génération dynamique côté client de PDF A4 officiels vectoriels |
| **Nodemailer** | `10.5.0` | Envoi d'emails transactionnels (relances, quittances) |
| **clsx & tailwind-merge** | `2.1.1 / 2.5.4` | Concaténation conditionnelle sécurisée des classes CSS |
| **Service Daemon (macOS)** | `launchd` | Démon système persistant sur le port `3001` (`com.locagestion.server`) |

---

## 10. Design System & Principes UI/UX

Le design de LOCAGESTION s'inspire des standards haut de gamme des meilleures PropTechs mondiales (StayWise, Airbnb, Stripe) tout en s'adaptant à l'ergonomie africaine :

- **Couleurs Principales :**
  - **Dark Navigation :** `#0e1117` pour la barre latérale, conférant une ambiance logicielle professionnelle et rassurante.
  - **Brand Pink / Rose Passion :** `#FF385C` / `#E11D48` utilisé pour les boutons d'appel à l'action primaires, les badges dynamiques et les accents forts.
  - **Succès & Paiements à jour :** Émeraude (`emerald-600` / `#059669`) pour les quittances certifiées et le statut locataire fiable.
  - **En attente / Modéré :** Ambre (`amber-500` / `#D97706`).
  - **Retards & Alertes :** Rouge cramoisi (`rose-600` / `red-600`).
- **Typographie :** Polices modernes sans-serif avec hiérarchie nette, graisse `font-black` sur les chiffres clés et montants en FCFA.
- **Ergonomie Mobile & Responsivité :**
  - Pas d'éléments qui se chevauchent : utilisation stricte de `whitespace-nowrap shrink-0` sur les badges d'état.
  - Le coin supérieur gauche de la barre de navigation est réservé exclusivement au bouton Hamburger `[ ☰ ]` sur mobile pour éviter toute collision avec d'anciens boutons de retour.
  - Formulaires aérés avec inputs de grande taille facilitant la saisie tactile sur smartphone.

---

## 11. Instructions Strictes & Règles d'Or pour les Futurs Modèles IA

Tout modèle d'Intelligence Artificielle ou ingénieur reprenant ce projet **DOIT STRICTEMENT RESPECTER** les règles suivantes :

1. **Ne jamais casser la séparation des 3 Espaces :**
   - Bailleur (`/`), Résident/Locataire (`/portal`), Démarcheur (`/listings`).
   - Ne jamais rajouter les boutons d'annonces dans la Sidebar du Bailleur.
2. **Respecter la règle de l'IFU Démarcheur :**
   - **L'IFU n'est jamais obligatoire pour un Démarcheur.** Seul le Bailleur peut le renseigner pour ses quittances fiscales.
3. **Conserver la double compatibilité Email & Téléphone :**
   - Toute fonctionnalité d'authentification ou d'identification doit supporter aussi bien un numéro de téléphone africain/international qu'une adresse email.
4. **Prise en charge de la Diaspora :**
   - Ne jamais contraindre le lieu de naissance ou le pays de résidence à l'Afrique. Si l'utilisateur réside à l'étranger, lui demander simplement le **Pays du projet immobilier** dans l'UEMOA/CEMAC.
5. **Gestion du Serveur de Développement & Daemon :**
   - L'application tourne en permanence sur le **port 3001** (`http://localhost:3001`).
   - Pour redémarrer le service après une modification de structure, exécuter systématiquement :  
     `bash scripts/restart-service.sh` ou `npm run service:restart`.
6. **Vérification de Compilation Obligatoire :**
   - Toujours exécuter `npm run build` (ou `npx tsc --noEmit`) avant de considérer une tâche comme achevée afin de garantir l'absence totale de régressions TypeScript ou Next.js.
7. **Formatage Monétaire :**
   - Les montants doivent toujours être formatés via `formatFCFA()` (`src/lib/money/format.ts`) pour afficher le symbole `FCFA` avec séparation fine des milliers.

---

## 12. Règles de Sécurité Strictes & Modération IA Automatique

Pour garantir la sécurité, la moralité publique, la sérénité des familles et l'intégrité juridique de la plateforme sur les 14 pays des zones UEMOA & CEMAC, **un protocole de sécurité automatisé par IA (LOCAGESTION Shield)** régit l'ensemble de la plateforme :

### 🛡️ 1. Vérification Automatique Obligatoire Avant Toute Publication
- **Portée universelle :** S'applique à tous les espaces (Bailleurs, Démarcheurs, Particuliers) et à tous les modules d'annonces.
- **Délai d'analyse IA ultra-rapide (~2.3 secondes) :** Le contrôle de conformité ne dépasse pas quelques secondes. L'utilisateur visualise un écran de scan interactif en direct (étape 1 : visuels, étape 2 : anti-nudité/sexuel, étape 3 : anti-extorsion/rançon) avec chronomètre et barre de progression.
- **Mise en ligne ou rejet immédiats :**
  - **Si éligible :** L'annonce est validée avec le sceau de certification IA, immédiatement publiée sur toute la plateforme (catalogue public et "Mes publications") et l'utilisateur reçoit une notification instantanée (toast central géant et notification persistante dans la cloche).
  - **Si non éligible :** La publication est immédiatement bloquée avec affichage précis des infractions, une alerte haute priorité est transmise au Super-Admin (`/admin`) et l'utilisateur est notifié du motif pour correction.
- **Passage préalable par l'IA :** Aucune annonce ne peut être rendue publique sur la place de marché sans avoir validé l'analyse sémantique, textuelle et visuelle effectuée par le service `ModerationService` (`src/lib/services/moderation-service.ts`).

### 📷 2. Règle Stricte des Deux (2) Visuels Minimum
- **Obligation absolue :** Chaque annonce doit impérativement compter **au moins deux (2) photos ou vidéos représentatives** du bien immobilier (pièce de vie, chambre, sanitaires, cuisine ou façade).
- **Blocage technique :** Le bouton de soumission est désactivé et toute tentative d'enregistrement comportant 0 ou 1 seule photo est immédiatement rejetée avec un message d'instruction explicite. Les annonces fantômes sans visuels vérifiables sont bannies.

### 🚫 3. Tolérance Zéro Nudité & Propos à Caractère Sexuel
- **Analyse lexicale et heuristique :** Détection automatique des termes explicites, des expressions suggestives, des sollicitations érotiques, du racolage, des chambres de passe, des offres de massages naturistes/sensuels et du libertinage.
- **Analyse des fichiers médias :** Inspection des noms de fichiers, balises URL et descripteurs visuels pour interdire les photos dénudées, en lingerie provocante ou tout contenu NSFW/adulte.
- **Sanction :** Blocage immédiat de la publication (`status: 'rejete'`, sévérité `CRITICAL`).

### 🚨 4. Tolérance Zéro Rançonnement, Extorsion & Arnaques Financières
- **Protection contre le chantage :** Blocage instantané de tout texte contenant des menaces, tentatives de rançonnement ou chantage à la divulgation d'informations privées.
- **Interdiction formelle de paiement avant visite :** Détection et neutralisation des annonces exigeant un transfert d'argent (Wave, TMoney, MTN MoMo, Orange Money, virement bancaire) ou des "frais de réservation / visite" préalables à la visite physique des lieux.

### 👑 5. Compte Super-Administrateur & Console de Gestion (`/admin`)
- **Compte Super-Admin dédié :**  
  - Email : `admin@locagestion.site`  
  - Mot de passe : `Admin@Loca2026!`  
  - Téléphone : `+229 01 96 68 92 77`  
  - Rôle : `admin`
- **Signalement automatique et horodaté :** Dès qu'une infraction est détectée lors d'une tentative de publication ou de modification, une **Alerte de Sécurité** est automatiquement générée et transmise dans la console Super-Admin (`/admin`).
- **Pouvoirs de l'Administrateur :**  
  - Consultation en direct du journal d'infractions (auteur, téléphone, email, extrait incriminé, date exacte).  
  - Maintien du blocage, suppression définitive ou dérogation administrative exceptionnelle.  
  - Supervision globale de toutes les annonces et mise en pause instantanée de toute publication suspecte.

---
*Document scellé et maintenu pour le projet LOCAGESTION.*

