import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminMembersContent } from "@/components/admin/admin-members-content"
import { AdminGuard } from "@/components/auth/admin-guard"

export default function AdminMembersPage() {
  return (
    <AdminGuard>
      <DashboardLayout>
        <AdminMembersContent />
      </DashboardLayout>
    </AdminGuard>
  )
}
