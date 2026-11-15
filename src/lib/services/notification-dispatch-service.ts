/**
 * Service de dispatch des notifications réelles (SMS, WhatsApp, Email, Liens Directs).
 * Assure la distribution effective des invitations de bail et notifications locataires.
 */

export interface LeaseInvitationData {
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  leaseId: string;
  propertyName: string;
  unitNumber: string;
  rent: number;
  deposit?: number;
  utilitiesDeposit?: number;
  totalDueAtEntry?: number;
  portalUrl: string;
  appDownloadUrl?: string;
  invitationCode: string;
  landlordName?: string;
  countryName?: string;
  governingLaw?: string;
}

/**
 * Nettoie et normalise un numéro de téléphone pour WhatsApp et SMS.
 * Supporte les numéros internationaux avec ou sans indicatif.
 */
export function sanitizePhoneNumber(phone: string, defaultCountry = '229'): string {
  if (!phone) return '';
  // Enlever tous les caractères non numériques sauf éventuellement le '+'
  const cleaned = phone.trim().replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned.replace('+', '');
  }

  // Si commence par 00
  if (cleaned.startsWith('00')) {
    return cleaned.slice(2);
  }

  // Si c'est un numéro local (ex: Bénin 8 chiffres ou nouveau plan 10 chiffres commençant par 01)
  if (cleaned.length === 8) {
    return `${defaultCountry}${cleaned}`;
  }
  if (cleaned.length === 10 && cleaned.startsWith('01')) {
    // Plan national Bénin 2024+
    return `${defaultCountry}${cleaned}`;
  }

  return cleaned;
}

/**
 * Génère le texte professionnel complet d'invitation pour SMS et WhatsApp.
 */
export function buildLeaseInvitationTextMessage(data: LeaseInvitationData): string {
  const landlord = data.landlordName || 'Le Bailleur';
  const appUrl = data.appDownloadUrl || (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/download` : 'https://locagestion.site/download');
  const rentFormatted = new Intl.NumberFormat('fr-FR').format(data.rent);
  const totalFormatted = data.totalDueAtEntry
    ? new Intl.NumberFormat('fr-FR').format(data.totalDueAtEntry)
    : null;
  const recipientFirstName = data.recipientName ? data.recipientName.trim().split(' ')[0] : 'Locataire';

  return `Bonjour ${recipientFirstName},

Votre contrat de bail pour le logement ${data.unitNumber} (${data.propertyName}) a été établi et signé par votre bailleur ${landlord}.

👉 ACCÉDEZ À VOTRE ESPACE POUR VISUALISER ET CONTRESIGNER :
${data.portalUrl}

📲 TÉLÉCHARGEZ L'APPLICATION MOBILE LOCAGESTION (Android & iOS) :
${appUrl}

🔑 Votre code d'activation sécurisé : ${data.invitationCode}
• Loyer mensuel : ${rentFormatted} FCFA${totalFormatted ? `\n• Total exigible à l'entrée : ${totalFormatted} FCFA` : ''}

Ce bail numérique est certifié avec piste d'audit conforme aux normes en vigueur.

LOCAGESTION — Gestion Immobilière Sécurisée`;
}

/**
 * Génère l'URL d'action directe WhatsApp.
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = sanitizePhoneNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Génère l'URI native SMS pour smartphone / tablette / Mac.
 */
export function buildSmsUri(phone: string, message: string): string {
  const cleanPhone = sanitizePhoneNumber(phone);
  // ?&body= fonctionne de manière universelle sur iOS/macOS et Android
  return `sms:${cleanPhone}?&body=${encodeURIComponent(message)}`;
}

/**
 * Génère le sujet du courriel officiel.
 */
export function buildLeaseEmailSubject(data: LeaseInvitationData): string {
  return `[LOCAGESTION] Votre contrat de bail ${data.leaseId} est prêt pour contresignature — ${data.unitNumber}`;
}

/**
 * Génère le corps texte brut du courriel (pour mailto ou clients texte).
 */
export function buildLeaseEmailPlainText(data: LeaseInvitationData): string {
  return buildLeaseInvitationTextMessage(data);
}

/**
 * Génère le lien mailto direct pour ouvrir le client de messagerie par défaut.
 */
export function buildMailtoUrl(data: LeaseInvitationData): string {
  const subject = buildLeaseEmailSubject(data);
  const body = buildLeaseEmailPlainText(data);
  return `mailto:${encodeURIComponent(data.recipientEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

/**
 * Génère le lien direct pour composer dans Gmail Web.
 */
export function buildGmailComposeUrl(data: LeaseInvitationData): string {
  const subject = buildLeaseEmailSubject(data);
  const body = buildLeaseEmailPlainText(data);
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    data.recipientEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Génère le gabarit HTML premium responsive pour l'email.
 */
export function buildLeaseEmailHtml(data: LeaseInvitationData): string {
  const landlord = data.landlordName || 'Le Bailleur';
  const appUrl = data.appDownloadUrl || (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/download` : 'https://locagestion.site/download');
  const rentFormatted = new Intl.NumberFormat('fr-FR').format(data.rent);
  const depositFormatted = data.deposit
    ? new Intl.NumberFormat('fr-FR').format(data.deposit)
    : null;
  const totalFormatted = data.totalDueAtEntry
    ? new Intl.NumberFormat('fr-FR').format(data.totalDueAtEntry)
    : null;

  const recipientFirstName = data.recipientName ? data.recipientName.trim().split(' ')[0] : 'Locataire';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre Contrat de Bail LOCAGESTION</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #ffffff; padding: 32px 28px; text-align: center; }
    .logo { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #38bdf8; margin-bottom: 8px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 8px 0 0; color: #94a3b8; font-size: 13px; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px dashed #e2e8f0; }
    .row:last-child { border-bottom: none; }
    .row-label { color: #64748b; font-weight: 500; }
    .row-value { color: #0f172a; font-weight: 700; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); color: #ffffff !important; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35); }
    .activation-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; text-align: center; margin: 20px 0; }
    .activation-code { font-family: monospace; font-size: 18px; font-weight: 900; color: #166534; letter-spacing: 2px; }
    .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .footer a { color: #0284c7; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ LOCAGESTION</div>
      <h1>Contrat de Bail en Attente de Signature</h1>
      <p>Portail Résidentiel Certifié & Signature Électronique</p>
    </div>
    <div class="content">
      <div class="greeting">Bonjour ${recipientFirstName},</div>
      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Votre bailleur <strong>${landlord}</strong> a préparé et signé électroniquement votre contrat de bail.
        Il ne vous reste plus qu'à consulter le contrat et apposer votre contresignature en ligne.
      </p>

      <div class="box">
        <div class="row">
          <span class="row-label">Réf. Contrat :</span>
          <span class="row-value">${data.leaseId}</span>
        </div>
        <div class="row">
          <span class="row-label">Logement :</span>
          <span class="row-value">${data.unitNumber} (${data.propertyName})</span>
        </div>
        <div class="row">
          <span class="row-label">Loyer mensuel :</span>
          <span class="row-value" style="color: #0284c7;">${rentFormatted} FCFA</span>
        </div>
        ${
          depositFormatted
            ? `<div class="row"><span class="row-label">Dépôt de garantie :</span><span class="row-value">${depositFormatted} FCFA</span></div>`
            : ''
        }
        ${
          totalFormatted
            ? `<div class="row"><span class="row-label">Total exigible à l'entrée :</span><span class="row-value" style="color: #16a34a;">${totalFormatted} FCFA</span></div>`
            : ''
        }
        ${
          data.governingLaw
            ? `<div class="row"><span class="row-label">Cadre légal :</span><span class="row-value">${data.governingLaw}</span></div>`
            : ''
        }
      </div>

      <div class="activation-box">
        <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; margin-bottom: 4px;">Votre Code d'Activation Personnel</div>
        <div class="activation-code">${data.invitationCode}</div>
        <div style="font-size: 11px; color: #15803d; margin-top: 4px;">À conserver pour accéder à votre espace locataire</div>
      </div>

      <div class="btn-container">
        <a href="${data.portalUrl}" class="btn" target="_blank">Consulter & Signer mon Bail en Ligne →</a>
      </div>

      <div style="background: #f1f5f9; border-radius: 12px; padding: 14px; margin-top: 24px; font-size: 12px; color: #475569;">
        <strong>📱 Application Mobile Locataire :</strong><br>
        Téléchargez dès maintenant l'application LOCAGESTION pour suivre vos loyers, télécharger vos quittances avec QR code certifié et dialoguer avec votre bailleur :<br>
        <a href="${appUrl}" style="color: #0284c7; font-weight: bold;">${appUrl}</a>
      </div>
    </div>
    <div class="footer">
      Cet email vous a été envoyé automatiquement par la plateforme LOCAGESTION dans le cadre de votre contrat de location.<br>
      Piste d'audit numérique certifiée SHA-256 conforme UEMOA, CEMAC & OHADA.<br>
      © ${new Date().getFullYear()} LOCAGESTION. Tous droits réservés.
    </div>
  </div>
</body>
</html>`;
}

