import { getAdminData } from '@/lib/actions/admin'
import { getMaintenanceMode } from '@/lib/actions/maintenance'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

export default async function AdminPage() {
    let data
    // try {
    data = await getAdminData()
    const maintenanceMode = await getMaintenanceMode()
    // } catch (error) {
    //     console.error('Admin page error:', error)
    //     return (
    //         <div className="p-8 text-center text-red-500">
    //             <h1 className="text-2xl font-bold">Error Loading Admin Data</h1>
    //             <p>{(error as Error).message}</p>
    //             <pre className="mt-4 text-left bg-gray-100 p-4 overflow-auto text-sm text-black">
    //                 {JSON.stringify(error, null, 2)}
    //             </pre>
    //         </div>
    //     )
    // }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Manage users, coupons, and feedback.
                </p>
            </div>

            <AdminDashboard initialData={data} maintenanceMode={maintenanceMode} />
        </div>
    )
}
