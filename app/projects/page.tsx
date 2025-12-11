import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProjectsOverview } from "@/components/projects/projects-overview"

export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <ProjectsOverview />
    </DashboardLayout>
  )
}
