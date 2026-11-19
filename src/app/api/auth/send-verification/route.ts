import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://locagestion.site';
    const verifyLink = `${baseUrl}/auth/verify?email=${encodeURIComponent(
      recipientEmail
    )}&code=${code}`;

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const smtpUser = process.env.SMTP_USER || 'contact@locagestion.site';
    const smtpPass = process.env.SMTP_PASS || 'kwacpwtfqtsvhllu';
    const smtpFrom =
      process.env.SMTP_FROM || '"LOCAGESTION" <contact@locagestion.site>';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const emailHtml = `
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
        <a href="${verifyLink}" class="btn" target="_blank">Confirmer mon compte LOCAGESTION</a>
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

    const emailText = `Bonjour ${userFirstName},

Bienvenue sur LOCAGESTION !

Votre compte ${roleLabel} associé à l'adresse ${recipientEmail} a bien été pré-enregistré.
Votre code de confirmation officiel est : ${code}

Vous pouvez également confirmer votre compte directement via ce lien :
${verifyLink}

Ce code est valable pendant 15 minutes.

LOCAGESTION — Plateforme de Gestion Locative UEMOA & CEMAC
https://locagestion.site
`;

    await transporter.sendMail({
      from: smtpFrom,
      to: recipientEmail,
      subject: `${userFirstName}, voici votre code de confirmation LOCAGESTION : ${code}`,
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

