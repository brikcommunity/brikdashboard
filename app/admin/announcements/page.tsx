import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminAnnouncementsContent } from "@/components/admin/admin-announcements-content"
import { AdminGuard } from "@/components/auth/admin-guard"

export default function AdminAnnouncementsPage() {
  return (
    <AdminGuard>
      <DashboardLayout>
        <AdminAnnouncementsContent />
      </DashboardLayout>
    </AdminGuard>
  )
}
