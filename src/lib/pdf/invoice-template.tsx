import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'

// Define styles with green/black/white theme
const styles = StyleSheet.create({
    page: {
        padding: 30, // Reduced from 40
        backgroundColor: '#ffffff',
        fontFamily: 'Alef',
    },
    header: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20, // Reduced from 30
        paddingBottom: 15, // Reduced from 20
        borderBottom: '3px solid #10b981'
    },
    logo: {
        width: 60, // Reduced from 80
        height: 60, // Reduced from 80
        objectFit: 'contain'
    },
    invoiceTitle: {
        fontSize: 24, // Reduced from 28
        fontWeight: 'normal',
        color: '#10b981',
    },
    invoiceNumber: {
        fontSize: 12, // Reduced from 14
        color: '#6b7280',
        marginTop: 3 // Reduced from 5
    },
    companyInfo: {
        alignItems: 'flex-end',
        textAlign: 'right',
        marginBottom: 15 // Reduced from 20
    },
    companyName: {
        fontSize: 16, // Reduced from 18
        fontWeight: 'normal',
        color: '#1f2937',
        marginBottom: 3 // Reduced from 5
    },
    companyDetails: {
        fontSize: 9, // Reduced from 10
        color: '#6b7280',
        lineHeight: 1.4 // Reduced from 1.5
    },
    companyInfoRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'flex-start', // Align to right (items start from right in row-reverse? No, start is right in row-reverse. justify-start packs them to the start (Right). No wait. row-reverse starts at right. justify-start packs to right. Yes.
        alignItems: 'center',
        marginBottom: 1
    },
    companyInfoLabel: {
        fontSize: 9,
        color: '#6b7280',
        marginLeft: 4 // Space between label and value (since label is on right, value on left. marginLeft on label pushes it... wait. Label is Item 1 (Right). Value is Item 2 (Left). MarginLeft on Label pushes away from... Left neighbor? No left neighbor for Item 1. MarginLeft pushes... ) 
        // Better: MarginRight on Value? Or MarginLeft on Label if it affects gap?
        // Let's use gap if supported or margin on the label.
        // In row-reverse: Item 1 (Right), Item 2 (Left).
        // If I put marginLeft on Item 1, it pushes away from Item 2? No.
        // Let's just put padding on one.
    },
    companyInfoValue: {
        fontSize: 9,
        color: '#6b7280',
        marginRight: 4
    },
    section: {
        marginBottom: 15, // Reduced from 20
        padding: 10, // Reduced from 15
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderRight: '4px solid #10b981'
    },
    sectionTitle: {
        fontSize: 11, // Reduced from 12
        fontWeight: 'normal',
        color: '#1f2937',
        marginBottom: 5, // Reduced from 10
        textAlign: 'right'
    },
    row: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        marginBottom: 3 // Reduced from 5
    },
    label: {
        fontSize: 9, // Reduced from 10
        color: '#6b7280',
        textAlign: 'right'
    },
    value: {
        fontSize: 9, // Reduced from 10
        color: '#1f2937',
        fontWeight: 'normal',
        textAlign: 'right'
    },
    divider: {
        borderBottom: '1px solid #e5e7eb',
        marginVertical: 10 // Reduced from 15
    },
    totalsSection: {
        marginTop: 15, // Reduced from 20
        padding: 15, // Reduced from 20
        backgroundColor: '#10b981',
        borderRadius: 8
    },
    totalRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5 // Reduced from 8
    },
    totalLabel: {
        fontSize: 11, // Reduced from 12
        color: '#ffffff',
    },
    totalValue: {
        fontSize: 11, // Reduced from 12
        color: '#ffffff',
        fontWeight: 'normal',
    },
    grandTotalRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        marginTop: 8, // Reduced from 10
        paddingTop: 8, // Reduced from 10
        borderTop: '2px solid #ffffff'
    },
    grandTotalLabel: {
        fontSize: 16, // Reduced from 18
        color: '#ffffff',
        fontWeight: 'normal',
    },
    grandTotalValue: {
        fontSize: 16, // Reduced from 18
        color: '#ffffff',
        fontWeight: 'normal',
    },
    footer: {
        position: 'absolute',
        bottom: 20, // Reduced from 30
        left: 30, // Reduced from 40
        right: 30, // Reduced from 40
        textAlign: 'center',
        paddingTop: 10, // Reduced from 20
        borderTop: '1px solid #e5e7eb'
    },
    footerText: {
        fontSize: 8, // Reduced from 9
        color: '#9ca3af',
        marginBottom: 3 // Reduced from 5
    },
    poweredBy: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5 // Reduced from 10
    },
    poweredByText: {
        fontSize: 7, // Reduced from 8
        color: '#6b7280',
        marginLeft: 5
    },
    poweredByLogo: {
        width: 50, // Reduced from 60
        height: 15, // Reduced from 20
        objectFit: 'contain'
    }
})

interface InvoiceData {
    invoiceNumber: string
    issueDate: string
    dueDate: string
    status: string
    paymentMethod?: string
    title?: string
    documentNumberLabel?: string

    // Business info
    businessName: string
    businessId?: string
    businessAddress?: string
    businessPhone?: string
    businessEmail?: string
    businessLogo?: string
    businessSignature?: string

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

    // System
    poweredByLogoPath?: string
}

export const InvoiceTemplate: React.FC<{ data: InvoiceData }> = ({ data }) => {
    const formatCurrency = (amount: number) => {
        return `${data.currency === 'ILS' ? '₪' : data.currency}${amount.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        return `${day}/${month}/${year}`
    }

    // New Logic: Render words individually in row-reverse to ensure visual RTL order
    // CRITICAL FIX: English/Number sequences must be GROUPED together to preserve LTR order within the block.
    // Hebrew words must be SEPARATED to flow RTL via flexbox.
    const renderNotes = (text: string | undefined) => {
        if (!text) return null

        // Split by newlines first to preserve paragraphs
        const lines = text.split('\n')

        return (
            <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                {lines.map((line, i) => {
                    const words = line.split(' ')
                    const chunks: string[] = []
                    let currentLtrBuffer: string[] = []

                    words.forEach(word => {
                        // Check if word contains Hebrew characters
                        const isHebrew = /[\u0590-\u05FF]/.test(word)

                        if (isHebrew) {
                            // Flush buffer if exists
                            if (currentLtrBuffer.length > 0) {
                                chunks.push(currentLtrBuffer.join(' '))
                                currentLtrBuffer = []
                            }
                            // Push Hebrew word individually
                            chunks.push(word)
                        } else {
                            // Add regular symbols/numbers/english to buffer
                            currentLtrBuffer.push(word)
                        }
                    })
                    // Final flush
                    if (currentLtrBuffer.length > 0) {
                        chunks.push(currentLtrBuffer.join(' '))
                    }

                    return (
                        <View key={i} style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                            {chunks.map((chunk, j) => (
                                <Text key={j} style={{ fontSize: 9, color: '#374151', marginLeft: 3 }}>
                                    {chunk}
                                </Text>
                            ))}
                        </View>
                    )
                })}
            </View>
        )
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.invoiceTitle}>{data.title || 'חשבונית'}</Text>
                        <Text style={styles.invoiceNumber}>{data.invoiceNumber} :{data.documentNumberLabel || 'מספר חשבונית'}</Text>
                    </View>
                    {data.businessLogo && (
                        <Image src={data.businessLogo} style={styles.logo} />
                    )}
                </View>

                {/* Company Info */}
                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{data.businessName}</Text>

                    {/* Rows for details to ensure correct RTL layout */}
                    {data.businessId && (
                        <View style={styles.companyInfoRow}>
                            <Text style={styles.companyInfoLabel}>:ע.מ</Text>
                            <Text style={styles.companyInfoValue}>{data.businessId}</Text>
                        </View>
                    )}
                    {data.businessAddress && (
                        <View style={styles.companyInfoRow}>
                            <Text style={styles.companyInfoValue}>{data.businessAddress}</Text>
                            {/* Address usually doesn't have a label in the original single-block text, but let's leave it as just text if no label needed, or format as row if we want consistency. Original was just address line. */}
                        </View>
                    )}
                    {/* Actually original was: businessAddress\n */}
                    {/* If address is pure text, better to stick to Text block? Or Row?
                         If address has mixed English/Hebrew, Row is safer?
                         Original: Just `${data.businessAddress}\n`
                         Let's keep Address simple, or just put it in a View.
                         Wait, if I split into rows, I lose the single-block "Text" container wrapping.
                         I should just render a Text for address.
                      */}
                    {data.businessAddress && (
                        <View style={{ flexDirection: 'row-reverse', justifyContent: 'flex-start', marginBottom: 1 }}>
                            <Text style={{ fontSize: 9, color: '#6b7280' }}>{data.businessAddress}</Text>
                        </View>
                    )}

                    {data.businessPhone && (
                        <View style={styles.companyInfoRow}>
                            <Text style={styles.companyInfoLabel}>:טלפון</Text>
                            <Text style={styles.companyInfoValue}>{data.businessPhone}</Text>
                        </View>
                    )}

                    {data.businessEmail && (
                        <View style={styles.companyInfoRow}>
                            <Text style={styles.companyInfoLabel}>:אימייל</Text>
                            <Text style={styles.companyInfoValue}>{data.businessEmail}</Text>
                        </View>
                    )}
                </View>

                {/* Client Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>פרטי לקוח</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>:שם</Text>
                        <Text style={styles.value}>{data.clientName}</Text>
                    </View>
                    {data.clientId && (
                        <View style={styles.row}>
                            <Text style={styles.label}>:ח.פ / ע.מ</Text>
                            <Text style={styles.value}>{data.clientId}</Text>
                        </View>
                    )}
                </View>

                {/* Invoice Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>פרטי חשבונית</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>:תאריך הנפקה</Text>
                        <Text style={styles.value}>{formatDate(data.issueDate)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>:תאריך תשלום</Text>
                        <Text style={styles.value}>{formatDate(data.dueDate)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>:אמצעי תשלום</Text>
                        <Text style={styles.value}>{data.paymentMethod}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>:סטטוס</Text>
                        <Text style={styles.value}>{data.status}</Text>
                    </View>
                </View>

                {/* Totals */}
                <View style={styles.totalsSection} wrap={false}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>:סכום לפני מע״מ</Text>
                        <Text style={styles.totalValue}>{formatCurrency(data.subtotal)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>:({data.vatRate}%) מע״מ</Text>
                        <Text style={styles.totalValue}>{formatCurrency(data.vatAmount)}</Text>
                    </View>
                    <View style={styles.grandTotalRow}>
                        <Text style={styles.grandTotalLabel}>:סה״כ לתשלום</Text>
                        <Text style={styles.grandTotalValue}>{formatCurrency(data.total)}</Text>
                    </View>
                </View>

                {/* Notes - Moved immediately below totals */}
                {data.notes && (
                    <View style={{ marginTop: 5, padding: 5, backgroundColor: '#f3f4f6', borderRadius: 4 }} wrap={false}>
                        <Text style={{ fontSize: 9, color: '#6b7280', textAlign: 'right', marginBottom: 2 }}>:הערות</Text>
                        {renderNotes(data.notes)}
                    </View>
                )}

                <View style={{ flex: 1 }} />

                {/* Footer */}
                <View style={styles.footer} wrap={false}>
                    {data.businessSignature && (
                        <View style={{ alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 8, color: '#6b7280', marginBottom: 5 }}>חתימה</Text>
                            <Image src={data.businessSignature} style={{ width: 120, height: 40, objectFit: 'contain' }} />
                        </View>
                    )}
                    <Text style={styles.footerText}>
                        !תודה על העסקה
                    </Text>
                    <View style={styles.poweredBy}>
                        {data.poweredByLogoPath && (
                            <Image src={data.poweredByLogoPath} style={styles.poweredByLogo} />
                        )}
                        <Text style={styles.poweredByText}>הופק על ידי</Text>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
