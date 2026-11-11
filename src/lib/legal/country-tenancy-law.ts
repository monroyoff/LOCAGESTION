'use client';

/**
 * MOTEUR JURIDIQUE DE CONFORMITÉ LOCATIVE MULTI-PAYS (UEMOA / CEMAC / OHADA)
 * Adapte automatiquement les clauses, plafonds de garantie, lois en vigueur
 * et juridictions compétentes selon le pays de résidence ou de situation du bien.
 */

export interface TenancyClauseArticle {
  articleNumber: string;
  title: string;
  summary: string;
  fullText: string;
  isMandatory: boolean;
}

export interface CountryTenancyLaw {
  countryCode: string;
  countryName: string;
  flag: string;
  officialLawReference: string;
  officialLawTitle: string;
  shortReference: string;
  depositCapMonths: number;
  advanceCapMonths: number;
  depositAdviceText: string;
  restitutionDeadlineDays: number;
  noticeMonths: number;
  taxAuthority: string;
  fiscalRegistrationRequirement: string;
  competentCourt: string;
  currencyName: string;
  mobileMoneyChannels: string[];
  waterElectricityUtilityDepositAdvice: string;
  clauses: TenancyClauseArticle[];
}

export const COUNTRIES_TENANCY_LAWS: Record<string, CountryTenancyLaw> = {
  Bénin: {
    countryCode: 'BJ',
    countryName: 'Bénin',
    flag: '🇧🇯',
    officialLawReference: 'Loi n° 2018-12 du 02 juillet 2018',
    officialLawTitle:
      "Régime du bail à usage d'habitation domestique en République du Bénin",
    shortReference: 'Loi 2018-12 (Bénin)',
    depositCapMonths: 3,
    advanceCapMonths: 3,
    depositAdviceText:
      'Loi 2018-12 (Art. 13) : Le montant du cautionnement ne peut en aucun cas excéder trois (3) mois de loyer hors charges.',
    restitutionDeadlineDays: 30,
    noticeMonths: 3,
    taxAuthority: 'Administration Fiscale (DGI) et ANDF',
    fiscalRegistrationRequirement:
      "Obligation d'enregistrement au centre des impôts avec mention obligatoire du Numéro d'Identifiant Fiscal Unique (IFU) du bailleur.",
    competentCourt:
      'Tribunal de Première Instance de Première Classe de Cotonou (ou juridiction du ressort territorial de situation de l’immeuble)',
    currencyName: 'Franc CFA (XOF)',
    mobileMoneyChannels: ['Wave Bénin', 'MTN Mobile Money', 'Moov Africa Moov Money'],
    waterElectricityUtilityDepositAdvice:
      'Compteurs individuels SBEE (Cash Power) et SONEB : la caution compteurs est séparée du loyer et restituée sur présentation de quittances de solde.',
    clauses: [
      {
        articleNumber: 'ARTICLE 1',
        title: 'DESTINATION EXCLUSIVE ET JOUISSANCE PAISIBLE DES LIEUX',
        summary: "Affectation exclusive à l'habitation domestique personnelle et respect du voisinage.",
        fullText:
          "Les locaux présentement loués sont destinés à l'usage exclusif d'habitation domestique et bourgeoise pour le Preneur et les membres de sa famille déclarés. Toute affectation professionnelle, commerciale, industrielle ou artisanale est strictement proscrite. Le Preneur s'engage à jouir des lieux en bon père de famille, à respecter la tranquillité publique, les règles de copropriété et la quiétude du voisinage, et à n'y exercer aucune activité illicite ou contraire aux bonnes mœurs.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'DÉPÔT DE GARANTIE ET CAUTION COMPTEURS (LOI N° 2018-12 ART. 13 & 17)',
        summary: 'Plafonnement légal de la caution à 3 mois et restitution sous 30 jours calendaires.',
        fullText:
          "En garantie de la parfaite exécution de ses obligations, le Preneur verse au Bailleur à la signature du présent contrat un dépôt de garantie strictement conforme aux prescriptions d'ordre public de la Loi n° 2018-12 (Art. 13), ne pouvant excéder trois (3) mois de loyer. Cette somme, non productive d'intérêts, ne saurait en aucun cas dispenser le locataire du paiement d'un terme de loyer. Elle sera intégralement restituée dans un délai maximum de trente (30) jours calendaires suivant la remise définitive des clés et l'établissement contradictoire de l'état des lieux de sortie, déduction faite de toute somme légitimement due par le Preneur au titre des loyers, réparations locatives et arriérés éventuels de factures SBEE/SONEB.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 3',
        title: 'MODALITÉS DE PAIEMENT DU LOYER ET QUITTANCES ÉLECTRONIQUES',
        summary: 'Exigibilité mensuelle au plus tard le 5 et quittance certifiée sans frais.',
        fullText:
          "Le loyer principal et les charges éventuelles sont payables mensuellement et par anticipation, au plus tard le 5 (cinq) de chaque mois civil échu. Les règlements s'effectuent prioritairement par transfert Mobile Money certifié (Wave, MTN Bénin, Moov Money) ou virement bancaire direct sur le compte ouvert au nom du Bailleur. Pour chaque paiement reçu, le Bailleur est légalement tenu de délivrer sans délai et sans frais une quittance de loyer horodatée mentionnant le montant net réglé et la période correspondante.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 4',
        title: 'RÉPARTITION LÉGALE DES TRAVAUX ET CHARGES LOCATIVES (LOI N° 2018-12 ART. 22 À 25)',
        summary: 'Grosses réparations et structure à charge du bailleur ; entretien courant au locataire.',
        fullText:
          "Le Bailleur a la charge d'entretenir les locaux en état de servir à l'usage prévu et d'exécuter à ses frais toutes les grosses réparations intéressant la structure, le gros œuvre, la toiture, les canalisations d'évacuation principales et la vétusté des installations (Art. 22). Le Preneur prend à sa charge l'entretien quotidien, le remplacement des menues pièces d'usure courante (robinetterie, prises, interrupteurs, serrures) ainsi que la prise en charge intégrale de ses consommations d'eau et d'électricité compteurs individuels.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 5',
        title: 'PROHIBITION STRICTE DE SOUS-LOCATION ET DE CESSION DU BAIL',
        summary: 'Toute sous-location ou mise à disposition de tiers est formellement interdite sans écrit.',
        fullText:
          "Il est formellement interdit au Preneur de sous-louer, céder, prêter ou mettre à disposition d'un tiers, en tout ou en partie, à titre onéreux ou gratuit, sous quelque forme que ce soit, les lieux loués sans le consentement exprès, préalable et écrit du Bailleur. Toute infraction à la présente clause entraîne la résiliation immédiate et de plein droit du présent bail aux torts exclusifs du Preneur.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 6',
        title: 'CLAUSE RÉSOLUTOIRE EXPRESSE DE PLEIN DROIT (LOI N° 2018-12 ART. 35)',
        summary: 'Résiliation automatique 30 jours après mise en demeure ou commandement infructueux.',
        fullText:
          "À défaut de paiement d'un seul terme de loyer ou de charges à son échéance exacte, ou en cas d'inexécution d'une seule des obligations résultant du présent contrat, le bail sera résilié immédiatement et de plein droit trente (30) jours calendaires après un commandement de payer ou une mise en demeure notifiée par exploit d'huissier ou lettre recommandée demeurée sans effet. Passé ce délai légal, le Preneur sera réputé occupant sans droit ni titre et son expulsion pourra être ordonnée par ordonnance de référé sans autre forme de procès.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 7',
        title: 'CONGÉ, PRÉAVIS LÉGAL ET RESTITUTION DES LIEUX',
        summary: 'Préavis réciproque de 3 mois par notification écrite probante.',
        fullText:
          "Le contrat peut être résilié à l'expiration de son terme ou à tout moment par l'une des parties sous réserve du respect d'un préavis écrit de trois (3) mois notifié par tout moyen conférant date certaine. Durant la période de préavis, le Preneur devra laisser visiter les locaux deux heures par jour ouvrable pour relocation. Le jour de la libération, un état des lieux de sortie contradictoire et chiffré sera obligatoirement dressé.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 8',
        title: 'ENREGISTREMENT FISCAL ET RÉGIME DE L’IDENTIFIANT FISCAL UNIQUE (IFU)',
        summary: 'Formalité légale d’enregistrement fiscal et certification probatoire.',
        fullText:
          "Le présent contrat de bail est soumis aux obligations fiscales en vigueur en République du Bénin. Il sera formellement répertorié auprès de la Direction Générale des Impôts (DGI) et de l'Agence Nationale du Domaine et du Foncier (ANDF) sous les références de l'Identifiant Fiscal Unique (IFU) du Bailleur. Les parties reconnaissent que la signature électronique et le scellement numérique opéré via la plateforme LOCAGESTION confèrent au document une pleine valeur probante au sens de l'Acte Uniforme OHADA.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 9',
        title: 'JURIDICTION COMPÉTENTE ET RÈGLEMENT DES DIFFÉRENDS',
        summary: 'Attribution de juridiction aux tribunaux territoriaux de situation de l’immeuble.',
        fullText:
          "Le présent contrat est exclusivement régi et interprété selon la législation béninoise et le droit uniforme des affaires OHADA. En cas de contestation ou de litige né de l'interprétation ou de l'exécution du présent contrat qui ne trouverait pas d'issue amiable dans un délai de quinze (15) jours, compétence exclusive et expresse est attribuée au Tribunal de Première Instance de Première Classe de Cotonou ou à la juridiction civile territorialement compétente du ressort du lieu de situation de l'immeuble.",
        isMandatory: true,
      },
    ],
  },

  "Côte d'Ivoire": {
    countryCode: 'CI',
    countryName: "Côte d'Ivoire",
    flag: '🇨🇮',
    officialLawReference: 'Loi n° 2019-576 du 26 juin 2019',
    officialLawTitle:
      'Code de la construction et de l’habitat de la République de Côte d’Ivoire (Art. 410 à 425)',
    shortReference: 'Loi 2019-576 (Côte d’Ivoire)',
    depositCapMonths: 2,
    advanceCapMonths: 2,
    depositAdviceText:
      'Loi 2019-576 (Art. 412) : Le cautionnement est d’ordre public strictement plafonné à deux (2) mois de loyer, et l’avance de loyer à deux (2) mois maximum.',
    restitutionDeadlineDays: 30,
    noticeMonths: 3,
    taxAuthority: 'Direction Générale des Impôts (DGI Côte d’Ivoire)',
    fiscalRegistrationRequirement:
      "Enregistrement fiscal obligatoire auprès du centre des impôts du lieu de situation de l'immeuble dans le mois suivant la signature.",
    competentCourt:
      'Tribunal de Commerce d’Abidjan ou Section de Tribunal du lieu de situation de l’immeuble',
    currencyName: 'Franc CFA (XOF)',
    mobileMoneyChannels: ['Wave Côte d’Ivoire', 'Orange Money CI', 'MTN Mobile Money CI', 'Moov Money CI'],
    waterElectricityUtilityDepositAdvice:
      'Facturation directe CIE / SODECI : restitution de la garantie conditionnée à la production de la dernière facture soldée ou du quitus de clôture.',
    clauses: [
      {
        articleNumber: 'ARTICLE 1',
        title: 'DESTINATION DU LOGEMENT (CODE DE L’HABITAT IVOIRIEN)',
        summary: "Affectation exclusive à l'habitation principale du preneur et de ses ayants droit.",
        fullText:
          "Les lieux loués sont strictement réservés à l'habitation personnelle du Preneur. Toute transformation en local professionnel, commercial, dépôt ou bureau est interdite sous peine de résiliation immédiate conformément à l'article 415 du Code de la construction et de l'habitat de Côte d'Ivoire.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'PLAFONNEMENT D’ORDRE PUBLIC DU DÉPÔT DE GARANTIE (LOI N° 2019-576 ART. 412)',
        summary: 'Caution rigoureusement limitée à 2 mois de loyer et avance plafonnée à 2 mois.',
        fullText:
          "En application impérative de l'article 412 de la Loi n° 2019-576 portant Code de la construction et de l'habitat, le dépôt de garantie ne peut en aucun cas excéder la somme équivalente à deux (2) mois de loyer principal hors charges. Le loyer d'avance ne peut également excéder deux (2) mois. Ce dépôt ne produit point d'intérêts et sera restitué dans un délai strict de trente (30) jours suivant la libération totale des locaux et la présentation des quittances de solde définitif CIE et SODECI.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 3',
        title: 'PAIEMENT DU LOYER ET QUITTANCE CIVIQUE MENSUELLE',
        summary: 'Règlement mensuel d’avance au plus tard le 5 et remise gratuite de quittance.',
        fullText:
          "Le loyer est payable par mois et d'avance au plus tard le cinq (5) de chaque mois par Mobile Money (Wave, Orange Money, MTN Moov) ou virement bancaire. Le Bailleur est tenu de remettre sans frais au Preneur une quittance détaillée pour chaque règlement perçu.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 4',
        title: 'ENTRETIEN, GROS ŒUVRES ET RÉPARATIONS LOCATIVES',
        summary: 'Vétusté et structures au bailleur, réparations locatives d’usage au preneur.',
        fullText:
          "Le Bailleur s'oblige à maintenir l'immeuble en état d'habitabilité et à effectuer toutes les réparations relatives aux gros œuvres, façades, étanchéité de toiture et conduites collectives. Le Preneur assurera l'entretien courant et les menues réparations des sanitaires, de l'électricité intérieure et des boiseries.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 5',
        title: 'INTERDICTION LÉGALE DE SOUS-LOCATION (ART. 416 DU CODE DE L’HABITAT)',
        summary: 'Sous-location ou cession prohibée à peine de déchéance et d’expulsion immédiate.',
        fullText:
          "En conformité avec l'article 416 du Code de la construction et de l'habitat ivoirien, la cession du présent bail ou la sous-location des lieux, même partielle, est formellement interdite sans accord écrit et préalable du Bailleur.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 6',
        title: 'CLAUSE RÉSOLUTOIRE DE PLEIN DROIT ET EXPULSION',
        summary: 'Résiliation automatique 30 jours après sommation de payer délivrée par exploit.',
        fullText:
          "À défaut de paiement d'un seul terme de loyer à sa date d'exigibilité ou de respect d'une des clauses contractuelles, le bail sera résilié de plein droit trente (30) jours après une sommation de payer ou un commandement notifié par exploit de Commissaire de justice (huissier) demeuré infructueux.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 7',
        title: 'CONGÉ ET PRÉAVIS LÉGAL DE REPRISE OU DÉPART',
        summary: 'Préavis légal de 3 mois pour le locataire et conditions encadrées pour le bailleur.',
        fullText:
          "Chaque partie peut mettre fin au bail en respectant un préavis minimum de trois (3) mois signifié par lettre avec accusé de réception ou acte d'huissier. Le Bailleur ne peut reprendre son bien que pour motifs légitimes et sérieux expressément prévus par le Code de l'habitat (reprise pour habiter, travaux majeurs de surélévation ou démolition).",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 8',
        title: 'ENREGISTREMENT FISCAL ET TRIBUNAL COMPÉTENT',
        summary: 'Enregistrement à la DGI ivoirienne et compétence du Tribunal d’Abidjan.',
        fullText:
          "Le présent contrat sera enregistré auprès de la Direction Générale des Impôts (DGI Côte d'Ivoire). Tout différend qui naîtrait entre les parties relève de la compétence expresse du Tribunal de Commerce ou de la juridiction civile territorialement compétente de la situation de l'immeuble.",
        isMandatory: true,
      },
    ],
  },

  Sénégal: {
    countryCode: 'SN',
    countryName: 'Sénégal',
    flag: '🇸🇳',
    officialLawReference: 'Loi n° 81-52 (COCC) & Décret n° 2023-447 du 24 février 2023',
    officialLawTitle:
      'Code des Obligations Civiles et Commerciales (COCC) et Régulation nationale des Loyers',
    shortReference: 'Décret 2023-447 & COCC (Sénégal)',
    depositCapMonths: 2,
    advanceCapMonths: 2,
    depositAdviceText:
      'Réglementation sénégalaise : Caution et avance plafonnées à deux (2) mois de loyer. Respect obligatoire des barèmes de la Commission Nationale de Régulation des Loyers (CONAREL).',
    restitutionDeadlineDays: 30,
    noticeMonths: 3,
    taxAuthority: 'Direction Générale des Impôts et des Domaines (DGID Sénégal)',
    fiscalRegistrationRequirement:
      'Enregistrement auprès du Centre des Services Fiscaux de la DGID et conformité au dispositif de régulation des baux.',
    competentCourt: 'Tribunal d’Instance de Dakar (ou tribunal d’instance de situation des locaux)',
    currencyName: 'Franc CFA (XOF)',
    mobileMoneyChannels: ['Wave Sénégal', 'Orange Money Sénégal', 'Free Money'],
    waterElectricityUtilityDepositAdvice:
      'Compteurs Woyofal (Senelec) et Sen’Eau : solde des consommations obligatoire avant restitution de la caution.',
    clauses: [
      {
        articleNumber: 'ARTICLE 1',
        title: 'DESTINATION D’HABITATION ET RESPECT DU CODE DES OBLIGATIONS (COCC)',
        summary: 'Usage exclusivement bourgeois conformément aux articles 544 et suivants du COCC.',
        fullText:
          "Le logement est loué à titre d'habitation privée exclusive. Le Preneur s'oblige à veiller à la salubrité des lieux, à la sécurité et à la jouissance paisible des voisins en conformité stricte avec les dispositions du Code des Obligations Civiles et Commerciales du Sénégal.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'DÉPÔT DE GARANTIE ET CONFORMITÉ AU DÉCRET SUR LES LOYERS',
        summary: 'Caution limitée à 2 mois maximum et restituée sous 30 jours ouvrés.',
        fullText:
          "Le Preneur dépose à titre de garantie une somme ne pouvant excéder deux (2) mois de loyer, conformément aux dispositions du décret n° 2023-447. Cette somme sera restituée dans les trente (30) jours suivant la libération effective des lieux et l'apurement des factures Woyofal/Senelec et Sen'Eau.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 3',
        title: 'RÈGLEMENT DU LOYER ET QUITTANCEMENT OFFICIEL',
        summary: 'Exigibilité mensuelle au plus tard le 5 par Wave ou Orange Money et délivrance de quittance.',
        fullText:
          "Le loyer est payable par anticipation au plus tard le 5 de chaque mois civil via Wave Sénégal, Orange Money ou virement bancaire. La quittance est systématiquement transmise sans supplément au locataire.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 4',
        title: 'INTERDICTION ABSOLUE DE SOUS-LOCATION ET CESSION',
        summary: 'Interdiction d’héberger des tiers à titre onéreux ou de céder le contrat.',
        fullText:
          "Toute cession de bail et toute sous-location totale ou partielle sous quelque modalité que ce soit est formellement interdite sans l'agrément écrit et préalable du Bailleur.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 5',
        title: 'CLAUSE RÉSOLUTOIRE COCC ET COMMANDEMENT DE PAYER',
        summary: 'Résiliation de plein droit 30 jours après mise en demeure ou sommation de payer infructueuse.',
        fullText:
          "En cas de non-paiement d'un terme de loyer à échéance ou de manquement aux obligations locatives, le présent bail sera résolu de plein droit trente (30) jours après sommation de payer ou mise en demeure demeurée infructueuse, ouvrant droit à l'expulsion immédiate.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 6',
        title: 'JURIDICTION COMPÉTENTE ET FISCALITÉ DGID',
        summary: 'Enregistrement DGID et compétence du Tribunal d’Instance territorialement compétent.',
        fullText:
          "Le bail est soumis à l'enregistrement fiscal auprès de la DGID. Tout différend relatif au contrat relève de la compétence exclusive du Tribunal d'Instance du lieu de situation de l'immeuble loué.",
        isMandatory: true,
      },
    ],
  },

  Togo: {
    countryCode: 'TG',
    countryName: 'Togo',
    flag: '🇹🇬',
    officialLawReference: 'Décret n° 2022-001/PR du 5 janvier 2022',
    officialLawTitle:
      'Réglementation des baux d’habitation et plafonnement des cautions de loyer au Togo',
    shortReference: 'Décret 2022-001/PR (Togo)',
    depositCapMonths: 3,
    advanceCapMonths: 3,
    depositAdviceText:
      'Décret 2022-001/PR : Le cautionnement est plafonné à trois (3) mois de loyer et l’avance de loyer à trois (3) mois maximum en République Togolaise.',
    restitutionDeadlineDays: 30,
    noticeMonths: 3,
    taxAuthority: 'Office Togolais des Recettes (OTR)',
    fiscalRegistrationRequirement:
      "Obligation d'enregistrement du contrat auprès des divisions de l'OTR.",
    competentCourt: 'Tribunal de Première Instance de Première Classe de Lomé',
    currencyName: 'Franc CFA (XOF)',
    mobileMoneyChannels: ['T-Money Togo', 'Moov Money Flooz Togo'],
    waterElectricityUtilityDepositAdvice:
      'Compteurs CEET (Cash Power) et TdE : décompte contradictoire des index de compteurs à la sortie.',
    clauses: [
      {
        articleNumber: 'ARTICLE 1',
        title: 'USAGE D’HABITATION ET TRANQUILLITÉ DES LIEUX',
        summary: 'Locaux exclusivement réservés à l’habitation et respect de la législation togolaise.',
        fullText:
          "Le bien immobilier est loué pour un usage strictement résidentiel. Le Preneur s'interdit d'y exercer un quelconque commerce ou activité contraire à l'ordre public togolais.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'DÉPÔT DE GARANTIE CONFORME AU DÉCRET N° 2022-001/PR',
        summary: 'Plafonnement de la caution à 3 mois et restitution sous 30 jours calendaires.',
        fullText:
          "Conformément au Décret n° 2022-001/PR du 5 janvier 2022, le montant du cautionnement est plafonné à trois (3) mois de loyer. Il sera restitué dans les trente (30) jours suivant l'état des lieux contradictoire de sortie.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 3',
        title: 'PAIEMENT DU LOYER ET QUITTANCEMENT OTR',
        summary: 'Paiement mensuel par T-Money ou Moov Flooz et remise de quittance officielle.',
        fullText:
          "Le loyer est payable par anticipation au plus tard le 5 de chaque mois civil par T-Money, Flooz ou virement. Une quittance libératoire est immédiatement délivrée.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 4',
        title: 'RÉPARATIONS ET ENTRETIEN SELON LE CODE CIVIL TOGOLAIS',
        summary: 'Gros œuvre à la charge du propriétaire, entretien intérieur à la charge du locataire.',
        fullText:
          "Le Bailleur répond des vices cachés et grosses réparations structurelles. Le Preneur répond des réparations locatives et dégâts de son fait.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 5',
        title: 'CLAUSE RÉSOLUTOIRE DE PLEIN DROIT ET JURIDICTION DE LOMÉ',
        summary: 'Résiliation sous 30 jours de mise en demeure et compétence du Tribunal de Lomé.',
        fullText:
          "À défaut de paiement à échéance ou manquement aux clauses, le bail est résilié de plein droit 30 jours après mise en demeure infructueuse. Compétence expresse est attribuée au Tribunal de Première Instance de Lomé.",
        isMandatory: true,
      },
    ],
  },

  Cameroun: {
    countryCode: 'CM',
    countryName: 'Cameroun',
    flag: '🇨🇲',
    officialLawReference: 'Loi n° 2004/003 et Droit des Obligations OHADA',
    officialLawTitle: 'Régime des Baux d’Habitation en République du Cameroun',
    shortReference: 'Loi 2004/003 & OHADA (Cameroun)',
    depositCapMonths: 3,
    advanceCapMonths: 3,
    depositAdviceText:
      'Législation camerounaise & OHADA : Dépôt de garantie usuel de 2 à 3 mois de loyer, quittances conformes.',
    restitutionDeadlineDays: 30,
    noticeMonths: 3,
    taxAuthority: 'Direction Générale des Impôts (DGI Cameroun)',
    fiscalRegistrationRequirement:
      "Enregistrement fiscal au Centre Régional des Impôts sous peine de pénalités.",
    competentCourt: 'Tribunal de Première Instance (Douala / Yaoundé)',
    currencyName: 'Franc CFA (XAF)',
    mobileMoneyChannels: ['MTN Mobile Money Cameroun', 'Orange Money Cameroun'],
    waterElectricityUtilityDepositAdvice:
      'Compteurs Eneo et Camwater : règlement impératif des quittances finales avant restitution de garantie.',
    clauses: [
      {
        articleNumber: 'ARTICLE 1',
        title: 'USAGE D’HABITATION ET RÈGLEMENT DE JOUISSANCE',
        summary: 'Habitation exclusive et interdiction de transformation commerciale.',
        fullText:
          "Les lieux sont réservés à l'habitation personnelle du preneur. Toute transformation sans autorisation écrite est formellement prohibée.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'DÉPÔT DE GARANTIE ET CAUTION ÉLECTRICITÉ/EAU',
        summary: 'Caution et modalité d’apurement des charges Eneo / Camwater.',
        fullText:
          "Le Preneur verse une caution de loyer qui sera restituée au terme du contrat sous 30 jours, déduction faite des créances justifiées et apurement des factures d'eau et d'électricité.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 3',
        title: 'CLAUSE RÉSOLUTOIRE DE PLEIN DROIT ET RÈGLEMENT DE LITIGES',
        summary: 'Résiliation 30 jours après mise en demeure et compétence du TPI de ressort.',
        fullText:
          "Tout manquement autorise la résiliation automatique du bail 30 jours après commandement de payer. Compétence exclusive est attribuée au Tribunal de Première Instance de la situation de l'immeuble.",
        isMandatory: true,
      },
    ],
  },

  'Burkina Faso': {
    countryCode: 'BF',
    countryName: 'Burkina Faso',
    flag: '🇧🇫',
    officialLawReference: 'Loi n° 103-2015/CNT',
    officialLawTitle: 'Bail d’habitation privée au Burkina Faso',
    shortReference: 'Loi 103-2015/CNT (Burkina)',
    depositCapMonths: 3,
    advanceCapMonths: 3,
    depositAdviceText:
      'Loi 103-2015/CNT : Caution de loyer plafonnée à 3 mois maximum au Burkina Faso.',
    restitutionDeadlineDays: 30,
    noticeMonths: 3,
    taxAuthority: 'Direction Générale des Impôts (DGI Burkina Faso)',
    fiscalRegistrationRequirement: 'Enregistrement aux impôts fonciers du ressort.',
    competentCourt: 'Tribunal de Grande Instance (Ouagadougou / Bobo-Dioulasso)',
    currencyName: 'Franc CFA (XOF)',
    mobileMoneyChannels: ['Orange Money Burkina', 'Moov Africa Burkina'],
    waterElectricityUtilityDepositAdvice:
      'Compteurs SONABEL et ONEA : vérification d’apurement des quittances de consommation.',
    clauses: [
      {
        articleNumber: 'ARTICLE 1',
        title: 'DESTINATION DU LOGEMENT (LOI 103-2015/CNT)',
        summary: 'Habitation bourgeoise personnelle.',
        fullText:
          "Les lieux sont réservés à l'habitation domestique du preneur en conformité avec la loi n° 103-2015/CNT régissant le bail d'habitation privée.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'PLAFOND DE LA CAUTION ET RESTITUTION',
        summary: 'Caution plafonnée à 3 mois de loyer selon la législation burkinabè.',
        fullText:
          "Le cautionnement ne saurait dépasser 3 mois de loyer. Sa restitution s'effectuera dans un délai de 30 jours après remise des clés.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 3',
        title: 'CLAUSE RÉSOLUTOIRE ET TRIBUNAL COMPÉTENT',
        summary: 'Résiliation après 30 jours de mise en demeure et compétence du TGI.',
        fullText:
          "En cas d'impayé ou de violation contractuelle, le bail est résilié de plein droit 30 jours après sommation infructueuse. Compétence est donnée au Tribunal de Grande Instance du ressort.",
        isMandatory: true,
      },
    ],
  },

  Mali: {
    countryCode: 'ML',
    countryName: 'Mali',
    flag: '🇲🇱',
    officialLawReference: 'Loi n° 98-012 et Acte Uniforme OHADA',
    officialLawTitle: 'Régime des Baux à Usage d’Habitation en République du Mali',
    shortReference: 'Loi 98-012 & OHADA (Mali)',
    depositCapMonths: 3,
    advanceCapMonths: 3,
    depositAdviceText:
      'Cadre législatif malien & OHADA : Dépôt de garantie usuel de 3 mois de loyer maximum.',
    restitutionDeadlineDays: 30,
    noticeMonths: 3,
    taxAuthority: 'Direction Générale des Impôts (DGI Mali)',
    fiscalRegistrationRequirement: 'Enregistrement aux services fiscaux du district ou de cercle.',
    competentCourt: 'Tribunal de Grande Instance de Bamako',
    currencyName: 'Franc CFA (XOF)',
    mobileMoneyChannels: ['Orange Money Mali', 'Moov Africa Malitel'],
    waterElectricityUtilityDepositAdvice:
      'Compteurs EDM et SOMAGEP : relevé d’index obligatoire à la sortie.',
    clauses: [
      {
        articleNumber: 'ARTICLE 1',
        title: 'USAGE D’HABITATION ET RESPECT DU CONTRAT',
        summary: 'Habitation exclusive et respect des règlements en vigueur.',
        fullText:
          "Les locaux sont voués à l'habitation exclusive de la famille du locataire. Toute activité commerciale y est prohibée.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'DÉPÔT DE GARANTIE ET CLAUSE RÉSOLUTOIRE',
        summary: 'Restitution sous 30 jours et résolution de plein droit après 30 jours de mise en demeure.',
        fullText:
          "La caution est restituée sous 30 jours après libération totale des lieux. À défaut de règlement d'un loyer à échéance, le bail est résolu 30 jours après sommation sans effet.",
        isMandatory: true,
      },
    ],
  },

  Niger: {
    countryCode: 'NE',
    countryName: 'Niger',
    flag: '🇳🇪',
    officialLawReference: 'Réglementation des baux d’habitation et Acte Uniforme OHADA',
    officialLawTitle: 'Législation locative et régime des obligations au Niger',
    shortReference: 'Législation locative (Niger)',
    depositCapMonths: 3,
    advanceCapMonths: 3,
    depositAdviceText:
      'Réglementation nigérienne & OHADA : Dépôt de garantie usuel de 3 mois.',
    restitutionDeadlineDays: 30,
    noticeMonths: 3,
    taxAuthority: 'Direction Générale des Impôts (DGI Niger)',
    fiscalRegistrationRequirement: 'Enregistrement fiscal communal.',
    competentCourt: 'Tribunal de Grande Instance Hors Classe de Niamey',
    currencyName: 'Franc CFA (XOF)',
    mobileMoneyChannels: ['Airtel Money Niger', 'Moov Money Niger'],
    waterElectricityUtilityDepositAdvice:
      'Compteurs NIGELEC et SEEN : apurement des factures d’énergie et d’eau à la restitution.',
    clauses: [
      {
        articleNumber: 'ARTICLE 1',
        title: 'DESTINATION D’HABITATION',
        summary: 'Occupation bourgeoise et paisible.',
        fullText:
          "Le Preneur affecte les locaux exclusivement à l'habitation et prend en charge l'entretien locatif journalier.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'CLAUSE RÉSOLUTOIRE EXPRESSE',
        summary: 'Résiliation sous 30 jours d’impayé.',
        fullText:
          "Le non-paiement du loyer entraîne résiliation automatique du bail 30 jours après mise en demeure régulière. Juridiction de Niamey.",
        isMandatory: true,
      },
    ],
  },

  Gabon: {
    countryCode: 'GA',
    countryName: 'Gabon',
    flag: '🇬🇦',
    officialLawReference: 'Loi n° 15/88 et Code Civil gabonais',
    officialLawTitle: 'Régime des Loyers et Baux d’Habitation en République Gabonaise',
    shortReference: 'Loi 15/88 (Gabon)',
    depositCapMonths: 3,
    advanceCapMonths: 3,
    depositAdviceText:
      'Législation gabonaise : Dépôt de garantie usuel de 2 à 3 mois, restitution sous 30 jours.',
    restitutionDeadlineDays: 30,
    noticeMonths: 3,
    taxAuthority: 'Direction Générale des Impôts (DGI Gabon)',
    fiscalRegistrationRequirement: 'Enregistrement fiscal auprès des services fiscaux.',
    competentCourt: 'Tribunal de Première Instance de Libreville',
    currencyName: 'Franc CFA (XAF)',
    mobileMoneyChannels: ['Airtel Money Gabon', 'Moov Money Gabon'],
    waterElectricityUtilityDepositAdvice:
      'Compteurs SEEG : quitus de solde obligatoire avant remise du dépôt de garantie.',
    clauses: [
      {
        articleNumber: 'ARTICLE 1',
        title: 'HABITATION EXCLUSIVE ET NORMES DE SALUBRITÉ',
        summary: 'Usage résidentiel personnel.',
        fullText:
          "Les lieux sont réservés à l'habitation privée du preneur à l'exclusion de tout usage commercial ou professionnel.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'CLAUSE RÉSOLUTOIRE ET JURIDICTION DE LIBREVILLE',
        summary: 'Résiliation sous 30 jours et compétence du tribunal de Libreville.',
        fullText:
          "Tout manquement emporte résiliation 30 jours après exploit d'huissier infructueux. Compétence attribuée au Tribunal de Libreville.",
        isMandatory: true,
      },
    ],
  },

  France: {
    countryCode: 'FR',
    countryName: 'France / Diaspora',
    flag: '🇫🇷',
    officialLawReference: 'Loi n° 89-462 du 6 juillet 1989',
    officialLawTitle:
      'Loi tendant à améliorer les rapports locatifs et portant modification de la loi n° 86-1290',
    shortReference: 'Loi du 6 juillet 1989 (France)',
    depositCapMonths: 1,
    advanceCapMonths: 1,
    depositAdviceText:
      'Loi du 6 juillet 1989 (Art. 22) : Dépôt de garantie plafonné à un (1) mois de loyer hors charges en location nue (deux mois en meublé).',
    restitutionDeadlineDays: 30,
    noticeMonths: 3,
    taxAuthority: 'Direction Générale des Finances Publiques (DGFiP)',
    fiscalRegistrationRequirement:
      'Déclaration fiscale des revenus fonciers ou BIC selon la nature de la location.',
    competentCourt: 'Juge des Contentieux de la Protection (Tribunal Judiciaire)',
    currencyName: 'Euro (€) / Équivalent FCFA',
    mobileMoneyChannels: ['Virement Bancaire SEPA', 'Prélèvement Direct'],
    waterElectricityUtilityDepositAdvice:
      'Compteurs individuels Enedis / GRDF / Eau : clôture des contrats personnels à la remise des clés.',
    clauses: [
      {
        articleNumber: 'ARTICLE 1',
        title: 'DESTINATION D’HABITATION PRINCIPALE (LOI DU 6 JUILLET 1989)',
        summary: 'Résidence principale exclusive du locataire.',
        fullText:
          "Les locaux sont loués pour constituer la résidence principale du locataire au sens de l'article 2 de la loi du 6 juillet 1989.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 2',
        title: 'DÉPÔT DE GARANTIE ET DÉLAIS LÉGAUX DE RESTITUTION',
        summary: 'Plafonné à 1 mois hors charges (nu), restitution sous 1 mois si conforme.',
        fullText:
          "Le dépôt de garantie ne peut excéder 1 mois de loyer principal hors charges en non-meublé. Il est restitué dans un délai d'un mois si l'état des lieux de sortie est conforme.",
        isMandatory: true,
      },
      {
        articleNumber: 'ARTICLE 3',
        title: 'CLAUSE RÉSOLUTOIRE ET COMMANDEMENT DE PAYER',
        summary: 'Résiliation après commandement de payer demeuré infructueux.',
        fullText:
          "Le contrat sera résilié de plein droit après délivrance d'un commandement de payer par commissaire de justice demeuré infructueux.",
        isMandatory: true,
      },
    ],
  },
};

export const SUPPORTED_TENANCY_COUNTRIES = Object.values(COUNTRIES_TENANCY_LAWS);

/**
 * Résout la législation et les clauses applicables à partir d'un pays ou d'une ville.
 */
export function resolveCountryTenancyLaw(countryOrCityInput?: string): CountryTenancyLaw {
  if (!countryOrCityInput || countryOrCityInput.trim() === '') {
    return COUNTRIES_TENANCY_LAWS['Bénin'];
  }

  const q = countryOrCityInput.toLowerCase().trim();

  // Match Bénin
  if (
    q.includes('bénin') ||
    q.includes('benin') ||
    q.includes('cotonou') ||
    q.includes('calavi') ||
    q.includes('porto-novo') ||
    q.includes('parakou') ||
    q.includes('ouidah') ||
    q.includes('akpakpa') ||
    q.includes('haie vive')
  ) {
    return COUNTRIES_TENANCY_LAWS['Bénin'];
  }

  // Match Côte d'Ivoire
  if (
    q.includes('ivoire') ||
    q.includes('abidjan') ||
    q.includes('cocody') ||
    q.includes('bouake') ||
    q.includes('bouaké') ||
    q.includes('yamoussoukro') ||
    q.includes('yopougon')
  ) {
    return COUNTRIES_TENANCY_LAWS["Côte d'Ivoire"];
  }

  // Match Sénégal
  if (
    q.includes('sénégal') ||
    q.includes('senegal') ||
    q.includes('dakar') ||
    q.includes('thiès') ||
    q.includes('thies') ||
    q.includes('almadies')
  ) {
    return COUNTRIES_TENANCY_LAWS['Sénégal'];
  }

  // Match Togo
  if (q.includes('togo') || q.includes('lomé') || q.includes('lome')) {
    return COUNTRIES_TENANCY_LAWS['Togo'];
  }

  // Match Cameroun
  if (
    q.includes('cameroun') ||
    q.includes('cameroon') ||
    q.includes('douala') ||
    q.includes('yaoundé') ||
    q.includes('yaounde')
  ) {
    return COUNTRIES_TENANCY_LAWS['Cameroun'];
  }

  // Match Burkina Faso
  if (
    q.includes('burkina') ||
    q.includes('ouagadougou') ||
    q.includes('bobo')
  ) {
    return COUNTRIES_TENANCY_LAWS['Burkina Faso'];
  }

  // Match Mali
  if (q.includes('mali') || q.includes('bamako')) {
    return COUNTRIES_TENANCY_LAWS['Mali'];
  }

  // Match Niger
  if (q.includes('niger') || q.includes('niamey')) {
    return COUNTRIES_TENANCY_LAWS['Niger'];
  }

  // Match Gabon
  if (q.includes('gabon') || q.includes('libreville')) {
    return COUNTRIES_TENANCY_LAWS['Gabon'];
  }

  // Match France / Diaspora
  if (q.includes('france') || q.includes('paris') || q.includes('diaspora')) {
    return COUNTRIES_TENANCY_LAWS['France'];
  }

  return COUNTRIES_TENANCY_LAWS['Bénin'];
}

