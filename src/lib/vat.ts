
export type VatStatus = 'EXEMPT' | 'AUTHORIZED' | 'LTD' | 'ASSOCIATION' | 'OTHER';

export function getVatRate(vatStatus?: string | null): number {
    if (vatStatus === 'EXEMPT') return 0;
    return 0.18;
}

export function calculateVat(amount: number, vatStatus?: string | null): number {
    const rate = getVatRate(vatStatus);
    return parseFloat((amount * rate).toFixed(2));
}

export function calculateAmountBeforeVat(amount: number, vatStatus?: string | null): number {
    const rate = getVatRate(vatStatus);
    return parseFloat((amount / (1 + rate)).toFixed(2));
}
