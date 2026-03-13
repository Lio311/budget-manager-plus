import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer'
import { format } from 'date-fns'

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Alef',
        direction: 'rtl',
    },
    header: {
        marginBottom: 20,
        borderBottom: 1,
        paddingBottom: 10,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#e2445c',
    },
    businessInfo: {
        fontSize: 12,
        color: '#666',
        textAlign: 'left',
    },
    table: {
        width: '100%',
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row-reverse',
        backgroundColor: '#f9fafb',
        borderBottom: 1,
        borderBottomColor: '#eee',
        padding: 8,
    },
    tableRow: {
        flexDirection: 'row-reverse',
        borderBottom: 1,
        borderBottomColor: '#eee',
        padding: 8,
        minHeight: 30,
        alignItems: 'center',
    },
    colDate: { width: '15%', fontSize: 10, textAlign: 'right' },
    colDesc: { width: '40%', fontSize: 10, textAlign: 'right' },
    colCat: { width: '20%', fontSize: 10, textAlign: 'right' },
    colAmount: { width: '25%', fontSize: 10, textAlign: 'left', fontWeight: 'bold' },
    summary: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#fef2f2',
        borderRadius: 4,
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
    },
    attachmentPage: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    attachmentTitle: {
        fontSize: 14,
        marginBottom: 10,
        color: '#666',
    },
    attachmentImage: {
        maxWidth: '100%',
        maxHeight: '90%',
    }
})

interface ExpenseReportProps {
    expenses: any[]
    month: string
    year: string
    businessName: string
    totalAmount: number
}

export const ExpenseReportTemplate = ({ expenses, month, year, businessName, totalAmount }: ExpenseReportProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>דוח הוצאות חודשי</Text>
                <View>
                    <Text style={styles.businessInfo}>{businessName}</Text>
                    <Text style={styles.businessInfo}>{month}/{year}</Text>
                </View>
            </View>

            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.colDate}>תאריך</Text>
                    <Text style={styles.colDesc}>תיאור</Text>
                    <Text style={styles.colCat}>קטגוריה</Text>
                    <Text style={styles.colAmount}>סכום</Text>
                </View>

                {expenses.map((exp, i) => (
                    <View key={i} style={styles.tableRow}>
                        <Text style={styles.colDate}>{exp.date ? format(new Date(exp.date), 'dd/MM/yy') : '-'}</Text>
                        <Text style={styles.colDesc}>{exp.description}</Text>
                        <Text style={styles.colCat}>{exp.category}</Text>
                        <Text style={styles.colAmount}>₪ {exp.amount.toLocaleString()}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.summary}>
                <Text style={{ fontSize: 14, fontWeight: 'bold' }}>:סה"כ הוצאות</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#e2445c' }}>₪ {totalAmount.toLocaleString()}</Text>
            </View>
        </Page>

        {/* Append pages for attachments */}
        {expenses.filter(exp => exp.attachmentUrl && exp.attachmentUrl.startsWith('data:image/')).map((exp, i) => (
            <Page key={`att-${i}`} size="A4" style={styles.attachmentPage}>
                <Text style={styles.attachmentTitle}>
                    נספח: {exp.description} ({exp.date ? format(new Date(exp.date), 'dd/MM/yyyy') : ''})
                </Text>
                <Image src={exp.attachmentUrl} style={styles.attachmentImage} />
            </Page>
        ))}
    </Document>
)
