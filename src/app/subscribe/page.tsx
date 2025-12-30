import { Paywall } from '@/components/subscription/Paywall'
import { ForceLightMode } from '@/components/ForceLightMode'

export default function SubscribePage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const plan = typeof searchParams.plan === 'string' ? searchParams.plan : 'PERSONAL'
    return (
        <>
            <ForceLightMode />
            <Paywall initialPlan={plan} />
        </>
    )
}
