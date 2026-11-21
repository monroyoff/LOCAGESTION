import { SkeletonPortalDashboard } from '@/components/ui/SkeletonLoader';

export default function PortalLoading() {
  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-150">
      <SkeletonPortalDashboard />
    </div>
  );
}
