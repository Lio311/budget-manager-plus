// @ts-ignore - PayPal SDK doesn't have TypeScript definitions
import paypal from '@paypal/checkout-server-sdk'

function environment() {
    const clientId = process.env.PAYPAL_CLIENT_ID!
    const clientSecret = process.env.PAYPAL_SECRET!

    return process.env.PAYPAL_MODE === 'live'
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret)
}

export function paypalClient() {
    return new paypal.core.PayPalHttpClient(environment())
}
