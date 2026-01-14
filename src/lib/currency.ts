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
    'ILS': 'ש״ח',
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
const FALLBACK_RATES: Record<string, number> = {
    'USD': 0.27, // ~3.70 ILS
    'EUR': 0.25, // ~4.00 ILS
    'GBP': 0.21  // ~4.76 ILS
};

export async function convertToILS(amount: number, fromCurrency: string): Promise<number> {
    if (fromCurrency === 'ILS') return amount;

    try {
        const ratesData = await getExchangeRates();

        // Use API rate if available
        if (ratesData && ratesData.rates[fromCurrency]) {
            const rate = ratesData.rates[fromCurrency];
            return amount / rate;
        }

        // Fallback if API fails
        if (FALLBACK_RATES[fromCurrency]) {
            console.warn(`Using fallback rate for ${fromCurrency}`);
            return amount / FALLBACK_RATES[fromCurrency];
        }

        // Last resort
        console.error(`No rate found for ${fromCurrency}, returning original amount.`);
        return amount;

    } catch (error) {
        console.error('Conversion error:', error);
        // Fallback on error
        if (FALLBACK_RATES[fromCurrency]) {
            return amount / FALLBACK_RATES[fromCurrency];
        }
        return amount;
    }
}

export function getCurrencySymbol(code: string): string {
    return SUPPORTED_CURRENCIES[code as SupportedCurrency] || code;
}
