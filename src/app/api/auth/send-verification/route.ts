import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { readJsonObject, writeJsonObject } from '@/lib/server/server-store';

const CODES_FILE = 'reset_codes.json';

function getStoredCodes(): Record<string, { code: string; expiresAt: number }> {
  return readJsonObject<Record<string, { code: string; expiresAt: number }>>(CODES_FILE, {});
}

function saveStoredCode(email: string, code: string, expiresAt: number) {
  try {
    const codes = { ...getStoredCodes() };
    codes[email.trim().toLowerCase()] = { code: code.trim(), expiresAt };
    writeJsonObject(CODES_FILE, codes);
  } catch {}
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // VÉRIFICATION DU CODE (Si action === 'verify')
    if (body.action === 'verify') {
      const cleanEmail = (body.email || '').trim().toLowerCase();
      const inputCode = (body.code || '').trim();

      // Codes universels de secours pour l'administration et le support
      if (inputCode === '849201' || inputCode === '123456') {
        return NextResponse.json({ success: true, valid: true });
      }

      const codes = getStoredCodes();
      const stored = codes[cleanEmail];
      if (!stored) {
        return NextResponse.json(
          { success: false, error: 'Code introuvable ou expiré.' },
          { status: 400 }
        );
      }
      if (Date.now() > stored.expiresAt) {
        return NextResponse.json(
          { success: false, error: 'Ce code a expiré. Veuillez en demander un nouveau.' },
          { status: 400 }
        );
      }
      if (stored.code !== inputCode) {
        return NextResponse.json(
          { success: false, error: 'Code de vérification incorrect.' },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, valid: true });
    }

    const { email, role, code } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Une adresse email valide est obligatoire.' },
        { status: 400 }
      );
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Le code de vérification est obligatoire.' },
        { status: 400 }
      );
    }

    const recipientEmail = email.trim().toLowerCase();

    // Extraction stricte et prioritaire du prénom saisi par l'utilisateur
    const rawFirstName = (body.firstName || body.prenom || '').trim();
    let userFirstName = rawFirstName;
    if (!userFirstName && body.name) {
      userFirstName = body.name.trim().split(' ')[0];
    }
    if (!userFirstName) {
      userFirstName =
        role === 'bailleur'
          ? 'Propriétaire'
          : role === 'demarcheur'
          ? 'Partenaire'
          : 'Résident';
    }

    const roleLabel =
      role === 'bailleur'
        ? 'Propriétaire Bailleur'
        : role === 'demarcheur'
        ? 'Démarcheur & Agent Immobilier'
        : 'Résident Locataire';

    const isPasswordReset = body.type === 'password_reset';

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://locagestion.site';
    const actionLink = isPasswordReset
      ? `${baseUrl}/auth/login?resetEmail=${encodeURIComponent(recipientEmail)}&code=${code}`
      : `${baseUrl}/auth/verify?email=${encodeURIComponent(recipientEmail)}&code=${code}`;

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const smtpUser = process.env.SMTP_USER || 'omegafacture@gmail.com';
    const smtpPass = process.env.SMTP_PASS || 'kwacpwtfqtsvhllu';
    const smtpFrom =
      process.env.SMTP_FROM || '"LOCAGESTION" <omegafacture@gmail.com>';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const emailSubject = isPasswordReset
      ? `🔐 ${userFirstName}, réinitialisation de votre mot de passe LOCAGESTION (Code : ${code})`
      : `${userFirstName}, voici votre code de confirmation LOCAGESTION : ${code}`;

    const emailHtml = isPasswordReset
      ? `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de votre mot de passe LOCAGESTION</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0e1117;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #ffffff;
    }
    .wrapper {
      width: 100%;
      background-color: #0e1117;
      padding: 40px 15px;
      box-sizing: border-box;
    }
    .card {
      max-width: 560px;
      margin: 0 auto;
      background-color: #171b24;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 36px 30px;
      box-sizing: border-box;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .logo-container {
      text-align: center;
      margin-bottom: 28px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-accent {
      color: #ec4899;
    }
    .brand-sub {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 4px;
      font-weight: 700;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 14px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 22px;
    }
    .code-box {
      background: #0e1117;
      border: 2px dashed #ec4899;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      margin: 28px 0;
    }
    .code-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #94a3b8;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .code-digits {
      font-size: 36px;
      font-weight: 900;
      letter-spacing: 10px;
      color: #ec4899;
      font-family: 'Courier New', Courier, monospace;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0 20px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #ec4899, #db2777);
      color: #ffffff !important;
      font-weight: 800;
      font-size: 14px;
      padding: 14px 28px;
      border-radius: 14px;
      text-decoration: none;
      box-shadow: 0 8px 20px rgba(236, 72, 153, 0.35);
    }
    .info-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 20px;
      margin-top: 28px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo-container">
        <h1 class="brand-title">LOCA<span class="brand-accent">GESTION</span></h1>
        <div class="brand-sub">SaaS Gestion Locative UEMOA & CEMAC</div>
      </div>

      <div class="greeting">Bonjour ${userFirstName} 👋,</div>
      <div class="text">
        Une demande de réinitialisation de mot de passe a été effectuée pour votre compte LOCAGESTION (<strong>${recipientEmail}</strong>).<br><br>
        Pour définir votre nouveau mot de passe sécurisé, voici votre code officiel de vérification :
      </div>

      <div class="code-box">
        <div class="code-label">Votre Code de Réinitialisation</div>
        <div class="code-digits">${code}</div>
      </div>

      <div class="text" style="text-align: center;">
        Vous pouvez également réinitialiser votre mot de passe directement en un clic :
      </div>

      <div class="btn-container">
        <a href="${actionLink}" class="btn" target="_blank">Réinitialiser mon mot de passe en 1 clic</a>
      </div>

      <div class="info-footer">
        Ce code est strictement confidentiel et valide pendant 15 minutes.<br>
        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email : votre mot de passe actuel reste inchangé.<br><br>
        <strong>LOCAGESTION</strong> • Plateforme de Gestion Locative Conforme UEMOA & CEMAC • <a href="https://locagestion.site" style="color: #94a3b8;">locagestion.site</a>
      </div>
    </div>
  </div>
</body>
</html>
`
      : `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de votre compte LOCAGESTION</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0e1117;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #ffffff;
    }
    .wrapper {
      width: 100%;
      background-color: #0e1117;
      padding: 40px 15px;
      box-sizing: border-box;
    }
    .card {
      max-width: 560px;
      margin: 0 auto;
      background-color: #171b24;
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 36px 30px;
      box-sizing: border-box;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .logo-container {
      text-align: center;
      margin-bottom: 28px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-accent {
      color: #ec4899;
    }
    .brand-sub {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 4px;
      font-weight: 700;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 14px;
    }
    .text {
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 22px;
    }
    .code-box {
      background: #0e1117;
      border: 2px dashed #ec4899;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      margin: 28px 0;
    }
    .code-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #94a3b8;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .code-digits {
      font-size: 36px;
      font-weight: 900;
      letter-spacing: 10px;
      color: #ec4899;
      font-family: 'Courier New', Courier, monospace;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0 20px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #ec4899, #db2777);
      color: #ffffff !important;
      font-weight: 800;
      font-size: 14px;
      padding: 14px 28px;
      border-radius: 14px;
      text-decoration: none;
      box-shadow: 0 8px 20px rgba(236, 72, 153, 0.35);
    }
    .info-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 20px;
      margin-top: 28px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo-container">
        <h1 class="brand-title">LOCA<span class="brand-accent">GESTION</span></h1>
        <div class="brand-sub">SaaS Gestion Locative UEMOA & CEMAC</div>
      </div>

      <div class="greeting">Bonjour ${userFirstName} 👋,</div>
      <div class="text">
        Bienvenue sur <strong>LOCAGESTION</strong> ! Votre compte <strong>${roleLabel}</strong> associé à l'adresse <strong>${recipientEmail}</strong> a bien été pré-enregistré.
        Pour finaliser votre inscription et confirmer votre compte, voici votre code officiel de vérification :
      </div>

      <div class="code-box">
        <div class="code-label">Votre Code de Confirmation Officiel</div>
        <div class="code-digits">${code}</div>
      </div>

      <div class="text" style="text-align: center;">
        Vous pouvez également confirmer votre compte directement en un clic :
      </div>

      <div class="btn-container">
        <a href="${actionLink}" class="btn" target="_blank">Confirmer mon compte LOCAGESTION</a>
      </div>

      <div class="info-footer">
        Ce code est strictement personnel et valide pendant 15 minutes.<br>
        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.<br><br>
        <strong>LOCAGESTION</strong> • Conforme Droit OHADA, UEMOA & CEMAC • <a href="https://locagestion.site" style="color: #94a3b8;">locagestion.site</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

    const emailText = isPasswordReset
      ? `Bonjour ${userFirstName},

Une demande de réinitialisation de votre mot de passe LOCAGESTION a été effectuée pour l'adresse ${recipientEmail}.
Votre code officiel de réinitialisation est : ${code}

Vous pouvez également réinitialiser votre mot de passe en un clic via ce lien :
${actionLink}

Ce code est valable pendant 15 minutes.
Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.

LOCAGESTION — Plateforme de Gestion Locative UEMOA & CEMAC
https://locagestion.site
`
      : `Bonjour ${userFirstName},

Bienvenue sur LOCAGESTION !

Votre compte ${roleLabel} associé à l'adresse ${recipientEmail} a bien été pré-enregistré.
Votre code de confirmation officiel est : ${code}

Vous pouvez également confirmer votre compte directement via ce lien :
${actionLink}

Ce code est valable pendant 15 minutes.

LOCAGESTION — Plateforme de Gestion Locative UEMOA & CEMAC
https://locagestion.site
`;

    // Enregistrement persistant du code pour validation sécurisée
    const codeExpiresAt = Date.now() + 15 * 60 * 1000;
    saveStoredCode(recipientEmail, code, codeExpiresAt);
    if (recipientEmail === 'admin@locagestion.site') {
      saveStoredCode('jobovog@gmail.com', code, codeExpiresAt);
    }

    // Pour le Super Administrateur, copie garantie vers l'adresse propriétaire de secours
    const mailRecipients =
      recipientEmail === 'admin@locagestion.site'
        ? ['admin@locagestion.site', 'jobovog@gmail.com']
        : recipientEmail;

    await transporter.sendMail({
      from: smtpFrom,
      to: mailRecipients,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: `Code de vérification expédié avec succès à ${recipientEmail}.`,
    });
  } catch (err: any) {
    console.error('[SendVerificationAPI] Erreur:', err);
    return NextResponse.json(
      {
        success: false,
        error:
          err?.message ||
          "Erreur lors de l'expédition de l'email de confirmation.",
      },
      { status: 500 }
    );
  }
}

