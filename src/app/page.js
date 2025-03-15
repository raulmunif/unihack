import AlertDashboard from '@/components/AlertDashboard';
import AlertMapWithMapbox from '@/components/AlertMapWithMapbox';
// or import AlertMap from '@/components/AlertMap';
// or import NearbyAlerts from '@/components/NearbyAlerts';

export default function Home() {
  return (
    <main className="container mx-auto p-4 space-y-6">
      <AlertDashboard />
      <AlertMapWithMapbox />
    </main>
  );
}