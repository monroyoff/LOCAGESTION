'use client';

import React from 'react';

export interface PropertyCardData {
  id: string;
  code: string;
  title: string;
  price: string;
  location: string;
  proximity: string;
  proximityIcon: string;
  badgeTop: string;
  badgeTopColor: 'secondary' | 'tertiary' | 'primary';
  badgeTopIcon: string;
  imageUrl: string;
  imageAlt: string;
  features: string[];
  ownerInitials: string;
  ownerName: string;
  statusBadge: string;
  statusIcon: string;
}

interface LandingPropertyCardProps {
  property: PropertyCardData;
}

export function LandingPropertyCard({ property }: LandingPropertyCardProps) {
  const getBadgeColors = (color: 'secondary' | 'tertiary' | 'primary') => {
    switch (color) {
      case 'secondary':
        return 'bg-secondary-container text-on-secondary';
      case 'tertiary':
        return 'bg-tertiary-container text-on-tertiary';
      case 'primary':
      default:
        return 'bg-primary-container text-on-primary';
    }
  };

  return (
    <div className="flex flex-col rounded-2xl bg-surface-container shadow-md overflow-hidden group hover:-translate-y-1.5 transition-all duration-300 border border-surface-container-high/50 hover:border-surface-variant">
      {/* Property Visual & Overlays */}
      <div className="relative h-60 w-full overflow-hidden bg-surface-container-high">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          src={property.imageUrl}
          alt={property.imageAlt}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-black/30 pointer-events-none" />

        {/* Top Feature Badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={`px-3 py-1 rounded-full ${getBadgeColors(
              property.badgeTopColor
            )} font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm backdrop-blur-sm`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {property.badgeTopIcon}
            </span>
            {property.badgeTop}
          </span>
        </div>

        {/* Reference Code Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 rounded-full bg-surface-container-highest/90 backdrop-blur-md text-on-surface font-label-sm text-label-sm font-bold shadow-sm border border-white/10">
            {property.code}
          </span>
        </div>

        {/* Price & Proximity Bar */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
          <div className="leading-none">
            <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold drop-shadow-md">
              {property.price}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant ml-1 font-medium">
              /mois
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-surface-container/90 backdrop-blur-md text-tertiary font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm">
            <span className="material-symbols-outlined text-[14px]">
              {property.proximityIcon}
            </span>
            {property.proximity}
          </span>
        </div>
      </div>

      {/* Property Details Body */}
      <div className="p-space-md flex flex-col gap-space-sm flex-1">
        {/* Landmark & Location */}
        <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
          <span className="material-symbols-outlined text-primary text-[16px] shrink-0">
            location_on
          </span>
          <span className="truncate">{property.location}</span>
        </div>

        {/* Title */}
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold line-clamp-1">
          {property.title}
        </h3>

        {/* Amenities & African Specificities Grid */}
        <div className="grid grid-cols-2 gap-2 my-space-xs font-body-sm text-body-sm text-on-surface-variant">
          {property.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-secondary text-[16px] shrink-0">
                check_circle
              </span>
              <span className="truncate">{feature}</span>
            </div>
          ))}
        </div>

        {/* Owner / Manager Footer & Auto-deactivation Status */}
        <div className="pt-space-sm mt-auto border-t border-surface-container-high/60 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs text-primary shrink-0 border border-primary/20">
              {property.ownerInitials}
            </div>
            <span className="font-label-sm text-label-sm text-on-surface font-bold truncate">
              {property.ownerName}
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1 font-bold shrink-0 ml-2">
            <span className="material-symbols-outlined text-[16px]">
              {property.statusIcon}
            </span>
            {property.statusBadge}
          </span>
        </div>
      </div>
    </div>
  );
}
