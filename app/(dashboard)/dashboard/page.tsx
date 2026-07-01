import { DashboardView } from "@/components/dashboard/dashboard-view";
import { LowStockBanner } from "@/components/dashboard/low-stock-banner";
import { UpcomingOrdersWidget } from "@/components/dashboard/upcoming-orders-widget";
import { getSessionAccess } from "@/lib/auth/get-session-access";

export default async function DashboardPage() {
  const access = await getSessionAccess();

  return (
    <>
      <LowStockBanner />
      <UpcomingOrdersWidget />
      <DashboardView userEmail={access?.email} />
    </>
  );
}
