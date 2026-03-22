'use server'

import { currentUser } from '@clerk/nextjs/server'

export async function getDebugCurrentUser() {
    try {
        const user = await currentUser()
        if (!user) return { id: 'No User', email: 'None' }
        return {
            id: user.id,
            email: user.emailAddresses[0]?.emailAddress
        }
    } catch (e) {
        return { id: 'Error', email: String(e) }
    }
}
