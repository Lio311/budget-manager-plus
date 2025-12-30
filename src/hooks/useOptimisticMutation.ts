import { useSWRConfig } from 'swr'
import { toast } from 'sonner'

/**
 * Custom hook for optimistic mutations with automatic rollback on error
 * 
 * @example
 * const { execute } = useOptimisticMutation(
 *   '/api/incomes',
 *   addIncome,
 *   {
 *     getOptimisticData: (current, newIncome) => ({
 *       ...current,
 *       incomes: [...current.incomes, newIncome]
 *     }),
 *     successMessage: 'הכנסה נוספה בהצלחה!',
 *     errorMessage: 'שגיאה בהוספת הכנסה'
 *   }
 * )
 */
export function useOptimisticMutation<TData, TInput>(
    key: string | any[],
    mutationFn: (data: TInput) => Promise<any>,
    options?: {
        onSuccess?: (result: any) => void
        onError?: (error: any) => void
        getOptimisticData?: (current: TData, input: TInput) => TData
        successMessage?: string
        errorMessage?: string
        loadingMessage?: string
    }
) {
    const { mutate } = useSWRConfig()

    const execute = async (input: TInput) => {
        const toastId = options?.loadingMessage
            ? toast.loading(options.loadingMessage)
            : undefined

        // Store current data for rollback
        let previousData: TData | undefined

        try {
            // Optimistic update
            if (options?.getOptimisticData) {
                await mutate(
                    key,
                    async (current: TData | undefined) => {
                        if (!current) return current
                        previousData = current
                        return options.getOptimisticData!(current, input)
                    },
                    { revalidate: false }
                )
            }

            // Execute mutation
            const result = await mutationFn(input)

            // Check for server action error convention
            if (result && typeof result === 'object' && 'success' in result && !result.success) {
                throw new Error(result.error || 'Server action failed')
            }

            // Revalidate from server
            await mutate(key)

            // Success notification
            if (toastId) {
                toast.success(options?.successMessage || 'הפעולה בוצעה בהצלחה!', { id: toastId })
            } else if (options?.successMessage) {
                toast.success(options.successMessage)
            }

            options?.onSuccess?.(result)
            return result

        } catch (error) {
            // Rollback on error
            if (previousData) {
                await mutate(key, previousData, { revalidate: false })
            }

            // Error notification
            // Error notification
            const errorMsg = error instanceof Error && error.message ? error.message : (options?.errorMessage || 'אירעה שגיאה')

            if (toastId) {
                toast.error(errorMsg, { id: toastId })
            } else {
                toast.error(errorMsg)
            }

            options?.onError?.(error)
            throw error
        }
    }

    return { execute }
}

/**
 * Simpler version for toggle operations (like marking bills as paid)
 */
export function useOptimisticToggle<TData>(
    key: string | any[],
    mutationFn: (id: string, newValue: boolean) => Promise<any>,
    options?: {
        getOptimisticData: (current: TData, id: string, newValue: boolean) => TData
        successMessage?: string
        errorMessage?: string
    }
) {
    const { mutate } = useSWRConfig()

    const toggle = async (id: string, currentValue: boolean) => {
        const newValue = !currentValue
        let previousData: TData | undefined

        try {
            // Optimistic update
            await mutate(
                key,
                async (current: TData | undefined) => {
                    if (!current) return current
                    previousData = current
                    return options?.getOptimisticData(current, id, newValue)
                },
                { revalidate: false }
            )

            // Execute mutation
            await mutationFn(id, newValue)

            // Revalidate from server
            await mutate(key)

            if (options?.successMessage) {
                toast.success(options.successMessage)
            }

        } catch (error) {
            // Rollback on error
            if (previousData) {
                await mutate(key, previousData, { revalidate: false })
            }

            toast.error(options?.errorMessage || 'אירעה שגיאה')
            throw error
        }
    }

    return { toggle }
}

/**
 * Hook for optimistic delete operations
 */
export function useOptimisticDelete<TData>(
    key: string | any[],
    deleteFn: (id: string) => Promise<any>,
    options?: {
        getOptimisticData: (current: TData, id: string) => TData
        successMessage?: string
        errorMessage?: string
    }
) {
    const { mutate } = useSWRConfig()

    const deleteItem = async (id: string) => {
        const toastId = toast.loading('מוחק...')
        let previousData: TData | undefined

        try {
            // Optimistic update
            await mutate(
                key,
                async (current: TData | undefined) => {
                    if (!current) return current
                    previousData = current
                    return options?.getOptimisticData(current, id)
                },
                { revalidate: false }
            )

            // Execute deletion
            const result = await deleteFn(id)

            if (result && typeof result === 'object' && 'success' in result && !result.success) {
                throw new Error(result.error || 'Failed to delete')
            }

            // Revalidate from server
            await mutate(key)

            toast.success(options?.successMessage || 'נמחק בהצלחה!', { id: toastId })

        } catch (error: any) {
            // Rollback on error
            if (previousData) {
                await mutate(key, previousData, { revalidate: false })
            }

            const errorMsg = error instanceof Error && error.message ? error.message : (options?.errorMessage || 'שגיאה במחיקה')
            toast.error(errorMsg, { id: toastId })
            throw error
        }
    }

    return { deleteItem }
}
