// Note: This file requires @react-pdf/renderer to be installed
// Run: npm install @react-pdf/renderer

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// Define styles with green/black/white theme
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
        direction: 'rtl'
    },
    header: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottom: '3px solid #10b981'
    },
    logo: {
        width: 80,
        height: 80,
        objectFit: 'contain'
    },
    invoiceTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#10b981',
        textAlign: 'right'
    },
    invoiceNumber: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'right',
        marginTop: 5
    },
    companyInfo: {
        textAlign: 'right',
        marginBottom: 20
    },
    companyName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 5
    },
    companyDetails: {
        fontSize: 10,
        color: '#6b7280',
        lineHeight: 1.5
    },
    section: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderRight: '4px solid #10b981'
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 10,
        textAlign: 'right'
    },
    row: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        marginBottom: 5
    },
    label: {
        fontSize: 10,
        color: '#6b7280',
        textAlign: 'right'
    },
    value: {
        fontSize: 10,
        color: '#1f2937',
        fontWeight: 'bold',
        textAlign: 'right'
    },
    divider: {
        borderBottom: '1px solid #e5e7eb',
        marginVertical: 15
    },
    totalsSection: {
        marginTop: 20,
        padding: 20,
        backgroundColor: '#10b981',
        borderRadius: 8
    },
    totalRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    totalLabel: {
        fontSize: 12,
        color: '#ffffff',
        textAlign: 'right'
    },
    totalValue: {
        fontSize: 12,
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'right'
    },
    grandTotal: {
        fontSize: 18,
        color: '#ffffff',
        fontWeight: 'bold',
        textAlign: 'right',
        marginTop: 10,
        paddingTop: 10,
        borderTop: '2px solid #ffffff'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        paddingTop: 20,
        borderTop: '1px solid #e5e7eb'
    },
    footerText: {
        fontSize: 9,
        color: '#9ca3af',
        marginBottom: 5
    },
    poweredBy: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10
    },
    poweredByText: {
        fontSize: 8,
        color: '#6b7280',
        marginLeft: 5
    },
    poweredByLogo: {
        width: 60,
        height: 20,
        objectFit: 'contain'
    }
})

interface InvoiceData {
    invoiceNumber: string
    issueDate: string
    dueDate: string
    status: string
    paymentMethod: string

    // Business info
    businessName: string
    businessId?: string
    businessAddress?: string
    businessPhone?: string
    businessEmail?: string
    businessLogo?: string

    // Client info
    clientName: string
    clientId?: string

    // Financial
    subtotal: number
    vatRate: number
    vatAmount: number
    total: number
    currency: string

    // Notes
    notes?: string
}

export const InvoiceTemplate: React.FC<{ data: InvoiceData }> = ({ data }) => {
    const formatCurrency = (amount: number) => {
        return `${data.currency === 'ILS' ? '₪' : data.currency}${amount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('he-IL')
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.invoiceTitle}>חשבונית</Text>
                        <Text style={styles.invoiceNumber}>מס׳ {data.invoiceNumber}</Text>
                    </View>
                    {data.businessLogo && (
                        <Image src={data.businessLogo} style={styles.logo} />
                    )}
                </View>

                {/* Company Info */}
                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{data.businessName}</Text>
                    <Text style={styles.companyDetails}>
                        {data.businessId && `ע.מ: ${data.businessId}\n`}
                        {data.businessAddress && `${data.businessAddress}\n`}
                        {data.businessPhone && `טלפון: ${data.businessPhone}\n`}
                        {data.businessEmail && `אימייל: ${data.businessEmail}`}
                    </Text>
                </View>

                {/* Client Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>פרטי לקוח</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>שם:</Text>
                        <Text style={styles.value}>{data.clientName}</Text>
                    </View>
                    {data.clientId && (
                        <View style={styles.row}>
                            <Text style={styles.label}>ח.פ / ע.מ:</Text>
                            <Text style={styles.value}>{data.clientId}</Text>
                        </View>
                    )}
                </View>

                {/* Invoice Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>פרטי חשבונית</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>תאריך הנפקה:</Text>
                        <Text style={styles.value}>{formatDate(data.issueDate)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>תאריך תשלום:</Text>
                        <Text style={styles.value}>{formatDate(data.dueDate)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>אמצעי תשלום:</Text>
                        <Text style={styles.value}>{data.paymentMethod}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>סטטוס:</Text>
                        <Text style={styles.value}>{data.status}</Text>
                    </View>
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>סכום לפני מע״מ:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(data.subtotal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>מע״מ ({data.vatRate}%):</Text>
                        <Text style={styles.totalValue}>{formatCurrency(data.vatAmount)}</Text>
                    </View>
                    <Text style={styles.grandTotal}>
                        סה״כ לתשלום: {formatCurrency(data.total)}
                    </Text>
                </View>

                {/* Notes */}
                {data.notes && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>הערות</Text>
                        <Text style={styles.value}>{data.notes}</Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        תודה על העסקה!
                    </Text>
                    <View style={styles.poweredBy}>
                        <Text style={styles.poweredByText}>הופק על ידי</Text>
                        <Image src="/K-LOGO.png" style={styles.poweredByLogo} />
                    </View>
                </View>
            </Page>
        </Document>
    )
}
