/**
 * Notificateur universel d'événements de téléchargement
 * Déclenche une alerte visuelle dès qu'un contrat, quittance ou rapport CSV est téléchargé.
 */

export interface DownloadEventDetail {
  filename: string;
  label?: string;
  timestamp: number;
}

export function notifyDownloadComplete(filename: string, label?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<DownloadEventDetail>('locagestion:download_complete', {
        detail: {
          filename,
          label,
          timestamp: Date.now(),
        },
      })
    );
  }
}
