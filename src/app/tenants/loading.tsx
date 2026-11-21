import { SkeletonTable } from '@/components/ui/SkeletonLoader';

export default function TenantsLoading() {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      <SkeletonTable rows={5} />
    </div>
  );
}
