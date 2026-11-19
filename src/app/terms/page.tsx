import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: "Conditions Générales d'Utilisation (CGU) — LOCAGESTION",
  description:
    "Conditions générales d'utilisation de la plateforme PropTech SaaS LOCAGESTION pour l'Afrique francophone (UEMOA / CEMAC / OHADA).",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-soft border border-slate-200">
        {/* En-tête */}
        <div className="mb-8 pb-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-brand-600 uppercase tracking-wider block mb-1">
              LOCAGESTION
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Conditions Générales d'Utilisation (CGU)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              En vigueur au 15 novembre 2026 • Conformité juridique OHADA, UEMOA & CEMAC
            </p>
          </div>
          <Link
            href="/auth/login"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition"
          >
            ← Connexion / Espace
          </Link>
        </div>

        {/* Corps des CGU */}
        <div className="prose prose-slate text-xs sm:text-sm space-y-6 leading-relaxed text-slate-700">
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">1. Objet et Présentation du Service</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après <strong>« CGU »</strong>) régissent l'accès et l'utilisation de la plateforme <strong>LOCAGESTION</strong> (accessible via le site web <strong>https://locagestion.site</strong> et l'application mobile Android).
            </p>
            <p>
              LOCAGESTION est la première solution SaaS PropTech d'Afrique francophone dédiée à la gestion locative intégrale, à la contractualisation de baux électroniques certifiés conformes au droit OHADA, à l'émission de quittances de loyer numériques scellées avec QR code de vérification, et à l'intermédiation immobilière sécurisée.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">2. Acceptation des Conditions</h2>
            <p>
              L'inscription ou l'utilisation de la plateforme implique l'acceptation expresse, préalable et sans réserve des présentes CGU par l'utilisateur. Toute personne n'acceptant pas ces conditions doit s'abstenir d'utiliser les services de LOCAGESTION.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">3. Rôles et Espaces Utilisateurs</h2>
            <p>LOCAGESTION propose 3 espaces distincts et cloisonnés :</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Espace Bailleur (Propriétaire) :</strong> Permet la gestion du patrimoine immobilier, la génération de contrats de bail conformes aux lois nationales en vigueur, le suivi des encaissements de loyers, l'émission de quittances certifiées et la gestion des procédures de relances et de préavis.
              </li>
              <li>
                <strong>Espace Résident (Locataire) :</strong> Permet l'accès et le téléchargement des quittances officielles numériques vérifiables, le suivi des paiements de loyer (Mobile Money ou virement), la déclaration d'incidents techniques domestiques et la signature électronique bilatérale de son bail.
              </li>
              <li>
                <strong>Espace Démarcheur / Agent Immobilier :</strong> Permet la publication d'annonces immobilières vérifiées, le pilotage des mandats et l'organisation des visites. Conformément aux spécificités locales de l'Afrique francophone, <em>aucun Numéro d'Identifiant Fiscal Unique (IFU) n'est exigé du démarcheur</em> pour publier ses annonces.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">4. Moteur Juridique, Baux OHADA & Quittances Certifiées</h2>
            <p>
              Les modèles de baux générés sur LOCAGESTION intègrent automatiquement les dispositions d'ordre public de la législation du pays où se situe le bien immobilier (ex. : <em>Loi n° 2018-12 au Bénin, Loi n° 2019-576 en Côte d'Ivoire, Loi n° 81-52 au Sénégal, Décret n° 2022-034 au Togo, Acte Uniforme OHADA portant sur le Droit Commercial Général</em>).
            </p>
            <p>
              La signature électronique apposée sur les baux bénéficie d'un horodatage numérique et d'une empreinte cryptographique SHA-256 garantissant son intégrité probatoire.
            </p>
            <p>
              Chaque quittance de loyer délivrée sur la plateforme est pourvue d'un sceau numérique infalsifiable et d'un QR code renvoyant vers le guichet public de vérification <code>/verify/[code]</code>, consultable librement par les établissements bancaires, consulats et administrations publiques.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">5. Respect des Plafonds Légaux de Caution et Avance</h2>
            <p>
              Les utilisateurs s'engagent impérativement à respecter les plafonds légaux de dépôts de garantie et d'avances de loyer prescrits par la législation du pays du bien (ex. : maximum 3 mois de caution et 3 mois d'avance au Bénin ; maximum 2 mois de caution et 2 mois d'avance en Côte d'Ivoire). LOCAGESTION intègre des garde-fous automatisés et décline toute responsabilité quant aux accords verbaux illicites conclus en dehors de l'application.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">6. Paiements et Écosystème Mobile Money</h2>
            <p>
              LOCAGESTION facilite le suivi et l'enregistrement des paiements en Franc CFA (XOF / XAF) effectués par Mobile Money (Wave, MTN Mobile Money, Moov Money, Orange Money, Airtel Money), virements bancaires ou espèces. L'utilisateur bailleur est seul responsable de la validation finale de l'encaissement effectif des fonds avant la délivrance de la quittance libératoire.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">7. Engagements et Responsabilités des Utilisateurs</h2>
            <p>L'utilisateur s'engage formellement à :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fournir des informations véridiques et complètes lors de son inscription et de la contractualisation.</li>
              <li>Ne publier aucune annonce immobilière mensongère, fictive ou sans mandat valide.</li>
              <li>Préserver la confidentialité de ses codes d'accès et mots de passe.</li>
              <li>Respecter les délais légaux de préavis et de restitution des dépôts de garantie (délai légal de 30 jours après remise des clés et état des lieux contradictoire).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">8. Propriété Intellectuelle</h2>
            <p>
              L'ensemble des éléments constituant la plateforme (logiciel, charte graphique, marques, logos, bases de données, modèles juridiques) est la propriété exclusive de LOCAGESTION. Toute reproduction ou exploitation non autorisée est strictement prohibée.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">9. Données Personnelles et Clôture de Compte</h2>
            <p>
              Le traitement des données personnelles est détaillé dans notre{' '}
              <Link href="/privacy" className="text-brand-600 font-bold underline">
                Politique de Confidentialité
              </Link>.
            </p>
            <p>
              Tout utilisateur peut demander à tout moment la fermeture de son compte et la suppression de ses données personnelles via notre guichet officiel :{' '}
              <Link href="/delete-account" className="text-brand-600 font-bold underline">
                Suppression de Compte LOCAGESTION
              </Link>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">10. Droit Applicable et Règlement des Différends</h2>
            <p>
              Les présentes CGU sont régies par le droit issu de l'espace OHADA et les législations nationales applicables. En cas de litige relatif à un contrat de bail immobilier, la compétence juridictionnelle exclusive appartient aux tribunaux du ressort du lieu de situation de l'immeuble.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">11. Contact & Assistance</h2>
            <p>
              Pour toute question ou assistance relative à l'application :<br />
              <strong>LOCAGESTION</strong><br />
              Email : <strong>contact@locagestion.site</strong> / <strong>jobovog@gmail.com</strong><br />
              Téléphone : <strong>+229 01 95 44 44 30</strong><br />
              Site Web officiel : <a href="https://locagestion.site" className="text-brand-600 underline">https://locagestion.site</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

