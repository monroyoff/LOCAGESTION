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
13. [Règle d'Or d'Intégrité Absolue des Comptes & Scellement Immuable](#13-règle-dor-dintégrité-absolue-des-comptes--scellement-immuable)
14. [Parcours d'Invitation, Vérification Email & Passeport Solvabilité](#14-parcours-dinvitation-vérification-email--passeport-solvabilité)
15. [Règle d'Exécution Immédiate & Déploiement Instantané Universel (Web, Mobile & Appli)](#15-règle-dexécution-immédiate--déploiement-instantané-universel-web-mobile--appli)
16. [Certification TWA Android, Google Play Store & Digital Asset Links](#16-certification-twa-android-google-play-store--digital-asset-links)
17. [Pérennité du Catalogue d'Annonces & Restitution Multi-Baux Intégrale](#17-pérennité-du-catalogue-dannonces--restitution-multi-baux-intégrale)
18. [Règle d'Or d'Élimination à 100 % des Fuites de Bande Passante & Protection du Quota Vercel](#18-règle-dor-délimination-à-100--des-fuites-de-bande-passante--protection-du-quota-vercel)
19. [Règle d'Or Anti-Contournement de la Formule Sérénité & Cloisonnement Espèces / Mobile Money](#19-règle-dor-anti-contournement-de-la-formule-sérénité--cloisonnement-espèces--mobile-money)
20. [Règle d'Or de Gratuité Intégrale pour Locataires & Démarcheurs et Exclusivité des Formules aux Bailleurs](#20-règle-dor-de-gratuité-intégrale-pour-locataires--démarcheurs-et-exclusivité-des-formules-aux-bailleurs)

---

## 1. Vision & Présentation Générale

**LOCAGESTION** (accessible sur **https://locagestion.site**) est la première plateforme PropTech SaaS d'Afrique francophone dédiée à la gestion locative intégrale, à la sécurisation des baux d'habitation et commerciaux, et à l'intermédiation immobilière de confiance. Projet strictement autonome et indépendant.

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
│ - Relances/Mises│               │ - Messagerie    │               │ - IFU requis    │
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
  - **Passeport Solvabilité Fonctionnel :** Score déterministe démarrant obligatoirement à 100/100 en VERT vif pour tout nouveau compte locataire créé. Évolution et dégradation selon les 4 paliers officiels (Vert 85-100, Bleu 70-84, Orange 50-69, Rouge 0-49) selon la ponctualité des règlements à l'échéance du 5 de chaque mois.
  - **Espace États des Lieux Multi-Contrats :** Prise en compte intégrale de la pluralité des contrats de bail (un locataire peut avoir souscrit plusieurs baux : ex: habitation + local commercial/magasin). Onglet dédié `États des Lieux` (`/portal?tab=edl`), sous-onglet dédié dans `Mon Bail & Contrat`, et sélecteur de contrat dans le dashboard d'accueil permettant d'isoler ou de cumuler les procès-verbaux, relevés contradictoires (Cash Power, eau), remise des clés, téléchargements PDF et galeries de clichés horodatés propres à chaque contrat.

### 3. Espace Démarcheur / Agent Immobilier (`role: 'demarcheur'`)
- **Point d'entrée :** `/listings`.
- **Règles métier fondamentales :**
  - **NUMÉRO IFU EXIGÉ :** Les démarcheurs et agents immobiliers doivent renseigner leur Numéro d'Identifiant Fiscal Unique (IFU) pour la traçabilité légale, la validation de leurs mandats et la protection de leurs honoraires.
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
- **Compteur & Isolation Étanche du Patrimoine :** Le badge de comptage du patrimoine (`X Résidences`) et la liste affichée reflètent **exclusivement** les biens propres du bailleur authentifié (`userProperties.length`). Le compteur global de l'ensemble de la plateforme est strictement réservé au bandeau Super-Admin, empêchant toute fuite de volumétrie globale (ex: 6 résidences de test) dans l'en-tête d'un utilisateur individuel.

### 📝 3. Gestion des Baux (`/leases`)
- Génération de contrat de bail juridique avec clauses spécifiques selon le pays du bien.
- Signature électronique bilatérale horodatée (Bailleur & Locataire) avec empreinte cryptographique SHA-256.
- États des lieux d'entrée et de sortie contradictoires (`/leases` via `InspectionModal`).
- Transmission dématérialisée du bail par WhatsApp ou Email.
- **Champ permanent Référence d'annonce :** Présence systématique d'un champ dédié permettant d'insérer la référence d'une annonce (ex: `A-BJ-17635`) quel que soit le mode de rédaction du bail (conclusion issue d'une annonce ou directe).
- **Dépublication & Retrait Automatique d'Internet :** Dès lors qu'une référence d'annonce est liée à un contrat et que ce dernier est contresigné par le locataire, l'annonce est immédiatement et automatiquement retirée de la diffusion en ligne (`/listings`) avec motif d'attribution et notification horodatée.

### 👥 4. Gestion des Locataires (`/tenants`)
- Fiches locataires complètes avec scoring de fiabilité (Excellent, Fiable, À surveiller, À risque).
- Suivi du loyer, date d'entrée, coordonnées téléphoniques directes et statut de paiement.
- **Moteur de Recherche Multi-Critères :** Filtrage instantané et souple par **Matricule officiel** (ex: `LOCA-MAT-BJ-17635`, `17635`), **Référence de bail** (ex: `BAIL-2026-421`, `421`), **Référence d'annonce** (ex: `A-BJ-17635`, `17635`), **Nom & Prénom** (dans l'ordre direct ou inversé), **Lieu géographique** (quartier, ville, pays, repère local, adresse), désignation du bien et contacts.

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
- Moteur de recherche multi-critères : Référence d'annonce (`A-BJ-17635`), Pays, Ville, Quartier, Repère local, Type de bien, Budget max en FCFA, Nombre de chambres.
- Filtre rapide **« 7 derniers jours »** et tri **« Plus récents d'abord »**.
- Référence unique certifiée par annonce : format distinctif, court et pro `A-<PAYS>-<NUMERO>` (ex: `A-BJ-17635`), intégrant les initiales officielles du pays du bien.
- Calcul de proximité GPS en kilomètres entre le visiteur et le logement.
- Prise de rendez-vous de visite en direct.
- Espace **"Mes publications"** avec gestion de cycle de vie (Modifier, Mettre en pause, Supprimer, Booster).
- **Moteur de Promotion & Mise en Avant Immédiate (3 Packs de Boost Mobile Money) :**
  Tout utilisateur publiant un bien (Bailleur, Démarcheur ou Locataire) peut mettre en avant son annonce via FedaPay Live (Wave, MTN Mobile Money, Moov Flooz, Orange Money, Carte Bancaire) :
  1. **⚡ Flash Week-End (3 jours) — 1 000 FCFA :** Badge `⭐ En Vedette`, épinglé en tête des résultats le vendredi, samedi et dimanche pour les démarches et visites groupées du samedi.
  2. **🔥 Boost Flash (7 jours) — 2 500 FCFA :** Badge `🔥 Sponsorisé`, épinglage permanent en haut de page pendant 7 jours, cadre lumineux doré et x3 demandes directes WhatsApp.
  3. **👑 Boost Élite (14 jours) — 4 500 FCFA (« Le plus populaire ») :** Badge `👑 Coup de Cœur`, top position absolue garantie sur `/listings` et `/accueil`, notification prioritaire aux locataires solvables 100/100 de la zone.
  - Déclenchement instantané : redirection directe sans attendre vers le guichet sécurisé Mobile Money FedaPay Live.
  - Scellement automatique : dépublication et fin de mise en avant immédiate dès conclusion et signature du bail.

### 💬 9. Messagerie Directe & Notifications (`/messages`, Cloche Header)
- Chat bidirectionnel temps réel entre Bailleur, Locataire et Démarcheur.
- Mini-carte de contexte intégrée dans le header : avatar du contact, statut en ligne, vignette du logement concerné, prix du loyer en FCFA.
- Header mobile-responsive ultra-optimisé (aucun chevauchement d'éléments).
- **Isolation Stricte Multi-Tenants des Conversations (`ConversationService`) :** Les discussions et messages directs sont filtrés avec une étanchéité absolue (`isUserConversationParticipant`). Un utilisateur (démarcheur, locataire ou bailleur) ne peut accéder, compter ou visualiser QUE les conversations dont il est explicitement participant (soit l'Auteur/Mandataire ayant publié l'annonce, soit le Visiteur/Candidat/Locataire ayant sollicité le bien). Aucun démarcheur ou bailleur tiers ne peut voir les échanges d'autres utilisateurs. Seul le Super-Admin dispose de droits de supervision.
- **Horodatage Précis & Résolu des Notifications :** Les notifications de la cloche (bailleurs et locataires) n'affichent plus de mention figée « À l'instant ». Elles enregistrent un horodatage ISO `createdAt` et une heure `time` (HH:mm) réels. Le formateur `formatNotificationTime` calcule dynamiquement :
  - Moins de 2 min : `À l’instant (HH:mm)`
  - Moins d'une heure : `Il y a X min (HH:mm)`
  - Aujourd'hui : `Aujourd’hui à HH:mm`
  - Hier : `Hier à HH:mm`
  - Antérieur : `JJ/MM à HH:mm`
  Une migration automatique rétrocompatible rétablit l'heure exacte des anciennes notifications stockées localement à partir de leur ID ou horodatage d'origine.
- **Tri Chronologique Décroissant Universel (Plus récent au sommet) :** Dans tous les espaces (Locataire `/portal`, Bailleur `/`, Démarcheur `/listings`, Admin `/admin`) et sur tous les formats (Web, Mobile, PWA, TWA Android), les notifications de la cloche et des tableaux de bord sont strictement triées par `compareNotificationsDesc`. La notification la plus récente (« À l’instant ») s'affiche impérativement tout en haut (index 0), tandis que les notifications antérieures descendent progressivement en dessous. Aucune notification ne doit s'afficher à l'envers.

### 🔍 10. Guichet Public de Vérification (`/verify/[code]`)
- Page publique autonome permettant à toute autorité de vérifier la validité d'une quittance scellée par son numéro unique ou via scan du QR Code.

---

## 5. Parcours d'Authentification & Onboarding Conversationnel

L'authentification a été modernisée pour offrir une expérience fluide, sécurisée et adaptée aux spécificités africaines :

### Connexion Universelle (`/auth/login`)
- Connexion indifféremment par **Adresse Email** OU **Numéro de téléphone** (support des indicatifs internationaux ex: `+229 97 00 00 00` ou format local).
- Comptes officiels et authentiques scellés pour tester les différents rôles (Bailleur, Locataire, Démarcheur, Super-Admin).

### Inscription Conversationnelle par Étapes (`/auth/register`)
Le formulaire est orchestré sous forme de questions séquentielles ("questions l'une après l'autre", 6 étapes) :

1. **Étape 1 — Espace en Primo :** Sélection du rôle principal (`Bailleur`, `Locataire`, ou `Démarcheur`).
2. **Étape 2 — Identité :** Nom & Prénoms. Si entreprise/agence : raison sociale. Pour le bailleur : Numéro IFU (facultatif). Pour le démarcheur et agent : **Numéro IFU exigé** pour la conformité et traçabilité légale.
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
   - Sceau officiel numérique LOCAGESTION et QR Code pointant sur l'URL de vérification `/verify/<receiptNumber>`.
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
2. **Respecter la règle de l'IFU Démarcheur & Agent :**
   - **L'IFU est exigé pour les démarcheurs et agents immobiliers** afin de garantir la conformité des mandats, la traçabilité des intermédiaires et la protection légale des commissions.
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
8. **Élimination à 100 % des Fuites de Bande Passante & Protection des Quotas Vercel (Règle d'Or Inviolable) :**
   - **Vérification systématique obligatoire à chaque intervention :** Tout modèle IA ou ingénieur reprenant le projet DOIT consulter et valider que l'architecture anti-fuite de bande passante demeure rigoureusement intacte.
   - **Polling strictement conditionné à la visibilité :** Aucun polling régulier ne doit s'exécuter en arrière-plan. Dès que l'onglet du navigateur ou l'application passe en arrière-plan (`document.visibilityState !== 'visible'`), tout intervalle de synchronisation doit être immédiatement détruit (`clearInterval`). La synchronisation ne reprend qu'au retour effectif en avant-plan (`visibilitychange`, `focus`, `online`).
   - **Réponse HTTP 304 Not Modified (0 octet) :** La route `/api/sync` doit toujours calculer son ETag MD5 et retourner immédiatement un code HTTP 304 Not Modified (0 octet de payload) ou un payload JSON minifié `notModified: true` lorsqu'aucune donnée n'a été altérée côté serveur.
   - **Mise en cache Edge Vercel active (`x-vercel-cache: HIT`) :** Interdiction absolue de réintroduire des en-têtes anti-cache globaux (`/(.*): max-age=0, no-cache`) dans `vercel.json` ou `next.config.mjs`. Les assets statiques, images et routes de contrôle de version doivent être servis par le réseau Edge CDN Vercel pour préserver le quota Fast Origin Transfer sous le seuil de sécurité.
   - **Anti-boucle POST :** Toute écriture locale vers le serveur (`SyncService.push()`) doit impérativement comparer son empreinte avec `lastPushedPayloadStr` pour empêcher toute boucle d'écriture réentrante infinie.

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
- **Compte Super-Admin dédié (Sécurisé & Cloisonné) :**  
  - Email : `admin@locagestion.site`  
  - Mot de passe officiel scellé : `Omega#Admin2027!LocaSecurity` (compatible `Admin2027!LocaSecurity` et mot de passe maître)  
  - Téléphone : `+229 01 96 68 92 77`  
  - Rôle : `admin`
  - Invalidation globale : `adminSessionVersion = 'sec_v2_20261118_revoked_all'` déconnecte automatiquement tout appareil ayant conservé l'ancienne session.
  - RLS PostgreSQL & Applicatif : Matrice complète définie dans `supabase/migrations/20261118_rls_compartments_policies.sql`.
- **Signalement automatique et horodaté :** Dès qu'une infraction est détectée lors d'une tentative de publication ou de modification, une **Alerte de Sécurité** est automatiquement générée et transmise dans la console Super-Admin (`/admin`).
- **Pouvoirs de l'Administrateur :**  
  - Consultation en direct du journal d'infractions (auteur, téléphone, email, extrait incriminé, date exacte).  
  - Maintien du blocage, suppression définitive ou dérogation administrative exceptionnelle.  
  - Supervision globale de toutes les annonces et mise en pause instantanée de toute publication suspecte.

---

## 13. Règle d'Or d'Intégrité Absolue des Comptes & Scellement Immuable

> **RÈGLE INVIOLABLE SUR TOUTE LA PLATEFORME (WEB, MOBILE ET APPLICATION)**  
> Tout développeur, administrateur ou modèle d'Intelligence Artificielle intervenant sur LOCAGESTION doit obligatoirement et strictement appliquer cette règle sans aucune exception.

### 🔒 1. Unicité Stricte et Absolue (Règle 1:1:1:1:1)
Chaque compte utilisateur sur LOCAGESTION est fondé sur une relation bijective et rigoureuse :
- **1 seul compte**
- **1 seul et unique mot de passe** (interdiction formelle et définitive d'avoir ou de tolérer 2 mots de passe pour un même compte).
- **Mots de passe obligatoirement distincts entre comptes différents :** Deux comptes différents ne doivent JAMAIS partager le même mot de passe (ex : compte bailleur `jobovog@gmail.com` avec son mot de passe unique `Forever1122$`, distinct du compte locataire `jojovog007@gmail.com` avec son mot de passe unique `Lolo1000$`, et du compte locataire `theodoradjigla@gmail.com` avec son mot de passe unique `Jesusmonroi@2026`).
- **1 seul numéro de téléphone**
- **1 seule adresse email**
- **1 seul matricule officiel unique** (attribué de façon déterministe et certifiée).

### 🛡️ 2. Scellement Définitif Post-Création
Dès la création ou l'enregistrement d'un compte sur le Web, Mobile ou Appli :
- **L'Identité Civile (Nom de famille & Prénom(s))** est **SCELLÉE & IMMUABLE**.
- **L'Adresse Email** est **SCELLÉE & IMMUABLE**.
- **Le Numéro de Téléphone** est **SCELLÉ & IMMUABLE**.
- **Le Matricule Officiel Unique** est **SCELLÉ & IMMUABLE**.
Ces informations garantissent la force probante juridique des baux électroniques et quittances certifiées (QR code scellé vérifiable par les tribunaux, banques et administrations). Elles ne peuvent en aucun cas être altérées après création du compte.

### 🔑 3. Seul le Mot de Passe est Modifiable
- **Le mot de passe est l'unique identifiant modifiable** du compte utilisateur.
- Sa modification s'effectue depuis la procédure sécurisée **« Mot de passe oublié ? »** accessible sur la page de connexion (`/auth/login`).

### 👤 4. Personnalisation Garantie des Préférences Visuelles & Commerciales
- **Nom d'entreprise / Agence :** Optionnel pour les bailleurs et démarcheurs. Dès sa saisie, modification ou suppression dans le profil, il est immédiatement répercuté et garanti de façon pérenne sur toutes les annonces publiées, les en-têtes et les quittances, sans jamais être écrasé par une valeur mockée par défaut.
- **Photo de profil / Avatar :** Tout changement d'avatar ou import de photo par l'utilisateur (bailleur, démarcheur, locataire) est immédiatement synchronisé et persisté de manière définitive sur tous les espaces (Web, Mobile, Application) sans jamais être écrasé par les images Unsplash mockées initiales.

---

## 14. Parcours d'Invitation, Vérification Email & Passeport Solvabilité

### 📩 1. Invitation & Onboarding Locataire
- **Champs séparés sur la même ligne :** Dans la modale d'invitation d'un nouveau locataire (`/tenants`), les champs **Nom** et **Prénom** sont distincts mais disposés côte à côte sur la même ligne (`grid grid-cols-2 gap-3`).
- **Expédition Multi-Canal Automatique :** Lors de l'envoi de l'invitation, le lien unique sécurisé est automatiquement expédié par **Email** (via SMTP Gmail / API) et par **SMS** (via passerelle SMS / lien de composition natif), en plus du lien direct WhatsApp et du bouton Copier.

### 🛡️ 2. Confirmation d'Email Strictement Obligatoire
- **Interdiction d'accès anticipé :** Tout compte créé reste en statut `emailVerified: false` avec connexion automatique bloquée (`autoLogin: false`). Aucune redirection vers l'Espace Locataire ou Bailleur n'est autorisée avant confirmation.
- **Validation bilatérale :** L'activation s'effectue soit par saisie du code à 6 chiffres dans l'interface, soit par clic sur le lien sécurisé `/auth/verify?email=...&code=...`.
- **Blocage à la connexion :** Tout utilisateur non vérifié tentant de se connecter sur `/auth/login` est immédiatement notifié et bloqué jusqu'à confirmation de son email.

### 🟢 3. Passeport Solvabilité Locataire
- **Score initial garanti :** Tout nouveau compte locataire débute avec un score maximal de **100/100 en VERT vif**.
- **Paliers d'évolution :**
  - **85 - 100 :** Vert (Excellent payeur, ponctualité exemplaire).
  - **70 - 84 :** Bleu (Bon payeur, retards occasionnels régularisés sous 5 jours).
  - **50 - 69 :** Orange (Paiements partiels ou retards fréquents au-delà du 10 du mois).
  - **0 - 49 :** Rouge (Impayés prolongés, mises en demeure).

---

## 15. Règle d'Exécution Immédiate & Déploiement Instantané Universel (Web, Mobile & Appli)

> **RÈGLE FONDAMENTALE D'INGÉNIERIE & D'EXÉCUTION INSTANTANÉE**  
> **Toute modification, correction ou mise à jour effectuée dans Antigravity sur le projet LOCAGESTION doit immédiatement et instantanément s'exécuter sur toute la plateforme, sur tous les espaces (Bailleur, Locataire, Démarcheur, Admin), sur Web, Mobile et Application afin que les utilisateurs aient en permanence et sans délai la dernière version à jour.**

### ⚡ Directives d'Application Strictes :
1. **Transversalité & Cohérence Omnicanale :**
   - Aucune modification ne doit rester isolée sur un seul écran ou dans un seul espace.
   - Toute donnée, information d'identité (nom, prénom, matricule, coordonnées), modalité contractuelle ou correctif visuel doit se propager instantanément et de façon cohérente à travers l'ensemble des modules : Espace Bailleur (`/`), Espace Résident / Locataire (`/portal`), Place de marché Annonces (`/listings`), Console Admin (`/admin`), formats d'export PDF officiels et messagerie.
2. **Exécution & Validation Immédiates :**
   - Chaque intervention doit être compilée (`npm run build`) et validée avec zéro erreur.
   - Le service local en arrière-plan (daemon macOS sur le port 3001) doit être immédiatement testé et confirmé actif (`HTTP 200`).
3. **Poussée Git & Déploiement Cloud Automatique :**
   - Tout lot de modifications validé doit être immédiatement commité et poussé sur la branche principale (`git push origin main`), déclenchant ainsi le déploiement continu instantané sur la plateforme de production en ligne (`https://locagestion.site` / Vercel).
4. **Synchronisation du Cache Utilisateur :**
   - Les modifications doivent s'exécuter en temps réel sans nécessiter de purge manuelle de cache par les utilisateurs sur Web, navigateur mobile ou application PWA. L'endpoint d'API de synchronisation (`/api/sync`) doit être systématiquement notifié.

---

## 16. Certification TWA Android, Google Play Store & Digital Asset Links

> **CONFORMITÉ APPLICATION MOBILE NATIVE ANDROID (TWA / GOOGLE PLAY STORE)**  
> **L'application Android LOCAGESTION (`com.locagestion.app`) repose sur l'architecture Trusted Web Activity (TWA). Pour garantir un affichage en plein écran 100% natif (sans logo Chrome au démarrage ni barre d'adresse URL supérieure), la validation cryptographique Digital Asset Links doit être rigoureusement maintenue.**

### 🔑 1. Double Empreinte SHA-256 Obligatoire
Le fichier `public/.well-known/assetlinks.json` et la route API `src/app/.well-known/assetlinks.json/route.ts` doivent **impérativement** contenir les deux empreintes SHA-256 suivantes dans `sha256_cert_fingerprints` :
1. **Clé officielle de signature Google Play Store :**  
   `D1:83:13:89:32:2D:99:6A:3D:0D:46:6C:96:19:5B:CA:82:B4:93:F4:A2:52:57:6D:7C:91:AC:C9:CC:DC:15:F3`  
   *(Appliquée automatiquement par Google Play lors du téléchargement de l'application depuis le Play Store).*
2. **Clé d'importation / Keystore local (`signing.keystore`) :**  
   `17:D7:54:87:D1:95:11:84:F3:97:FC:6C:52:5F:A5:12:ED:EE:E5:AF:D4:82:BC:EE:5A:62:3A:89:C4:B2:A3:8F`  
   *(Utilisée pour les installations directes de test par fichier APK).*

### 🚫 2. Interdiction Absolue de Redirection HTTP sur le Domaine Apex
- L'URL `https://locagestion.site/.well-known/assetlinks.json` doit répondre **directement en HTTP 200 OK** avec le header `Content-Type: application/json`.
- **Aucune redirection (301, 302, 307, 308)** vers `www.locagestion.site` n'est permise pour ce fichier. Dans Vercel, le domaine `locagestion.site` doit être configuré avec `"redirect": null` pour servir la production directement, car le protocole de vérification TWA Android rejette immédiatement toute redirection pour des raisons de sécurité.

---

## 17. Pérennité du Catalogue d'Annonces & Restitution Multi-Baux Intégrale

> **GARANTIE DE DIFFUSION PERMANENTE & STABILITÉ MULTI-BAUX**

### 🌐 1. Sanctuaire des Annonces de Référence (Immunité Anti-Purge)
- Les annonces certifiées et officielles de référence portant un préfixe d'ID `list-` ou une référence officielle `A-<PAYS>-XXXXX` (notamment `A-BJ-17635` pour le Studio UAC Calavi) bénéficient d'une **immunité absolue contre la purge automatique des 30 jours**.
- Le moteur `ListingsService.getCustomListings()` réinjecte automatiquement le catalogue de référence dès que le stockage local est vide ou altéré.
- Le moteur de synchronisation `SyncService.sync()` synchronise dorénavant les annonces serveur (`/api/sync`) vers le cache local sur Web et Mobile.

### 📝 2. Restitution Plurielle des Baux de Jojo VOG
- Le compte scellé locataire `jojovog007@gmail.com` (`LOCA-MAT-BJ-17635`) dispose en permanence de ses 3 baux actifs multi-bailleurs :
  1. `BAIL-2026-421` (Chambre Salon Sanitaire Allada — Bailleur VOGLOSSOU JOHANE — 25 000 FCFA — Actif)
  2. `BAIL-2026-MAG-102` (Magasin A4 Dantokpa — Bailleur MAMADOU DIALLO — 65 000 FCFA — Actif)
  3. `BAIL-2026-COM-205` (Boutique N° 12 Akpakpa — Bailleur AÏCHA TOURÉ — 40 000 FCFA — Actif)
- Un quatrième bail de test en attente de signature (`BAIL-2026-422`, Studio Meublé Calavi, 35 000 FCFA) est rattaché à l'annonce `A-BJ-17635`. Sa contresignature dans l'Espace Locataire déclenche le retrait immédiat de l'annonce d'Internet avec notification horodatée.
- Le comparateur d'appartenance `isLeaseMatchingUser` inspecte rigoureusement `l.tenantMatricule || (l as any).matricule` et `isCanonicalJojoVog` pour garantir un affichage sans faille dans `/portal`.

---

## 18. Règle d'Or d'Élimination à 100 % des Fuites de Bande Passante & Protection du Quota Vercel

> **RÈGLE ARCHITECTURALE VITALE POUR LA VIABILITÉ DE LA PLATEFORME (VERCEL & FORFAITS DATA MOBILES)**  
> **L'ensemble du code de LOCAGESTION doit garantir une consommation de bande passante rigoureusement minimale sur le cloud Vercel (Fast Origin Transfer) ainsi que sur les terminaux mobiles et ordinateurs des utilisateurs. Tout modèle IA ou développeur doit obligatoirement respecter les 4 piliers ci-dessous.**

### 🛑 1. Pilier 1 — Polling Stoppé en Arrière-Plan (Visibility Gating)
- **Principe absolu :** ZÉRO requête de synchronisation ou de fond ne doit être émise lorsque l'utilisateur n'est pas activement sur l'application.
- **Mécanisme technique :**
  - Le service `SyncService.init()` écoute l'événement `document.addEventListener('visibilitychange')`.
  - Dès que `document.visibilityState !== 'visible'` (onglet masqué, fenêtre minimisée, écran éteint sur smartphone, changement d'application sur Android), le timer est **immédiatement détruit** via `clearInterval(syncIntervalId)` et mis à `null`.
  - Lorsque l'utilisateur revient en avant-plan (`document.visibilityState === 'visible'`), une synchronisation unique de réveil est déclenchée, puis un nouvel intervalle temporisé démarre.
- **Intervalle de veille active :** En premier plan, la fréquence de synchronisation est fixée à **45 secondes** (`SYNC_INTERVAL_ACTIVE = 45000`). Toute fréquence inférieure (ex: 5s ou 10s) pour un polling global est strictement interdite car elle épuise inutilement les quotas serveur.
- **Rattrapage d'événements :** En complément, les événements utilisateur naturels (`window.addEventListener('focus')`, `online`, `pageshow`) assurent la mise à jour immédiate sans surcharger l'intervalle régulier.

### ⚡ 2. Pilier 2 — Réponse Instantanée HTTP 304 Not Modified (0 Octet Transféré)
- **Empreinte cryptographique ETag (MD5) :**
  - Dans `/api/sync`, le serveur génère un hash MD5 déterministe de l'état agrégé des données (`leases`, `notifications`, `users`, `listings`, `properties`, etc.).
  - Le hash est renvoyé au client sous forme d'en-tête standard `ETag: "<hash>"`.
  - Le client (`SyncService`) stocke ce hash dans `localStorage` (`locagestion:sync_etag`) et le transmet lors de chaque appel via le header `If-None-Match` ainsi que le paramètre d'URL `?etag=`.
- **Court-circuit HTTP 304 :**
  - Si le hash transmis par le client correspond exactement à l'ETag actuel du serveur, ce dernier répond **immédiatement en HTTP 304 Not Modified avec un corps vide (0 octet)** ou un JSON ultra-minifié de confirmation `{ success: true, notModified: true, etag }` (71 octets au lieu de dizaines de kilo-octets).
  - Aucune donnée métier n'est sérialisée ni renvoyée sur le réseau quand rien n'a changé, divisant la bande passante par plus de 1000.

### 🌐 3. Pilier 3 — Mise en Cache Edge Vercel Active (`x-vercel-cache: HIT`)
- **Préservation du Fast Origin Transfer Vercel :** Le quota gratuit ou payant Vercel ("Fast Origin Transfer") facture chaque octet transféré directement depuis les fonctions Serverless / Node.js vers l'extérieur. Tout ce qui est mis en cache sur le réseau CDN Edge Vercel ne consomme pas le quota Fast Origin !
- **Configuration Edge CDN (`vercel.json`) :**
  - Les bundles JavaScript et styles (`/_next/static/(.*)`) sont mis en cache immuable : `Cache-Control: public, max-age=31536000, immutable`.
  - Les médias, icônes et polices (`/(images|icons|fonts|assets)/(.*)`) sont mis en cache longue durée : `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`.
  - Les routes légères de détection de version (`/api/version`) disposent d'un cache Edge avec révalidation en arrière-plan : `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.
- **Interdiction Formelle :** Ne **JAMAIS** réintroduire dans `vercel.json` ou dans les middlewares une directive globale anti-cache du type `"/(.*)": "max-age=0, no-cache, no-store"` qui forcerait Vercel à désactiver son CDN mondial et acheminerait chaque requête statique vers l'origine.

### 🛡️ 4. Pilier 4 — Garde-Fou Anti-Boucle Infinie d'Écriture (Push Loop Guard)
- **Problème prévenu :** Dans une architecture de synchronisation bidirectionnelle, un client qui fusionne les données serveur et déclenche un `push()` immédiat au serveur risquerait de provoquer une cascade infinie de requêtes POST.
- **Verrou d'intégrité :**
  - `SyncService` maintient en mémoire la variable `lastPushedPayloadStr`.
  - Avant tout appel `fetch('/api/sync', { method: 'POST' })`, le payload est sérialisé et comparé à `lastPushedPayloadStr`.
  - Si le contenu est identique au dernier push validé, l'émission est **immédiatement bloquée** côté client, protégeant la plateforme contre toute boucle réentrante.

### 📋 5. Protocole de Vérification Systématique pour les Modèles IA & Développeurs
Avant de conclure toute tâche impliquant la synchronisation, le réseau, les appels API ou le fichier `vercel.json`, l'IA doit valider les 5 points de contrôle suivants :
1. ✅ **Visibilité :** Le polling s'arrête-t-il bien quand l'onglet passe en arrière-plan ?
2. ✅ **ETag / 304 :** L'appel GET `/api/sync` avec `If-None-Match` renvoie-t-il bien un HTTP 304 ou `notModified: true` ?
3. ✅ **Fréquence :** Aucun `setInterval` régulier n'a-t-il une période agressive inférieure à 45 secondes pour la synchronisation générale ?
4. ✅ **Headers Edge :** Le fichier `vercel.json` maintient-il la mise en cache CDN Edge des assets et routes appropriées ?
5. ✅ **Zéro boucle :** Aucun composant React ne déclenche-t-il de `SyncService.sync()` ou `push()` à l'intérieur d'un rendu non stabilisé (`useEffect` sans dépendances appropriées) ?

---

## 19. Règle d'Or Anti-Contournement de la Formule Sérénité & Cloisonnement Espèces / Mobile Money

> **RÈGLE COMMERCIALE & ARCHITECTURALE ESSENTIELLE POUR LA VIABILITÉ ÉCONOMIQUE DE LOCAGESTION**  
> **La Formule Sérénité (0 FCFA d'abonnement fixe par mois) tire son modèle de rémunération de la commission de 2% prélevée sur chaque loyer réglé via la passerelle Mobile Money (Wave, MTN MoMo, Moov Money, Orange Money, Celtiis Cash, Carte Bancaire). Tout modèle IA et tout développeur doit impérativement respecter les règles de cloisonnement ci-dessous.**

### 🛑 1. Vulnérabilité de Contournement Neutralisée
- **Faille prévenue :** Un bailleur ayant atteint le plafond de 2 baux en Formule Découverte active la Formule Sérénité à 0 FCFA pour débloquer la signature de baux illimités (3 baux et plus). S'il s'arrange ensuite avec ses locataires pour percevoir les loyers en espèces (« de la main à la main ») ou par virement bancaire personnel en dehors de LOCAGESTION, il profiterait d'un accès illimité à vie sans que la plateforme ne perçoive le moindre centime.
- **Principe de cloisonnement strict :**
  - **Formule Découverte (0 FCFA / 1 à 2 baux max) :** Tous les modes de paiement (Espèces, Virement et Mobile Money) sont tolérés sans commission pour permettre au bailleur de tester la plateforme.
  - **Formule Sérénité (0 FCFA fixe / Baux Illimités) :** STRICTEMENT RÉSERVÉE aux encaissements automatisés par Mobile Money via la passerelle intégrée. L'enregistrement manuel de paiements en espèces (`especes`) ou virements bancaires hors-plateforme (`virement`) est **rigoureusement verrouillé et désactivé** (`PlanService.canRecordPaymentMethod`). Les quittances scellées avec QR code de vérification sont émises exclusivement pour les loyers acquittés via la plateforme.
  - **Formule Entreprise & Pro (5 000 FCFA / 30 jours) :** Encaissements en **Espèces, Chèques, Virements et tous canaux 100% LIBRES & ILLIMITÉS à 0% de commission plateforme**. Quittances certifiées scellées illimitées pour l'ensemble des modes de paiement.

### ⚡ 2. Implémentation & Garde-Fous Techniques
1. **Verrouillage Intégral du Bouton « Encaisser Loyer » (`PlanService.canLandlordRecordManualPayment`) :**
   - Dès lors qu'un bailleur est en Formule Sérénité, tout clic sur le bouton **« Encaisser loyer »** (dans le Header, dans `/payments` ou dans `/tenants`) est **immédiatement refusé et bloqué à la source**.
   - Le système affiche la notification de blocage officielle :
     > *« La Formule Sérénité (0 FCFA fixe) repose exclusivement sur l’encaissement automatisé par Mobile Money (Wave, MTN MoMo, Moov Money, Orange Money, Celtiis). L’encaissement manuel de loyers est strictement réservé à la Formule Entreprise & Pro (5 000 FCFA / 30 jours, 0% de commission). »*
   - La modal d'activation de la Formule Pro (`UpgradePlanModal` avec onglet Pro pré-sélectionné) s'ouvre automatiquement pour permettre un surclassement instantané.
2. **Modal d'Action Rapide (`QuickActionModal.tsx`) :**
   - Si la modal est invoquée avec l'action `new_payment` sous Formule Sérénité, elle affiche directement un écran de blocage hermétique avec bouclier d'alerte, explication détaillée et bouton de bascule vers le Pack Pro.
3. **Tableau de Bord des Paiements (`/payments`) :**
   - Un bandeau pédagogique rappelle au bailleur en Sérénité que ses encaissements et quittances sont automatisés à 100% via Mobile Money, avec un raccourci pour débloquer les encaissements manuels en passant en Pro.
4. **Landing Page & Grille Tarifaire (`LandingPricing.tsx` & `UpgradePlanModal.tsx`) :**
   - Affichage transparent dans les cartes de prix et la FAQ de la règle : Sérénité = 100% Mobile Money automatisé (reversement programmé dès le 7 du mois de 98% net, encaissements manuels bloqués), Pro = 5 000 FCFA / 30 jours, tous canaux libres à 0% de commission.
5. **Console de Déboursement & Reversements Bailleurs Super-Admin (`/admin` & `PayoutService`) :**
   - Suivi comptable en temps réel des encaissements Mobile Money FedaPay (100 %) conservés sur le compte marchand `acc_3137475447` (MONROY AG).
   - Décomposition mathématique scellée : 2 % conservés par LOCAGESTION (commission plateforme Sérénité) et 98 % nets à reverser aux bailleurs partenaires (reversement programmé dès le 7 du mois).
   - Gestion des déboursements classiques (retraits et virements vers les comptes Wave, MTN, Moov ou bancaires des bailleurs) pendant la suspension temporaire de l'API Payouts automatisée de FedaPay.
   - Scellement des preuves de virement (référence de transaction, opérateur, date/heure, administrateur) et notification officielle automatique délivrée au bailleur dans sa cloche.

---

## 20. Règle d'Or de Gratuité Intégrale pour Locataires & Démarcheurs et Exclusivité des Formules aux Bailleurs

> **RÈGLE MÉTIER & COMMERCIALE FONDAMENTALE INVIOLABLE**  
> **La plateforme LOCAGESTION reste et demeure 100 % ENTIÈREMENT GRATUITE DANS SON INTÉGRALITÉ pour tous les Locataires et tous les Démarcheurs (agents immobiliers indépendants publiant des annonces de mandats). Les formules tarifaires et forfaits d'abonnement (Découverte 0 FCFA, Sérénité 2%, Entreprise & Pro 5 000 FCFA) sont destinées EXCLUSIVEMENT aux BAILLEURS (propriétaires et gestionnaires de parcs immobiliers).**

### 1. Gratuité Perpétuelle du Locataire (`role: 'locataire'`)
- Accès illimité et permanent au Portail Résidentiel (`/portal`).
- Recherche géolocalisée et consultation d'annonces.
- Signature électronique certifiée du contrat de bail conforme OHADA.
- Paiement de loyer sécurisé par Mobile Money (Wave, MTN, Moov, Orange, Celtiis) ou déclaration de virement.
- Émission et téléchargement illimités des Quittances Officielles PDF certifiées avec QR Code scellé.
- Téléversement contradictoire des États des Lieux avec photos horodatées.
- Passeport Solvabilité certifié gratuit (démarrage à 100/100).
- Signalement des pannes et messagerie directe avec le bailleur.
- **Zéro abonnement, zéro frais d'inscription, zéro commission prélevée sur le locataire.**

### 2. Gratuité Perpétuelle du Démarcheur (`role: 'demarcheur'`)
- Accès illimité et sans abonnement au Portail Annonces (`/listings`).
- Publication, modification, mise en pause et suppression de mandats immobiliers sans limite de quota d'annonces.
- Organisation des visites et messagerie en direct avec les candidats locataires.
- Seul le service optionnel de mise en avant promotionnelle (Boost FedaPay Live : 1 000 FCFA, 2 500 FCFA ou 4 500 FCFA) est facturé à l'acte s'il souhaite sponsoriser une annonce spécifique.
- **Aucun abonnement mensuel ni formule de gestion locative n'est imposé au démarcheur.**

### 3. Exclusivité Stricte des Formules aux Bailleurs (`role: 'bailleur'`)
- Les formules d'abonnement (Formule Découverte 0 FCFA pour 2 baux, Formule Sérénité 2 % / loyer perçu, Formule Entreprise & Pro 5 000 FCFA / 30 jours) s'adressent **exclusivement aux propriétaires et gestionnaires bailleurs** pour la gestion de leurs baux, l'émission des quittances propriétaires et le recouvrement.
- Dans l'interface utilisateur, la Sidebar, le Header, les profils et la console Super-Admin (`/admin`), aucun bouton ni statut de surclassement de formule de bailleur ne doit être présenté aux profils Locataires ou Démarcheurs.

---
*Document scellé et maintenu pour le projet LOCAGESTION.*

