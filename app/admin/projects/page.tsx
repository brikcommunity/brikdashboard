import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminProjectsContent } from "@/components/admin/admin-projects-content"
import { AdminGuard } from "@/components/auth/admin-guard"

export default function AdminProjectsPage() {
  return (
    <AdminGuard>
      <DashboardLayout>
        <AdminProjectsContent />
      </DashboardLayout>
    </AdminGuard>
  )
}

