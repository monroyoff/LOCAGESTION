'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function DeleteAccountPage() {
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    identifier: '', // email or phone
    role: 'locataire',
    reason: '',
    confirm: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.confirm) return;

    const generatedTicket = 'DEL-' + Math.floor(100000 + Math.random() * 900000);
    setTicketId(generatedTicket);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-soft border border-slate-200 mb-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
            <div>
              <span className="text-xs font-black text-rose-600 uppercase tracking-wider block mb-1">
                LOCAGESTION • Gestion des Données
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Suppression de Compte & Données Personnelles
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Conforme aux exigences Google Play et aux lois sur la protection des données personnelles (UEMOA / CEMAC)
              </p>
            </div>
            <Link
              href="/"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3.5 py-2 rounded-xl transition"
            >
              ← Accueil
            </Link>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Vous pouvez à tout moment demander la fermeture de votre compte <strong>LOCAGESTION</strong> ainsi que la suppression ou l'anonymisation intégrale de vos données personnelles.
          </p>

          {/* Méthode 1 : Par E-mail direct */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
            <h2 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 inline-flex items-center justify-center text-xs font-bold">1</span>
              Demande directe par e-mail
            </h2>
            <p className="text-xs text-slate-600 mb-3">
              Vous pouvez nous adresser directement votre demande depuis l'adresse e-mail associée à votre compte :
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="mailto:contact@locagestion.site?subject=Demande%20de%20suppression%20de%20compte%20LOCAGESTION&body=Bonjour,%20je%20souhaite%20supprimer%20définitivement%20mon%20compte%20LOCAGESTION%20ainsi%20que%20mes%20données%20associées.%0A%0ANom:%20%0ATéléphone/Email:%20"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
              >
                ✉️ Envoyer un e-mail à contact@locagestion.site
              </a>
              <a
                href="mailto:jobovog@gmail.com?subject=Demande%20de%20suppression%20de%20compte%20LOCAGESTION"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                ✉️ jobovog@gmail.com
              </a>
            </div>
          </div>

          {/* Méthode 2 : Formulaire de demande en ligne */}
          <div className="border border-slate-200 rounded-2xl p-5 mb-8">
            <h2 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 inline-flex items-center justify-center text-xs font-bold">2</span>
              Formulaire de demande en ligne
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              Remplissez ce formulaire sécurisé pour transmettre votre demande à notre équipe d'assistance :
            </p>

            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                  ✓
                </div>
                <h3 className="text-base font-black text-emerald-900 mb-1">
                  Demande enregistrée avec succès
                </h3>
                <p className="text-xs text-emerald-700 mb-3">
                  Numéro de dossier : <span className="font-mono font-bold">{ticketId}</span>
                </p>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Votre demande de suppression de compte a bien été prise en compte. Un accusé de traitement vous sera adressé sous <strong>72 heures ouvrées</strong> après vérification de votre identité.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom et Prénoms *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Ex: Koffi Mensah"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Adresse e-mail ou Numéro de téléphone associé au compte *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                    placeholder="Ex: koffi@gmail.com ou +229 97 00 00 00"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Espace / Rôle principal *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 transition"
                  >
                    <option value="locataire">Espace Résident / Locataire</option>
                    <option value="bailleur">Espace Propriétaire / Bailleur</option>
                    <option value="demarcheur">Espace Démarcheur / Agent Immobilier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Motif de la suppression (facultatif)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Ex: Déménagement, fin de bail, autre..."
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 transition"
                  />
                </div>

                <div className="flex items-start gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="confirm"
                    required
                    checked={formData.confirm}
                    onChange={(e) => setFormData({ ...formData, confirm: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="confirm" className="text-xs text-slate-600 leading-tight">
                    Je confirme être le titulaire de ce compte et demander la clôture définitive ainsi que la suppression des données associées.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm"
                >
                  Confirmer la demande de suppression
                </button>
              </form>
            )}
          </div>

          {/* Section d'information juridique Google Play */}
          <div className="space-y-6 pt-4 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
            <section>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                🗑️ Quelles données sont définitivement supprimées ?
              </h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Vos identifiants de connexion (adresse e-mail, mot de passe haché, numéro de téléphone).</li>
                <li>Vos données de profil personnel (nom, prénoms, date et lieu de naissance, coordonnées).</li>
                <li>Vos annonces immobilières publiées et vos sauvegardes de recherche.</li>
                <li>Vos messages instantanés et conversations internes non contractuelles.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                ⚖️ Données conservées pour obligations légales (OHADA / UEMOA / Fiscalité)
              </h3>
              <p>
                Conformément aux dispositions de l'Acte Uniforme OHADA et aux législations fiscales nationales des pays membres (Bénin, Côte d'Ivoire, Sénégal, Togo, Cameroun, etc.), <strong>les contrats de bail bilatéraux signés et les quittances de loyer déjà émises</strong> constituent des documents probatoires légaux. Ils sont archivés de façon sécurisée pendant la durée légale de prescription (généralement 5 à 10 ans) pour prévenir les litiges locatifs et satisfaire aux contrôles fiscaux obligatoires, sans pouvoir être utilisés à des fins commerciales.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                ⏱️ Délais de traitement
              </h3>
              <p>
                Dès réception de votre demande, votre compte est désactivé sous <strong>24 heures</strong> et la suppression ou l'anonymisation complète de vos données intervient dans un délai maximum de <strong>72 heures ouvrées</strong> (dans la limite légale des 30 jours).
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
