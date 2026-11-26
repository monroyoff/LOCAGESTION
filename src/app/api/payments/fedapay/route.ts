import { NextRequest, NextResponse } from 'next/server';

const FEDAPAY_API_BASE = 'https://api.fedapay.com/v1';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = 'create',
      transactionId,
      amount,
      rentAmount,
      description,
      customer,
      period,
      leaseId,
      isTestLive,
    } = body;

    const secretKey =
      process.env.FEDAPAY_SECRET_KEY || 'sk_live_3JsUiarJe-EvU002SIYQ54yW';

    // 1. Action : Vérification du statut d'une transaction
    if (action === 'verify' && transactionId) {
      const response = await fetch(`${FEDAPAY_API_BASE}/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      const tx = data['v1/transaction'];

      if (!tx) {
        return NextResponse.json({
          success: false,
          error: 'Transaction introuvable sur FedaPay',
        });
      }

      return NextResponse.json({
        success: true,
        status: tx.status, // 'approved' | 'pending' | 'declined' | 'canceled'
        transaction: tx,
      });
    }

    // 2. Action : Création d'une transaction FedaPay en direct
    const rawAmount = isTestLive ? 100 : Number(amount || rentAmount || 100);
    const finalAmount = Math.max(100, Math.round(rawAmount));

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://locagestion.site';

    const customerData = {
      firstname: customer?.firstname || 'Locataire',
      lastname: customer?.lastname || 'LOCAGESTION',
      email: customer?.email || 'omegafacture@gmail.com',
      phone_number: {
        number: customer?.phone ? customer.phone.replace(/\D/g, '') : '97000000',
        country: customer?.country || 'bj',
      },
    };

    const txPayload = {
      description: description || `Règlement Loyer ${period || 'Novembre 2026'} - LOCAGESTION`,
      amount: finalAmount,
      currency: { iso: 'XOF' },
      callback_url: `${appUrl}/portal?fedapay_ref=success&amount=${finalAmount}&tab=quittances`,
      customer: customerData,
    };

    const createRes = await fetch(`${FEDAPAY_API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(txPayload),
    });

    const createData = await createRes.json();
    const createdTx = createData['v1/transaction'];

    if (!createdTx || !createdTx.id) {
      console.error('Erreur retour FedaPay:', createData);
      return NextResponse.json(
        {
          success: false,
          error: createData.message || 'Impossible de créer la transaction FedaPay',
          details: createData,
        },
        { status: 400 }
      );
    }

    // Génération du lien de paiement officiel
    const tokenRes = await fetch(`${FEDAPAY_API_BASE}/transactions/${createdTx.id}/token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const tokenData = await tokenRes.json();
    const paymentUrl = tokenData.url || createdTx.payment_url;
    const paymentToken = tokenData.token || createdTx.payment_token;

    // Calcul du split 98% / 2% pour la traçabilité comptable
    const fedapayFee = Math.round(finalAmount * 0.02);
    const platformCommission = Math.round(finalAmount * 0.02);
    const landlordPayout = Math.max(0, finalAmount - platformCommission);

    return NextResponse.json({
      success: true,
      transactionId: createdTx.id,
      reference: createdTx.reference,
      amount: finalAmount,
      paymentUrl,
      paymentToken,
      split: {
        rentAmount: finalAmount,
        fedapayFee,
        platformCommission,
        landlordPayout,
      },
      message: 'Transaction FedaPay Live initialisée avec succès.',
    });
  } catch (error: any) {
    console.error('Erreur serveur API FedaPay:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erreur interne de traitement FedaPay',
      },
      { status: 500 }
    );
  }
}
