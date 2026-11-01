/**
 * Utilitaire de téléchargement de documents officiels (Contrats de bail, quittances, états des lieux)
 */

import { notifyDownloadComplete } from './download-notifier';

export function downloadDocument(filename: string, content: string, mimeType: string = 'text/plain') {
  if (typeof window === 'undefined') return;

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Déclenchement de la notification de téléchargement sur l'écran
  notifyDownloadComplete(filename);
}

export function generateLeaseContent(lease: {
  tenantName: string;
  propertyName: string;
  unit: string;
  rent: number;
  startDate: string;
  id: string;
}) {
  return `================================================================================
                    RÉPUBLIQUE DU BÉNIN / ZONE UEMOA & OHADA
              CONTRAT OFFICIEL DE BAIL D'HABITATION SOUS SEING PRIVÉ
================================================================================
RÉFÉRENCE DU BAIL : ${lease.id}
DATE D'EFFET     : ${lease.startDate}
DURÉE            : 1 AN RENOUVELABLE PAR TACITE RECONDUCTION

ENTRE LES SOUSSIGNÉS :
1. LE BAILLEUR :
   Cabinet DIALLO Patrimoine SARL
   Rue 340, Haie Vive, Cotonou (Bénin)
   IFU / NIF : 0202110485960
   Représenté par M. Mamadou Diallo, Administrateur Général.

2. LE PRENEUR (LOCATAIRE) :
   M./Mme : ${lease.tenantName}
   Résidant au : ${lease.propertyName}, Lot ${lease.unit}

OBJET DU CONTRAT :
Le bailleur donne à bail à titre d'habitation exclusive au preneur qui accepte les locaux désignés ci-après :
- Résidence : ${lease.propertyName}
- Lot / Logement : ${lease.unit}

CONDITIONS FINANCIÈRES :
- Loyer mensuel principal : ${lease.rent.toLocaleString('fr-FR')} FCFA (payable d'avance le 05 de chaque mois)
- Dépôt de garantie (Caution) : ${(lease.rent * 2).toLocaleString('fr-FR')} FCFA
- Frais et charges de copropriété : Inclus selon décompte trimestriel

MODES DE PAIEMENT CONVENUS :
Mobile Money (Wave, MTN, Moov) ou Virement bancaire.

CLAUSES RÉSOLUTOIRE ET LITIGES :
En cas de défaut de paiement du loyer à l'échéance convenue, le présent bail sera résilié de plein droit après mise en demeure formelle de 30 jours restée infructueuse, conformément à la législation OHADA et aux textes en vigueur dans l'État partie.

Fait à Cotonou en deux (2) exemplaires originaux.
Signé électroniquement et scellé avec piste d'audit horodatée SHA-256.

[Signé numériquement par le Bailleur]       [Signé numériquement par le Locataire]
Mamadou DIALLO                             ${lease.tenantName}
`;
}

