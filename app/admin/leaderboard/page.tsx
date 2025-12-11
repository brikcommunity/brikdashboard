import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AdminLeaderboardContent } from "@/components/admin/admin-leaderboard-content"
import { AdminGuard } from "@/components/auth/admin-guard"

export default function AdminLeaderboardPage() {
  return (
    <AdminGuard>
      <DashboardLayout>
        <AdminLeaderboardContent />
      </DashboardLayout>
    </AdminGuard>
  )
}
