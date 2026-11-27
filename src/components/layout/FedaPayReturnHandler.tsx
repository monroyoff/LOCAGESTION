'use client';

import { useEffect, useRef } from 'react';
import { useSpace } from '@/lib/context/space-context';
import { PlanService } from '@/lib/services/plan-service';
import { ListingsService, BOOST_PACKS } from '@/lib/services/listings-service';
import { notifySave } from '@/lib/notifications/action-notifier';
import { formatFCFA } from '@/lib/money/format';

const REDEEMED_TX_KEY_PREFIX = 'locagestion:redeemed_tx:';

export function FedaPayReturnHandler() {
  const { user } = useSpace();
  const processedTxRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFedaPayReturn = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);

        // 1. Détection des retours de boost d'annonce
        const isBoostCheck =
          urlParams.has('fedapay_boost_check') ||
          urlParams.has('boost_listing_id') ||
          urlParams.get('type') === 'boost';

        if (isBoostCheck) {
          const boostListingId =
            urlParams.get('fedapay_boost_check') ||
            urlParams.get('boost_listing_id') ||
            urlParams.get('listing_id');
          const packId = (urlParams.get('pack_id') || 'boost_7d') as 'flash_weekend' | 'boost_7d' | 'boost_14d';
          const expectedPrice = Number(urlParams.get('expected_price') || urlParams.get('amount') || 0);
          const rawStatus = (urlParams.get('status') || urlParams.get('payment_status') || '').toLowerCase();
          const txId =
            urlParams.get('id') ||
            urlParams.get('tx_id') ||
            urlParams.get('transaction_id');

          // Nettoyage immédiat et strict de l'URL pour empêcher toute réexécution au rechargement
          urlParams.delete('fedapay_boost_check');
          urlParams.delete('boost_listing_id');
          urlParams.delete('listing_id');
          urlParams.delete('pack_id');
          urlParams.delete('expected_price');
          urlParams.delete('days');
          urlParams.delete('fedapay_ref');
          urlParams.delete('status');
          urlParams.delete('payment_status');
          urlParams.delete('id');
          urlParams.delete('tx_id');
          urlParams.delete('transaction_id');
          urlParams.delete('amount');
          urlParams.delete('type');
          const cleanQuery = urlParams.toString();
          const cleanUrl = window.location.pathname + (cleanQuery ? `?${cleanQuery}` : '') + window.location.hash;
          window.history.replaceState({}, '', cleanUrl);

          // 1. Détection prioritaire de l'annulation par l'utilisateur sur le guichet FedaPay
          if (rawStatus === 'canceled' || rawStatus === 'declined') {
            if (boostListingId) {
              ListingsService.cancelBoost(boostListingId);
            }
            notifySave(
              '⚠️ Paiement annulé. Aucun débit n’a été effectué et l’annonce n’a pas été mise en avant.',
              'Paiement Annulé'
            );
            return;
          }

          // 2. Si aucun ID de transaction n'est retourné par FedaPay -> Annulation de sécurité
          if (!txId) {
            if (boostListingId) {
              ListingsService.cancelBoost(boostListingId);
            }
            notifySave(
              'Opération non finalisée. Aucun paiement validé détecté pour cette mise en avant.',
              'Paiement Annulé'
            );
            return;
          }

          // 3. Protection anti-rejeu (Replay Attack) : vérifier si ce txId a déjà été validé
          const alreadyRedeemed = localStorage.getItem(`${REDEEMED_TX_KEY_PREFIX}${txId}`);
          if (alreadyRedeemed || processedTxRef.current.has(txId)) {
            console.warn('[FedaPay Boost] Transaction déjà traitée précédemment:', txId);
            return;
          }
          processedTxRef.current.add(txId);

          // 4. VÉRIFICATION STRICTE CÔTÉ SERVEUR SUR L'API OFFICIELLE FEDAPAY
          const verifyRes = await fetch('/api/payments/fedapay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'verify', transactionId: txId }),
          });

          const verifyData = await verifyRes.json();
          const pack = BOOST_PACKS.find((p) => p.id === packId) || BOOST_PACKS[1];
          const targetPrice = expectedPrice > 0 ? expectedPrice : pack.price;

          // 5. Validation de la réponse officielle FedaPay
          if (verifyData.success && verifyData.status === 'approved') {
            const paidAmount = Number(verifyData.amount || verifyData.transaction?.amount || 0);
            if (paidAmount < targetPrice) {
              console.error('[FedaPay Boost Security] Montant payé insuffisant:', paidAmount, 'attendu:', targetPrice);
              if (boostListingId) {
                ListingsService.cancelBoost(boostListingId);
              }
              notifySave(
                'Erreur financière : le montant réglé est inférieur au tarif du pack sélectionné.',
                'Paiement Non Conforme'
              );
              return;
            }

            // Scellement anti-rejeu
            localStorage.setItem(
              `${REDEEMED_TX_KEY_PREFIX}${txId}`,
              JSON.stringify({
                txId,
                type: 'boost',
                listingId: boostListingId,
                packId,
                amount: paidAmount,
                date: new Date().toISOString(),
                userId: user?.id,
              })
            );

            // Activation certifiée du boost
            if (boostListingId) {
              const updated = ListingsService.applyBoost(boostListingId, packId, txId);
              if (updated) {
                notifySave(
                  `🎉 Félicitations ! Votre paiement de ${formatFCFA(paidAmount)} a été vérifié. Votre annonce « ${updated.title} » est désormais en vedette (${pack.name}) !`,
                  'Boost Activé ⭐'
                );
                window.dispatchEvent(new CustomEvent('locagestion:listings_changed'));
              }
            }
          } else if (verifyData.status === 'canceled' || verifyData.status === 'declined') {
            if (boostListingId) {
              ListingsService.cancelBoost(boostListingId);
            }
            notifySave(
              '⚠️ Paiement annulé. Aucun débit n’a été réalisé.',
              'Paiement Annulé'
            );
          } else if (verifyData.status === 'pending') {
            notifySave(
              '⏳ Paiement en attente de confirmation par votre opérateur Mobile Money. La mise en avant s’activera dès validation bancaire.',
              'Paiement en Attente'
            );
          } else {
            if (boostListingId) {
              ListingsService.cancelBoost(boostListingId);
            }
            notifySave(
              'La transaction n’a pas pu être validée par les services de paiement FedaPay. L’annonce n’a pas été boostée.',
              'Paiement Non Validé'
            );
          }
          return;
        }

        // 2. Détection des retours de souscription FedaPay Pro
        const isPlanCheck =
          urlParams.get('fedapay_sub_check') === 'pro' ||
          urlParams.get('fedapay_plan') === 'pro' ||
          (urlParams.get('plan') === 'pro' &&
            (urlParams.has('fedapay_ref') ||
              urlParams.has('status') ||
              urlParams.has('id') ||
              urlParams.has('tx_id')));

        if (!isPlanCheck) return;

        const rawStatus = (urlParams.get('status') || urlParams.get('payment_status') || '').toLowerCase();
        const txId =
          urlParams.get('id') ||
          urlParams.get('tx_id') ||
          urlParams.get('transaction_id');

        // Nettoyage immédiat et strict de l'URL pour empêcher toute réexécution au rechargement
        urlParams.delete('fedapay_sub_check');
        urlParams.delete('fedapay_plan');
        urlParams.delete('fedapay_ref');
        urlParams.delete('payment_status');
        urlParams.delete('status');
        urlParams.delete('plan');
        urlParams.delete('amount');
        urlParams.delete('id');
        urlParams.delete('tx_id');
        urlParams.delete('transaction_id');
        const newQuery = urlParams.toString();
        const newUrl =
          window.location.pathname + (newQuery ? `?${newQuery}` : '') + window.location.hash;
        window.history.replaceState({}, '', newUrl);

        // 1. Détection prioritaire de l'annulation par l'utilisateur sur le guichet FedaPay
        if (rawStatus === 'canceled' || rawStatus === 'declined') {
          notifySave(
            '⚠️ Paiement annulé. Votre compte reste sur sa formule actuelle sans aucun débit.',
            'Paiement Annulé'
          );
          return;
        }

        // 2. Si aucun ID de transaction n'est retourné par FedaPay -> Annulation de sécurité
        if (!txId) {
          notifySave(
            'Opération non finalisée. Aucun paiement validé détecté.',
            'Paiement Annulé'
          );
          return;
        }

        // 3. Protection anti-rejeu (Replay Attack) : vérifier si ce txId a déjà été validé
        const alreadyRedeemed = localStorage.getItem(`${REDEEMED_TX_KEY_PREFIX}${txId}`);
        if (alreadyRedeemed || processedTxRef.current.has(txId)) {
          console.warn('[FedaPay] Transaction déjà traitée précédemment:', txId);
          return;
        }
        processedTxRef.current.add(txId);

        // 4. VÉRIFICATION STRICTE CÔTÉ SERVEUR SUR L'API OFFICIELLE FEDAPAY
        const verifyRes = await fetch('/api/payments/fedapay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify', transactionId: txId }),
        });

        const verifyData = await verifyRes.json();

        // 5. Validation de la réponse officielle FedaPay
        if (verifyData.success && verifyData.status === 'approved') {
          // Contrôle financier supplémentaire : le montant payé doit couvrir les 5 000 FCFA
          const paidAmount = Number(verifyData.amount || verifyData.transaction?.amount || 0);
          if (paidAmount < 5000) {
            console.error('[FedaPay Security] Montant insuffisant détecté:', paidAmount);
            notifySave(
              'Erreur financière : le montant de la transaction est insuffisant pour la Formule Pro.',
              'Paiement Non Conforme'
            );
            return;
          }

          // Enregistrement du reçu de transaction pour scellement anti-rejeu
          localStorage.setItem(
            `${REDEEMED_TX_KEY_PREFIX}${txId}`,
            JSON.stringify({
              txId,
              amount: paidAmount,
              date: new Date().toISOString(),
              userId: user?.id,
            })
          );

          // Activation officielle de la formule Pro pour 30 jours
          PlanService.activateProPlan(user?.id, 30);
          notifySave(
            '🎉 Félicitations ! Votre paiement de 5 000 FCFA a été vérifié et validé. Votre Formule Entreprise & Pro (30 jours) est active.',
            'Abonnement Pro Validé'
          );
          window.dispatchEvent(new Event('locagestion:plan_changed'));
        } else if (verifyData.status === 'canceled' || verifyData.status === 'declined') {
          notifySave(
            '⚠️ Paiement annulé. Aucun débit n’a été prélevé sur votre compte.',
            'Paiement Annulé'
          );
        } else if (verifyData.status === 'pending') {
          notifySave(
            '⏳ Paiement en attente de confirmation par votre opérateur Mobile Money. Votre forfait sera crédité dès validation bancaire.',
            'Paiement en Attente'
          );
        } else {
          notifySave(
            'La transaction n’a pas pu être validée par les services de paiement.',
            'Paiement Non Validé'
          );
        }
      } catch (err) {
        console.error('Erreur traitement retour FedaPay:', err);
      }
    };

    handleFedaPayReturn();
  }, [user?.id]);

  return null;
}
