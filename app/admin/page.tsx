import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminContent } from "@/components/admin/admin-content"
import { AdminGuard } from "@/components/auth/admin-guard"

export default function AdminPage() {
  return (
    <AdminGuard>
      <DashboardLayout>
        <AdminContent />
      </DashboardLayout>
    </AdminGuard>
  )
}
