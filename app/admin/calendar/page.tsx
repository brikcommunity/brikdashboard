import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminCalendarContent } from "@/components/admin/admin-calendar-content"
import { AdminGuard } from "@/components/auth/admin-guard"

export default function AdminCalendarPage() {
  return (
    <AdminGuard>
      <DashboardLayout>
        <AdminCalendarContent />
      </DashboardLayout>
    </AdminGuard>
  )
}
