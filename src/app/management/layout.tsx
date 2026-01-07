import { ManagementLayout } from '@/components/management/ManagementLayout'

export const metadata = {
    title: 'Management Dashboard',
    description: 'Project Management & KPIs',
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <ManagementLayout>{children}</ManagementLayout>
}
