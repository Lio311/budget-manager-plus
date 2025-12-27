import { unstable_cache } from 'next/cache';

const CACHE_DURATION = 3600; // 1 hour in seconds
const API_URL = 'https://api.frankfurter.app/latest';

interface ExchangeRates {
    amount: number;
    base: string;
    date: string;
    rates: Record<string, number>;
}

// Map of supported currency codes to their display symbols
export const SUPPORTED_CURRENCIES = {
    'ILS': '₪',
    'USD': '$',
    'EUR': '€'
} as const;

export type SupportedCurrency = keyof typeof SUPPORTED_CURRENCIES;

/**
 * Fetches exchange rates from Frankfurter API with caching.
 * Base is always ILS for simplicity in this specific app context, 
 * but the API supports changing base. 
 * We fetch rates relative to ILS to easily convert everything to ILS.
 */
export const getExchangeRates = unstable_cache(
    async (): Promise<ExchangeRates | null> => {
        try {
            // Fetch rates with ILS as base
            const response = await fetch(`${API_URL}?from=ILS&to=USD,EUR`);

            if (!response.ok) {
                console.error('Failed to fetch exchange rates:', response.statusText);
                return null;
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            return null;
        }
    },
    ['exchange-rates-ils'],
    { revalidate: CACHE_DURATION }
);

/**
 * Converts an amount from one currency to another using fetched rates.
 * Since our main goal is converting TO ILS for totals:
 * If from is ILS, return amount.
 * If from is USD/EUR, we need the rate of that currency relative to ILS.
 * The API gives us ILS -> USD (e.g. 0.27). So 1 ILS = 0.27 USD.
 * To convert USD to ILS: Amount / Rate.
 */
export async function convertToILS(amount: number, fromCurrency: string): Promise<number> {
    if (fromCurrency === 'ILS') return amount;

    try {
        const ratesData = await getExchangeRates();

        if (!ratesData || !ratesData.rates[fromCurrency]) {
            // Fallback: If API fails, return original amount (better than 0) but log error
            console.error(`Conversion failed for ${fromCurrency} to ILS. Rates missing.`);
            return amount;
        }

        const rate = ratesData.rates[fromCurrency];
        // ILS -> Currency rate (e.g. 0.27). 
        // X USD / 0.27 = Y ILS
        return amount / rate;

    } catch (error) {
        console.error('Conversion error:', error);
        return amount;
    }
}

export function getCurrencySymbol(code: string): string {
    return SUPPORTED_CURRENCIES[code as SupportedCurrency] || code;
}
