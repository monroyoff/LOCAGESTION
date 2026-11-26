import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, rentAmount, landlordId, tenantId, leaseId, period } = body;

    const fedapayFeeRate = 0.02; // ~2% frais opérateur supportés par le locataire
    const platformCommissionRate = 0.02; // 2% Formule Sérénité

    const cleanRent = Number(rentAmount) || 0;
    const fedapayFee = Math.round(cleanRent * fedapayFeeRate);
    const totalCharged = cleanRent + fedapayFee;
    const platformCommission = Math.round(cleanRent * platformCommissionRate);
    const landlordPayout = cleanRent - platformCommission;

    const transactionReference = `FP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return NextResponse.json({
      success: true,
      transaction: {
        reference: transactionReference,
        status: 'approved',
        rentAmount: cleanRent,
        fedapayFee,
        totalCharged,
        platformCommission,
        landlordPayout,
        currency: 'XOF',
        feesCoveredBy: 'customer',
        leaseId,
        period,
      },
      message: 'Transaction FedaPay initialisée et calculée avec succès.',
    });
  } catch (error) {
    console.error('Erreur API FedaPay:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur traitement transaction FedaPay' },
      { status: 500 }
    );
  }
}
