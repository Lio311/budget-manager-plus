import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { InvoicePage } from './invoice-template'

const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#ffffff',
        fontFamily: 'Alef',
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
        color: '#10b981',
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
        color: '#6b7280',
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderBottomWidth: 0,
        marginTop: 10,
    },
    tableRow: {
        flexDirection: 'row-reverse',
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
        minHeight: 30,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#f9fafb',
    },
    tableCell: {
        padding: 5,
        fontSize: 10,
        textAlign: 'center',
        flex: 1,
    },
    tableCellHeader: {
        fontWeight: 'bold',
        color: '#374151',
    },
    totalSection: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#f3f4f6',
        borderRadius: 4,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
    },
    totalText: {
        fontSize: 12,
        fontWeight: 'bold',
    }
})

interface ConsolidatedReportProps {
    invoices: any[]
    month: string
    year: string
    businessName: string
}

export const ConsolidatedReportTemplate: React.FC<ConsolidatedReportProps> = ({ invoices, month, year, businessName }) => {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0)

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
    }

    const formatCurrency = (amount: number) => {
        return `₪${amount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    return (
        <Document>
            {/* Summary Page */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>ריכוז חשבוניות חודשי</Text>
                <Text style={styles.subtitle}>{businessName} - {month}/{year}</Text>

                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCell, styles.tableCellHeader]}>תאריך</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader]}>אסמכתא</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader]}>לקוח</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader]}>נטו</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader]}>מע"מ</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader]}>סה"כ</Text>
                    </View>
                    {invoices.map((inv, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={styles.tableCell}>{formatDate(inv.issueDate)}</Text>
                            <Text style={styles.tableCell}>
                                {inv.invoiceNumber}
                                {inv.allocationNumber ? ` / ${inv.allocationNumber}` : ''}
                            </Text>
                            <Text style={styles.tableCell}>{inv.clientName}</Text>
                            <Text style={styles.tableCell}>{formatCurrency(inv.subtotal)}</Text>
                            <Text style={styles.tableCell}>{formatCurrency(inv.vatAmount)}</Text>
                            <Text style={styles.tableCell}>{formatCurrency(inv.total)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.totalSection}>
                    <Text style={styles.totalText}>:סה"כ לתקופה</Text>
                    <Text style={styles.totalText}>{formatCurrency(totalAmount)}</Text>
                </View>

                <View style={{ marginTop: 40, textAlign: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#9ca3af' }}>מספר חשבוניות בדוח: {invoices.length}</Text>
                </View>
            </Page>

            {/* Individual Invoice Pages */}
            {invoices.map((inv, idx) => (
                <InvoicePage key={`inv-${idx}`} data={inv} />
            ))}
        </Document>
    )
}
