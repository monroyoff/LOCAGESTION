import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import {
  LeaseInvitationData,
  TenantInvitationData,
  buildLeaseInvitationTextMessage,
  buildLeaseEmailSubject,
  buildLeaseEmailPlainText,
  buildLeaseEmailHtml,
  buildTenantInvitationTextMessage,
  buildTenantEmailSubject,
  buildTenantEmailPlainText,
  buildTenantEmailHtml,
  buildTenantMailtoUrl,
  buildTenantGmailComposeUrl,
  buildWhatsAppUrl,
  buildSmsUri,
  buildMailtoUrl,
  buildGmailComposeUrl,
  sanitizePhoneNumber,
} from '@/lib/services/notification-dispatch-service';

// Journalisation locale des notifications pour audit et traçabilité
function appendNotificationLog(entry: {
  timestamp: string;
  type: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  leaseId: string;
  emailSent: boolean;
  emailProvider: string;
  smsSent: boolean;
  smsProvider: string;
  notes?: string;
}) {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFilePath = path.join(logsDir, 'notifications.log');
    const line = `[${entry.timestamp}] TYPE=${entry.type} LEASE=${entry.leaseId} TO="${entry.recipientName}" EMAIL=${entry.recipientEmail} (${entry.emailSent ? 'SENT:' + entry.emailProvider : 'SKIPPED/NOT_CONFIGURED'}) PHONE=${entry.recipientPhone} (${entry.smsSent ? 'SENT:' + entry.smsProvider : 'READY_VIA_DEEP_LINK'}) NOTES=${entry.notes || 'OK'}\n`;
    fs.appendFileSync(logFilePath, line, 'utf-8');
  } catch (err) {
    console.error('[NotificationLog] Erreur lors de l’écriture du journal:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const isTenantInvite = Boolean(
      body.type === 'TENANT_INVITE' ||
      body.isGeneralInvite ||
      (!body.leaseId && !body.rent)
    );

    let textMessage: string;
    let emailSubject: string;
    let emailPlainText: string;
    let emailHtml: string;
    let whatsappUrl: string;
    let smsUri: string;
    let mailtoUrl: string;
    let gmailUrl: string;

    const recipientName = body.recipientName || 'Locataire';
    const recipientEmail = body.recipientEmail || '';
    const recipientPhone = body.recipientPhone || '';
    const landlordName = body.landlordName || 'Le Bailleur';

    const invitationData: LeaseInvitationData = {
      recipientName,
      recipientEmail,
      recipientPhone,
      leaseId: body.leaseId || (isTenantInvite ? 'LOCA-INV' : 'BAIL-2026'),
      propertyName: body.propertyName || 'Logement',
      unitNumber: body.unitNumber || 'Lot',
      rent: Number(body.rent) || 0,
      deposit: body.deposit ? Number(body.deposit) : undefined,
      utilitiesDeposit: body.utilitiesDeposit ? Number(body.utilitiesDeposit) : undefined,
      totalDueAtEntry: body.totalDueAtEntry ? Number(body.totalDueAtEntry) : undefined,
      portalUrl: body.portalUrl || (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/portal` : 'https://locagestion.site/portal'),
      appDownloadUrl: body.appDownloadUrl || (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/download` : 'https://locagestion.site/download'),
      invitationCode: body.invitationCode || 'LOCA-INV-7842',
      landlordName,
      countryName: body.countryName,
      governingLaw: body.governingLaw,
    };

    if (isTenantInvite) {
      const tenantData: TenantInvitationData = {
        recipientName,
        recipientEmail,
        recipientPhone,
        portalUrl: invitationData.portalUrl,
        appDownloadUrl: invitationData.appDownloadUrl,
        invitationCode: invitationData.invitationCode,
        landlordName,
        propertyName: body.propertyName,
      };

      textMessage = buildTenantInvitationTextMessage(tenantData);
      emailSubject = buildTenantEmailSubject(tenantData);
      emailPlainText = buildTenantEmailPlainText(tenantData);
      emailHtml = buildTenantEmailHtml(tenantData);
      whatsappUrl = buildWhatsAppUrl(recipientPhone, textMessage);
      smsUri = buildSmsUri(recipientPhone, textMessage);
      mailtoUrl = buildTenantMailtoUrl(tenantData);
      gmailUrl = buildTenantGmailComposeUrl(tenantData);
    } else {
      textMessage = buildLeaseInvitationTextMessage(invitationData);
      emailSubject = buildLeaseEmailSubject(invitationData);
      emailPlainText = buildLeaseEmailPlainText(invitationData);
      emailHtml = buildLeaseEmailHtml(invitationData);
      whatsappUrl = buildWhatsAppUrl(invitationData.recipientPhone, textMessage);
      smsUri = buildSmsUri(invitationData.recipientPhone, textMessage);
      mailtoUrl = buildMailtoUrl(invitationData);
      gmailUrl = buildGmailComposeUrl(invitationData);
    }

    let emailSent = false;
    let emailProvider = 'none';
    let emailError: string | null = null;

    // 1. TENTATIVE D'EXPÉDITION EMAIL VIA SMTP / SERVICE CONFIGURÉ
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT) || 465;
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || 'contact@locagestion.site';
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD || 'kwacpwtfqtsvhllu';
    const smtpFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"LOCAGESTION" <contact@locagestion.site>';

    if (smtpHost && smtpUser && smtpPass && invitationData.recipientEmail) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: smtpFrom,
          to: invitationData.recipientEmail,
          subject: emailSubject,
          text: emailPlainText,
          html: emailHtml,
        });

        emailSent = true;
        emailProvider = `smtp://${smtpHost}`;
      } catch (err: any) {
        emailError = err?.message || 'Erreur inconnue lors de l’envoi SMTP';
        console.error('[NotificationAPI] Erreur SMTP:', err);
      }
    } else {
      emailProvider = 'unconfigured';
      emailError = 'Serveur SMTP non configuré dans .env.local (fallback 1-clic direct disponible)';
    }

    // 2. TENTATIVE D'EXPÉDITION SMS VIA PASSERELLE
    let smsSent = false;
    let smsProvider = 'none';
    let smsError: string | null = null;

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
    const termiiApiKey = process.env.TERMII_API_KEY;
    const termiiSenderId = process.env.TERMII_SENDER_ID || 'LOCAGESTION';

    const cleanRecipientPhone = sanitizePhoneNumber(invitationData.recipientPhone);

    if (twilioSid && twilioToken && twilioFrom && cleanRecipientPhone) {
      try {
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: `+${cleanRecipientPhone}`,
            From: twilioFrom,
            Body: textMessage,
          }).toString(),
        });
        if (res.ok) {
          smsSent = true;
          smsProvider = 'twilio';
        } else {
          const twilioErr = await res.text();
          smsError = `Twilio HTTP ${res.status}: ${twilioErr}`;
        }
      } catch (err: any) {
        smsError = err?.message || 'Erreur Twilio';
      }
    } else if (termiiApiKey && cleanRecipientPhone) {
      try {
        const res = await fetch('https://api.ng.termii.com/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: cleanRecipientPhone,
            from: termiiSenderId,
            sms: textMessage,
            type: 'plain',
            channel: 'generic',
            api_key: termiiApiKey,
          }),
        });
        if (res.ok) {
          smsSent = true;
          smsProvider = 'termii';
        } else {
          smsError = `Termii HTTP ${res.status}`;
        }
      } catch (err: any) {
        smsError = err?.message || 'Erreur Termii';
      }
    } else if (process.platform === 'darwin' && cleanRecipientPhone) {
      try {
        // Envoi direct via le service Messages macOS natif
        const { spawnSync } = require('child_process');
        const appleScript = `
tell application "Messages"
  try
    set targetService to (first account whose service type is iMessage or service type is SMS)
    set targetBuddy to participant "+${cleanRecipientPhone}" of targetService
    send ${JSON.stringify(textMessage)} to targetBuddy
    return "SENT_SUCCESS"
  on error m
    return "ERR: " & m
  end try
end tell
`;
        const macRes = spawnSync('osascript', [], { input: appleScript, encoding: 'utf-8', timeout: 5000 });
        const out = macRes.stdout ? macRes.stdout.trim() : '';
        if (out === 'SENT_SUCCESS') {
          smsSent = true;
          smsProvider = 'macos_messages';
        } else {
          smsProvider = 'macos_messages_ready';
          smsError = out || 'Disponible via bouton direct';
        }
      } catch (err: any) {
        smsProvider = 'unconfigured';
        smsError = err?.message || 'Erreur macOS Messages';
      }
    } else {
      smsProvider = 'unconfigured';
      smsError = 'Passerelle SMS automatique non configurée (WhatsApp / SMS direct 1-clic disponible)';
    }

    // 3. ENREGISTREMENT AU JOURNAL
    appendNotificationLog({
      timestamp: new Date().toISOString(),
      type: isTenantInvite ? 'TENANT_INVITATION' : 'LEASE_INVITATION',
      recipientName: invitationData.recipientName,
      recipientEmail: invitationData.recipientEmail,
      recipientPhone: invitationData.recipientPhone,
      leaseId: invitationData.leaseId,
      emailSent,
      emailProvider,
      smsSent,
      smsProvider,
      notes: `Email: ${emailSent ? 'OK' : emailError} | SMS: ${smsSent ? 'OK' : smsError}`,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      leaseId: invitationData.leaseId,
      recipient: {
        name: invitationData.recipientName,
        email: invitationData.recipientEmail,
        phone: invitationData.recipientPhone,
        cleanPhone: cleanRecipientPhone,
      },
      emailStatus: {
        sent: emailSent,
        provider: emailProvider,
        error: emailError,
      },
      smsStatus: {
        sent: smsSent,
        provider: smsProvider,
        error: smsError,
      },
      deepLinks: {
        whatsappUrl,
        smsUri,
        mailtoUrl,
        gmailUrl,
      },
      textMessage,
      emailSubject,
    });
  } catch (error: any) {
    console.error('[NotificationAPI] Erreur globale:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Erreur interne du serveur lors du dispatch de notification',
      },
      { status: 500 }
    );
  }
}

