import { Paywall } from '@/components/subscription/Paywall'

export default function SubscribePage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const plan = typeof searchParams.plan === 'string' ? searchParams.plan : 'PERSONAL'
    return <Paywall initialPlan={plan} />
}
