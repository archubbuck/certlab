import SubscriptionPlans from "@/components/SubscriptionPlans";
import BreadcrumbNavigation from "@/components/BreadcrumbNavigation";

export default function SubscriptionPlansPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation />

        {/* Plans Component */}
        <SubscriptionPlans />
      </div>
    </div>
  );
}