import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminOpportunitiesContent } from "@/components/admin/admin-opportunities-content"
import { AdminGuard } from "@/components/auth/admin-guard"

export default function AdminOpportunitiesPage() {
  return (
    <AdminGuard>
      <DashboardLayout>
        <AdminOpportunitiesContent />
      </DashboardLayout>
    </AdminGuard>
  )
}
