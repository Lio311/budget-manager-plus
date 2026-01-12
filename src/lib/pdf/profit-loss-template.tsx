import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Reuse similar styles to Invoice for consistency
const styles = StyleSheet.create({
    page: {
        padding: 30,
        backgroundColor: '#ffffff',
        fontFamily: 'Alef',
    },
    header: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottom: '3px solid #10b981'
    },
    titleSection: {
        alignItems: 'flex-end',
    },
    reportTitle: {
        fontSize: 24,
        color: '#10b981',
    },
    reportSubtitle: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4
    },
    businessInfo: {
        alignItems: 'flex-start', // Logo on left (in LTR sense, but right in RTL layout... wait. row-reverse puts start at right. so align-items flex-end would be left? No, cross axis.)
        // Actually, just let the Image serve as logo.
    },
    logo: {
        width: 80,
        height: 60,
        objectFit: 'contain'
    },

    // Table Styles
    table: {
        marginTop: 20,
        width: '100%',
    },
    tableHeaderRegex: {
        flexDirection: 'row-reverse',
        backgroundColor: '#f3f4f6',
        padding: 8,
        borderBottom: '2px solid #e5e7eb',
        alignItems: 'center'
    },
    tableRow: {
        flexDirection: 'row-reverse',
        padding: 8,
        borderBottom: '1px solid #e5e7eb',
        alignItems: 'center'
    },
    colDate: { width: '15%', textAlign: 'right', fontSize: 9, color: '#6b7280', paddingRight: 2 },
    colDesc: { width: '35%', textAlign: 'right', fontSize: 9, color: '#374151', paddingRight: 2 },
    colCategory: { width: '20%', textAlign: 'right', fontSize: 9, color: '#6b7280', paddingRight: 2 },
    colAmount: { width: '15%', textAlign: 'right', fontSize: 9, color: '#1f2937', fontWeight: 'bold' },
    colVat: { width: '15%', textAlign: 'right', fontSize: 9, color: '#6b7280' },

    sectionTitle: {
        fontSize: 14,
        color: '#1f2937',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'right',
        fontWeight: 'bold',
        borderBottom: '1px solid #10b981',
        paddingBottom: 4
    },

    totalsSection: {
        marginTop: 30,
        padding: 15,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        border: '1px solid #e5e7eb'
    },
    totalRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    totalLabel: {
        fontSize: 12,
        color: '#4b5563'
    },
    totalValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#111827'
    },

    grandTotal: {
        marginTop: 10,
        paddingTop: 10,
        borderTop: '2px solid #10b981',
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
    },
    grandTotalLabel: {
        fontSize: 16,
        color: '#10b981',
        fontWeight: 'bold'
    },
    grandTotalValue: {
        fontSize: 16,
        color: '#10b981',
        fontWeight: 'bold'
    },

    footer: {
        marginTop: 20,
        paddingTop: 10,
        borderTop: '1px solid #e5e7eb',
        flexDirection: 'column',
        alignItems: 'center'
    },
    footerRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5
    },
    footerText: {
        fontSize: 10,
        color: '#6b7280',
    },
    poweredByLogo: {
        width: 60,
        height: 18,
        objectFit: 'contain'
    }
})

interface ProfitLossData {
    period: string
    businessName: string
    businessLogo?: string
    poweredByLogoPath?: string

    incomes: {
        total: number
        items: { date: Date, description: string, category: string, amount: number, vat: number }[]
    }

    expenses: {
        total: number
        items: { date: Date, description: string, category: string, amount: number, vat: number }[]
    }

    netProfit: number
    currency: string
}

export const ProfitLossTemplate: React.FC<{ data: ProfitLossData }> = ({ data }) => {
    const formatCurrency = (amount: number) => {
        return `${data.currency === 'ILS' ? '₪' : data.currency} ${amount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}`
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.titleSection}>
                        <Text style={styles.reportTitle}>דוח רווח והפסד</Text>
                        <Text style={styles.reportSubtitle}>{data.businessName} | {data.period}</Text>
                    </View>
                    {data.businessLogo && (
                        <Image src={data.businessLogo} style={styles.logo} />
                    )}
                </View>

                {/* Income Section */}
                <View>
                    <Text style={styles.sectionTitle}>הכנסות</Text>
                    <View style={styles.tableHeaderRegex}>
                        <Text style={styles.colDate}>תאריך</Text>
                        <Text style={styles.colDesc}>תיאור</Text>
                        <Text style={styles.colCategory}>קטגוריה</Text>
                        <Text style={styles.colAmount}>נטו</Text>
                        <Text style={styles.colVat}>מע"מ</Text>
                    </View>
                    {data.incomes.items.map((item, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.colDate}>{new Date(item.date).toLocaleDateString('he-IL')}</Text>
                            <Text style={styles.colDesc}>{item.description}</Text>
                            <Text style={styles.colCategory}>{item.category}</Text>
                            <Text style={styles.colAmount}>{formatCurrency(item.amount)}</Text>
                            <Text style={styles.colVat}>{formatCurrency(item.vat)}</Text>
                        </View>
                    ))}
                    <View style={[styles.tableRow, { backgroundColor: '#f0fdf4', borderTop: '1px solid #10b981' }]}>
                        <Text style={[styles.colDesc, { fontWeight: 'bold', width: '70%' }]}>סה״כ הכנסות</Text>
                        <Text style={[styles.colAmount, { fontWeight: 'bold', color: '#166534' }]}>{formatCurrency(data.incomes.total)}</Text>
                        <Text style={styles.colVat}></Text>
                    </View>
                </View>

                {/* Expenses Section */}
                <View style={{ marginTop: 10 }}>
                    <Text style={[styles.sectionTitle, { color: '#b91c1c', borderBottomColor: '#b91c1c' }]}>הוצאות</Text>
                    <View style={styles.tableHeaderRegex}>
                        <Text style={styles.colDate}>תאריך</Text>
                        <Text style={styles.colDesc}>תיאור</Text>
                        <Text style={styles.colCategory}>קטגוריה</Text>
                        <Text style={styles.colAmount}>נטו</Text>
                        <Text style={styles.colVat}>מע"מ</Text>
                    </View>
                    {data.expenses.items.map((item, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={styles.colDate}>{new Date(item.date).toLocaleDateString('he-IL')}</Text>
                            <Text style={styles.colDesc}>{item.description}</Text>
                            <Text style={styles.colCategory}>{item.category}</Text>
                            <Text style={styles.colAmount}>{formatCurrency(item.amount)}</Text>
                            <Text style={styles.colVat}>{formatCurrency(item.vat)}</Text>
                        </View>
                    ))}
                    <View style={[styles.tableRow, { backgroundColor: '#fef2f2', borderTop: '1px solid #ef4444' }]}>
                        <Text style={[styles.colDesc, { fontWeight: 'bold', width: '70%' }]}>סה״כ הוצאות</Text>
                        <Text style={[styles.colAmount, { fontWeight: 'bold', color: '#b91c1c' }]}>{formatCurrency(data.expenses.total)}</Text>
                        <Text style={styles.colVat}></Text>
                    </View>
                </View>

                {/* Summary Section */}
                <View style={styles.totalsSection} wrap={false}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>:סה״כ הכנסות (חייבות במס)</Text>
                        <Text style={[styles.totalValue, { color: '#166534' }]}>{formatCurrency(data.incomes.total)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>:סה״כ הוצאות (מוכרות)</Text>
                        <Text style={[styles.totalValue, { color: '#b91c1c' }]}>{formatCurrency(data.expenses.total)}</Text>
                    </View>

                    <View style={styles.grandTotal}>
                        <Text style={styles.grandTotalLabel}>:רווח / הפסד נקי</Text>
                        <Text style={[styles.grandTotalValue, { color: data.netProfit >= 0 ? '#10b981' : '#ef4444' }]}>
                            {formatCurrency(data.netProfit)}
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer} wrap={false}>
                    <View style={styles.footerRow}>
                        <Text style={styles.footerText}>מסמך זה הופק באופן אוטומטי על ידי</Text>
                        {data.poweredByLogoPath && (
                            <Image src={data.poweredByLogoPath} style={styles.poweredByLogo} />
                        )}
                    </View>
                    <Text style={styles.footerText}>
                        {new Date().toLocaleDateString('he-IL')} :תאריך הפקה
                    </Text>
                </View>
            </Page>
        </Document>
    )
}
