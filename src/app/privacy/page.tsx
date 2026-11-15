import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Politique de Confidentialité — LOCAGESTION',
  description: 'Politique de confidentialité et protection des données personnelles de la plateforme LOCAGESTION (Groupe OMEGA).',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-soft border border-slate-200">
        <div className="mb-8 pb-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-black text-brand-600 uppercase tracking-wider block mb-1">
              LOCAGESTION • Groupe OMEGA
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Politique de Confidentialité & Protection des Données
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Dernière mise à jour : 15 novembre 2026 • Conforme aux lois sur la protection des données personnelles UEMOA & CEMAC
            </p>
          </div>
          <Link
            href="/"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3.5 py-2 rounded-xl"
          >
            ← Retour au site
          </Link>
        </div>

        <div className="prose prose-slate text-xs sm:text-sm space-y-6 leading-relaxed text-slate-700">
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">1. Présentation de la plateforme</h2>
            <p>
              LOCAGESTION (édité par le groupe OMEGA, accessible sur <strong>https://locagestion.site</strong>) est une plateforme PropTech SaaS d'Afrique francophone dédiée à la gestion locative, à l'émission de quittances certifiées et à la contractualisation de baux électroniques conformes au Droit OHADA.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">2. Données personnelles collectées</h2>
            <p>Dans le cadre de l'utilisation de nos services, nous collectons les catégories de données suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Données d'identification :</strong> Nom, prénom, adresse e-mail, numéro de téléphone, date et lieu de naissance.</li>
              <li><strong>Données relatives au logement :</strong> Adresse, caractéristiques des biens immobiliers, montants des loyers et charges, baux d'habitation.</li>
              <li><strong>Données de transaction :</strong> Reçus et quittances de paiement de loyers, historique des encaissements Mobile Money et virements.</li>
              <li><strong>Données techniques :</strong> Adresse IP, type d'appareil, géolocalisation approximative pour la recherche de biens à proximité (avec votre consentement).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">3. Finalité du traitement</h2>
            <p>Vos données sont traitées pour les finalités suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Création et gestion sécurisée de votre compte utilisateur (Bailleur, Locataire, Démarcheur).</li>
              <li>Édition, signature électronique et horodatage des contrats de bail conformes à la législation locale.</li>
              <li>Génération de quittances de loyer numériques scellées avec QR code officiel vérifiable.</li>
              <li>Transmission des notifications de relances, préavis légaux et signalements d'incidents techniques.</li>
              <li>Vérification de l'intégrité des paiements et sécurisation des transactions.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">4. Sécurité et hébergement des données</h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles de niveau bancaire : chiffrement SSL/TLS de bout en bout, isolation stricte multi-tenants au niveau de la base de données, et politique de contrôle d'accès rigoureuse (Row Level Security).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">5. Partage des données avec des tiers</h2>
            <p>
              LOCAGESTION ne commercialise ni ne loue vos données personnelles à des tiers. Les données de contact ne sont partagées qu'entre les parties prenantes directes d'un même contrat de bail (bailleur et locataire désigné) aux fins strictes de l'exécution de la location.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">6. Vos droits</h2>
            <p>
              Conformément à la réglementation applicable, vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression de vos données personnelles. Vous pouvez exercer ces droits à tout moment en nous écrivant à : <strong>jobovog@gmail.com</strong> ou <strong>contact@locagestion.site</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">7. Contact</h2>
            <p>
              Pour toute question relative à la présente politique de confidentialité :<br />
              <strong>LOCAGESTION — Groupe OMEGA</strong><br />
              Email : <strong>jobovog@gmail.com</strong> / <strong>contact@locagestion.site</strong><br />
              Site Web : <a href="https://locagestion.site" className="text-brand-600 underline">https://locagestion.site</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
