"use client"

import { useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProjectDetail } from "@/components/projects/project-detail"

export default function ProjectDetailPage() {
    const params = useParams()
    const projectId = params?.id as string

    if (!projectId) {
        return (
            <DashboardLayout>
                <div className="flex h-screen items-center justify-center">
                    <div className="text-center">
                        <p className="text-lg font-semibold">Project ID not found</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <ProjectDetail projectId={projectId} />
        </DashboardLayout>
    )
}
