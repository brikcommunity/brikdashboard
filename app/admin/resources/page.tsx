import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminResourcesContent } from "@/components/admin/admin-resources-content"
import { AdminGuard } from "@/components/auth/admin-guard"

export default function AdminResourcesPage() {
  return (
    <AdminGuard>
      <DashboardLayout>
        <AdminResourcesContent />
      </DashboardLayout>
    </AdminGuard>
  )
}
