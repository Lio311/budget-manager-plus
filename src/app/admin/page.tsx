import { getAdminData } from '@/lib/actions/admin'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

export default async function AdminPage() {
    let data
    try {
        data = await getAdminData()
    } catch (error) {
        redirect('/')
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Manage users, coupons, and feedback.
                </p>
            </div>

            <AdminDashboard initialData={data} />
        </div>
    )
}
