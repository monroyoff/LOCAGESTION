'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  ZoomIn,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  User,
  Building2,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { ReportedIncident, IncidentService, IncidentStatus } from '@/lib/services/incident-service';
import { LandlordIncidentModal } from './LandlordIncidentModal';

export function LandlordIncidentsSection() {
  const [incidents, setIncidents] = useState<ReportedIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<ReportedIncident | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const loadIncidents = () => {
    setIncidents(IncidentService.getIncidents());
  };

  useEffect(() => {
    loadIncidents();
    const handleUpdate = () => loadIncidents();
    window.addEventListener('locagestion:incidents_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('locagestion:incidents_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const pendingCount = incidents.filter((i) => i.status !== 'resolu').length;
  const criticalCount = incidents.filter(
    (i) => i.status !== 'resolu' && (i.urgency === 'critique' || i.urgency === 'urgente')
  ).length;

  const filteredIncidents = incidents.filter((i) => {
    if (filter === 'pending') return i.status !== 'resolu';
    if (filter === 'resolved') return i.status === 'resolu';
    return true;
  });

  const handleQuickStatusChange = (
    id: string,
    newStatus: IncidentStatus,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    IncidentService.updateIncidentStatus(id, newStatus);
    loadIncidents();
  };

  return (
    <>
      <section
        id="incidents-section"
        aria-label="Pannes et incidents signalés"
        className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-soft space-y-5 animate-in fade-in duration-200"
      >
        {/* Header de section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-slate-900 tracking-tight">
                  Incidents & Pannes Signalés par les Locataires
                </h3>
                {pendingCount > 0 && (
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                    {pendingCount} en attente
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Constats techniques transmis en direct depuis l'espace locataire avec photos justificatives.
              </p>
            </div>
          </div>

          {/* Filtres d'affichage */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tous ({incidents.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              À traiter ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('resolved')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                filter === 'resolved'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Résolus ({incidents.length - pendingCount})
            </button>
          </div>
        </div>

        {/* Bannière Alerte Prioritaire si panne urgente */}
        {criticalCount > 0 && filter !== 'resolved' && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="text-amber-950 font-black block">
                  {criticalCount} panne{criticalCount > 1 ? 's nécessitent' : ' nécessite'} une intervention urgente
                </strong>
                <span className="text-amber-800 text-[11px]">
                  Consultez les photos constatées par le locataire et mandatez un artisan en 1 clic via WhatsApp.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const firstPending = incidents.find(
                  (i) => i.status !== 'resolu' && (i.urgency === 'critique' || i.urgency === 'urgente')
                );
                if (firstPending) setSelectedIncident(firstPending);
              }}
              className="py-1.5 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] self-start sm:self-auto cursor-pointer shadow-xs transition-colors"
            >
              Inspecter en priorité →
            </button>
          </div>
        )}

        {/* Liste des incidents */}
        {filteredIncidents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
            <p className="text-xs font-bold text-slate-700">
              Aucune panne signalée dans cette vue
            </p>
            <p className="text-[11px] text-slate-400">
              Toutes les installations et équipements du patrimoine sont fonctionnels.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident) => {
              const isResolved = incident.status === 'resolu';
              const tenantWhatsApp = encodeURIComponent(
                `Bonjour ${incident.tenantName},\n\nConcernant votre signalement technique pour : "${incident.category}" sur le lot ${incident.unit} (${incident.property}).\n\nNous nous occupons du dossier.`
              );

              return (
                <div
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group hover:shadow-md ${
                    isResolved
                      ? 'bg-slate-50/60 border-slate-200/80 opacity-80'
                      : incident.urgency === 'critique'
                      ? 'bg-rose-50/40 border-rose-200/90'
                      : incident.urgency === 'urgente'
                      ? 'bg-amber-50/40 border-amber-200/90'
                      : 'bg-white border-slate-200/90'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Infos Principales */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {incident.id}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-black text-slate-900">
                          {incident.category}
                        </span>

                        {/* Badge Urgence */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            incident.urgency === 'critique'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : incident.urgency === 'urgente'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Urgence {incident.urgency}
                        </span>

                        {/* Badge Statut */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : incident.status === 'pris_en_charge'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>
                            {isResolved
                              ? 'Résolu'
                              : incident.status === 'pris_en_charge'
                              ? 'Pris en charge'
                              : 'En attente'}
                          </span>
                        </span>

                        <span className="text-[11px] text-slate-400 font-medium ml-auto sm:ml-0">
                          Déclaré le {incident.createdAt}
                        </span>
                      </div>

                      {/* Locataire & Logement */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {incident.unit} • {incident.property}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Locataire : <strong>{incident.tenantName}</strong> ({incident.tenantPhone})
                        </span>
                      </div>

                      {/* Description du problème */}
                      <p className="text-xs text-slate-700 leading-relaxed font-medium pt-0.5">
                        {incident.description}
                      </p>

                      {/* Miniatures des photos attachées */}
                      {incident.photos.length > 0 && (
                        <div className="pt-1.5 flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            {incident.photos.length} photo(s) :
                          </span>
                          <div className="flex items-center gap-2">
                            {incident.photos.map((photo, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewPhoto(photo);
                                }}
                                className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-brand-500 transition-all cursor-pointer group/img"
                                title="Agrandir cette photo"
                              >
                                <img
                                  src={photo}
                                  alt={`Photo #${pIdx + 1}`}
                                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                  <ZoomIn className="w-3 h-3 text-white" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Rapides Bailleur */}
                    <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncident(incident);
                        }}
                        className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Wrench className="w-3.5 h-3.5 text-brand-400" />
                        <span>Gérer & Mandater</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/${incident.tenantPhone.replace(/[^0-9]/g, '')}?text=${tenantWhatsApp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Écrire au locataire sur WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp Locataire</span>
                        </a>

                        {!isResolved ? (
                          <button
                            type="button"
                            onClick={(e) => handleQuickStatusChange(incident.id, 'resolu', e)}
                            className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-bold transition-colors cursor-pointer border border-slate-200"
                            title="Marquer cette panne comme résolue"
                          >
                            ✓ Résolu
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleQuickStatusChange(incident.id, 'pris_en_charge', e)}
                            className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 text-[11px] font-bold transition-colors cursor-pointer border border-slate-200"
                            title="Rouvrir le ticket"
                          >
                            Rouvrir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modale d'inspection complète */}
      {selectedIncident && (
        <LandlordIncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onStatusUpdated={() => loadIncidents()}
        />
      )}

      {/* Lightbox Photo Preview */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              ✕
            </button>
            <img
              src={previewPhoto}
              alt="Photo de la panne"
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20 bg-black/50"
            />
          </div>
        </div>
      )}
    </>
  );
}

