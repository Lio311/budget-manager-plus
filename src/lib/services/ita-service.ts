import { Invoice, Client, BusinessProfile } from '@prisma/client'

export class ItaOfflineError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ItaOfflineError'
    }
}

const ITA_SANDBOX_URL = 'https://openapi.taxes.gov.il/shaam/tsandbox'

/**
 * Retrieves a short-lived access token using the long-lived refresh token
 */
export async function getItaAccessToken(refreshToken: string): Promise<string> {
    const clientId = process.env.ITA_CLIENT_ID
    const clientSecret = process.env.ITA_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
        throw new Error('ITA credentials not configured')
    }

    const tokenUrl = `${ITA_SANDBOX_URL}/longtimetoken/oauth2/token`
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    })

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString(),
        signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('ITA Access Token Error:', errorText)
        throw new ItaOfflineError('Failed to retrieve access token from ITA')
    }

    const data = await response.json()
    return data.access_token
}

/**
 * Requests an allocation number from the Israel Tax Authority API
 */
export async function generateAllocationNumber(
    invoice: Invoice, 
    client: Client, 
    businessProfile: BusinessProfile
): Promise<string> {
    if (!businessProfile.itaRefreshToken) {
        throw new Error('No ITA refresh token available')
    }

    try {
        const accessToken = await getItaAccessToken(businessProfile.itaRefreshToken)

        // API Endpoint for Allocation Number (Based on ITA OpenAPI specs)
        const endpointUrl = `${ITA_SANDBOX_URL}/invoices/v1/allocation`

        // Map Invoice data to ITA JSON format
        // Note: You must ensure this matches the exact ITA spec from their OpenAPI docs
        const payload = {
            InvoiceId: invoice.id,
            InvoiceDate: invoice.issueDate.toISOString(), // Standard ISO format or YYYY-MM-DD
            InvoiceType: 305, // 305 = Tax Invoice, 320 = Credit Note, etc.
            CustomerTaxId: client.taxId?.replace(/[^0-9]/g, ''),
            CustomerName: client.name,
            TotalAmount: invoice.total,
            VatAmount: invoice.tax,
            Currency: invoice.currency || 'ILS'
        }

        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15000) // 15 second timeout for ITA
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('ITA Allocation Error:', errorText)
            
            if (response.status >= 500 || response.status === 408) {
                // Server errors or timeouts mean ITA is down
                throw new ItaOfflineError('ITA servers are currently unavailable')
            }
            
            // Client errors (4xx) mean our payload is wrong
            throw new Error(`ITA rejected the request: ${errorText}`)
        }

        const data = await response.json()
        return data.allocationNumber || data.AllocationNumber || data.confirmation_number
        
    } catch (error) {
        if (error instanceof ItaOfflineError || (error as Error).name === 'TimeoutError') {
            throw new ItaOfflineError('ITA API is offline or timed out')
        }
        throw error
    }
}
