'use client';

export type ActionToastType =
  | 'publish'
  | 'save'
  | 'update'
  | 'delete'
  | 'success'
  | 'info';

export interface ActionToastPayload {
  id?: string;
  title?: string;
  message: string;
  type?: ActionToastType;
  duration?: number; // en millisecondes, par défaut 3000ms
}

/**
 * Déclenche une notification élégante au centre de l'écran visible sur toute la plateforme.
 */
export function notifyAction(
  options: ActionToastPayload | string,
  customTitle?: string,
  type?: ActionToastType
) {
  if (typeof window === 'undefined') return;

  let payload: ActionToastPayload;

  if (typeof options === 'string') {
    payload = {
      message: options,
      title: customTitle,
      type: type || 'success',
      duration: 3200,
    };
  } else {
    payload = {
      duration: 3200,
      type: 'success',
      ...options,
    };
  }

  // Déduire un titre automatique percutant si non fourni
  if (!payload.title) {
    switch (payload.type) {
      case 'publish':
        payload.title = 'Annonce publiée avec succès !';
        break;
      case 'update':
        payload.title = 'Modifications enregistrées !';
        break;
      case 'delete':
        payload.title = 'Suppression effectuée !';
        break;
      case 'save':
      case 'success':
      default:
        payload.title = 'Enregistrement réussi !';
        break;
    }
  }

  window.dispatchEvent(
    new CustomEvent('locagestion:center_toast', {
      detail: payload,
    })
  );
}

// Raccourcis spécialisés
export const notifyPublish = (message: string, title = 'Annonce publiée avec succès !') =>
  notifyAction({ title, message, type: 'publish' });

export const notifySave = (message: string, title = 'Enregistrement réussi !') =>
  notifyAction({ title, message, type: 'save' });

export const notifyUpdate = (message: string, title = 'Modifications enregistrées !') =>
  notifyAction({ title, message, type: 'update' });

export const notifyDelete = (message: string, title = 'Suppression effectuée !') =>
  notifyAction({ title, message, type: 'delete' });

