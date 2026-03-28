import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
    page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Alef' },
    title: { fontSize: 24, marginBottom: 10, textAlign: 'center', fontWeight: 'bold' },
    subtitle: { fontSize: 14, marginBottom: 5, textAlign: 'center', color: '#6b7280' },
    table: {
        display: 'flex', width: 'auto', borderStyle: 'solid', borderWidth: 1,
        borderColor: '#e5e7eb', borderBottomWidth: 0, marginTop: 20
    },
    tableRow: {
        flexDirection: 'row-reverse', borderBottomWidth: 1, borderColor: '#e5e7eb',
        minHeight: 30, alignItems: 'center'
    },
    tableHeader: { backgroundColor: '#f9fafb' },
    tableCell: { padding: 5, fontSize: 12, textAlign: 'center', flex: 1 },
    tableCellHeader: { fontWeight: 'bold', color: '#374151' },
})

export interface SummaryReportData {
    companyName: string
    companyId: string
    startDate: string
    endDate: string
    rows: {
        docTypeCode: string
        docTypeName: string
        quantity: number
        totalAmount: number
    }[]
}

export const SummaryReportTemplate: React.FC<SummaryReportData> = ({ companyName, companyId, startDate, endDate, rows }) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>דוח מרכז לביקורת - ממשק פתוח</Text>
                <Text style={styles.subtitle}>{companyName} (ח.פ / ע.מ: {companyId})</Text>
                <Text style={styles.subtitle}>תקופה: {startDate} - {endDate}</Text>

                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={[styles.tableCell, styles.tableCellHeader]}>קוד מסמך</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader]}>שם מסמך</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader]}>כמות שהופקה</Text>
                        <Text style={[styles.tableCell, styles.tableCellHeader]}>סה"כ סכום</Text>
                    </View>
                    {rows.map((row, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={styles.tableCell}>{row.docTypeCode}</Text>
                            <Text style={styles.tableCell}>{row.docTypeName}</Text>
                            <Text style={styles.tableCell}>{row.quantity}</Text>
                            <Text style={styles.tableCell}>{row.totalAmount.toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ marginTop: 40, textAlign: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#9ca3af' }}>הופק על ידי מערכת BudgetManagerPlus בהתאם להוראות הביקורת של רשות המסים (מבנה אחיד 1.31)</Text>
                </View>
            </Page>
        </Document>
    )
}
