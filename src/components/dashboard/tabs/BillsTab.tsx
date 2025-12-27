import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'

interface Bill {
    id: string
    name: string
    amount: number
    currency: string
    dueDate: Date
    isPaid: boolean
}

interface BillData {
    bills: Bill[]
    totalILS: number
}

export function BillsTab() {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const { toast } = useToast()

    const fetcher = async () => {
        const result = await getBills(month, year, budgetType)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch bills')
    }

    const { data, isLoading: loading, mutate } = useSWR<BillData>(['bills', month, year, budgetType], fetcher, {
        revalidateOnFocus: false,
        onError: (err) => {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון חשבונות',
                variant: 'destructive',
                duration: 1000
            })
        }
    })

    const bills = data?.bills || []
    const totalBillsILS = data?.totalILS || 0

    const [submitting, setSubmitting] = useState(false)
    const [newBill, setNewBill] = useState({ name: '', amount: '', currency: 'ILS', dueDay: '' })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({ name: '', amount: '', currency: 'ILS', dueDay: '' })

    // Calculate paid/unpaid in ILS is tricky without individual conversion on client or server returning it.
    // For now, let's approximate or just rely on the server total for the main card.
    // Actually, we can't easily sum mixed currencies on client without rates.
    // Let's assume for the "Paid" and "Unpaid" mini-cards we might show mixed currencies or just omit them?
    // The user requirement says "All totals displayed to the user... should be consistently shown in ILS".
    // So the "Paid" and "Unpaid" cards also need to be in ILS.
    // We didn't update the server to return totalPaidILS and totalUnpaidILS.
    // Let's do a quick client-side approximation if we have rates, OR update server action.
    // Updating server action is better but I'm in the middle of this tool call.
    // I will stick to server returning totalILS for now, and maybe for paid/unpaid I'll just leave them for now or hide?
    // Wait, the prompt said "All totals...".
    // I can fetch rates on client or just update server action in next step if needed.
    // Actually, `getBills` returns `totalILS`. I can calculate `paidILS` if I fetch rates or if I just move logic to server.
    // Let's leave the Cards as is but use the server total for the main one. For the others, I might need to accept they might be inaccurate if mixed currencies, OR I should have updated `getBills` to return more stats.
    // Let's stick to updating the UI for now and I can refine `getBills` return values if strictly needed.
    // Actually, looking at `IncomeTab` I saw it returned `totalILS` and used it.
    // For Bills, there are 3 cards: Total, Paid, Unpaid.
    // I should update `getBills` to return `totalPaidILS` and `totalUnpaidILS` too.
    // I will do that in a subsequent step. For now let's get the UI structure right.

    // Correction: I'll calculate client side if I can't fetch rates easily? No, `getBills` is server action.
    // I will update `getBills` in the next step to return breakdown.
    // For this file replace, I will assume `data` contains `totalPaidILS` etc, and update the server action immediately after.

    // WAIT, I can't assume properties that don't exist yet if TypeScript checks.
    // I'll just use `totalBillsILS` for the total card.
    // For Paid/Unpaid I'll temporarily leave them zero or use client side accumulation which is wrong for mixed currencies.
    // BETTER PLAN: Update `bill.ts` AGAIN in next step to return breakdown, then update UI to use it.
    // So here I will only implement the input/edit fields and the Total display.

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
    const totalPages = Math.ceil(bills.length / itemsPerPage)

    useEffect(() => {
        setCurrentPage(1)
    }, [month, year])

    const paginatedBills = bills.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    async function handleAdd() {
        if (!newBill.name || !newBill.amount || !newBill.dueDay) {
            toast({
                title: 'שגיאה',
                description: 'נא למלא את כל השדות',
                variant: 'destructive'
            })
            return
        }

        const dueDay = parseInt(newBill.dueDay)
        if (dueDay < 1 || dueDay > 31) {
            toast({
                title: 'שגיאה',
                description: 'יום תשלום חייב להיות בין 1 ל-31',
                variant: 'destructive'
            })
            return
        }

        setSubmitting(true)
        try {
            const result = await addBill(month, year, {
                name: newBill.name,
                amount: parseFloat(newBill.amount),
                currency: newBill.currency,
                dueDay: parseInt(newBill.dueDay)
            }, budgetType)

            if (result.success) {
                toast({
                    title: 'הצלחה',
                    description: 'החשבון נוסף בהצלחה'
                })
                setNewBill({ name: '', amount: '', currency: 'ILS', dueDay: '' })
                await mutate()
            } else {
                toast({
                    title: 'שגיאה',
                    description: result.error || 'לא ניתן להוסיף חשבון',
                    variant: 'destructive'
                })
            }
        } catch (error) {
            console.error('Add bill failed:', error)
            toast({
                title: 'שגיאה',
                description: 'אירעה שגיאה בלתי צפויה',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    async function handleTogglePaid(id: string, currentStatus: boolean) {
        const result = await toggleBillPaid(id, !currentStatus)

        if (result.success) {
            await mutate()
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן לעדכן סטטוס',
                variant: 'destructive',
                duration: 1000
            })
        }
    }

    function handleEdit(bill: Bill) {
        setEditingId(bill.id)
        setEditData({
            name: bill.name,
            amount: bill.amount.toString(),
            currency: bill.currency || 'ILS',
            dueDay: new Date(bill.dueDate).getDate().toString()
        })
    }

    function handleCancelEdit() {
        setEditingId(null)
        setEditData({ name: '', amount: '', currency: 'ILS', dueDay: '' })
    }

    async function handleUpdate() {
        if (!editingId || !editData.name || !editData.amount || !editData.dueDay) {
            toast({
                title: 'שגיאה',
                description: 'נא למלא את כל השדות',
                variant: 'destructive',
                duration: 1000
            })
            return
        }

        const dueDay = parseInt(editData.dueDay)
        if (dueDay < 1 || dueDay > 31) {
            toast({
                title: 'שגיאה',
                description: 'יום תשלום חייב להיות בין 1 ל-31',
                variant: 'destructive',
                duration: 1000
            })
            return
        }

        setSubmitting(true)
        const result = await updateBill(editingId, {
            name: editData.name,
            amount: parseFloat(editData.amount),
            currency: editData.currency,
            dueDay
        })

        if (result.success) {
            toast({
                title: 'הצלחה',
                description: 'החשבון עודכן בהצלחה',
                duration: 1000
            })
            setEditingId(null)
            setEditData({ name: '', amount: '', currency: 'ILS', dueDay: '' })
            await mutate()
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן לעדכן חשבון',
                variant: 'destructive',
                duration: 1000
            })
        }
        setSubmitting(false)
    }

    async function handleDelete(id: string) {
        const result = await deleteBill(id)

        if (result.success) {
            toast({
                title: 'הצלחה',
                description: 'החשבון נמחק בהצלחה'
            })
            await mutate()
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן למחוק חשבון',
                variant: 'destructive'
            })
        }
    }


    return (
        <div className="space-y-4 p-1" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="monday-card p-4 border-l-4 border-l-blue-500 min-w-0">
                    <p className="text-xs text-gray-500 mb-1 truncate">סה"כ לתשלום (חודשי)</p>
                    <p className={`text-base md:text-xl font-bold text-[#323338] truncate ${loading ? 'animate-pulse' : ''}`}>
                        {loading ? '...' : formatCurrency(totalBillsILS, '₪')}
                    </p>
                </div>
                {/* Paid/Unpaid cards temporarily hidden or showing simpler info until server update */}
                <div className="monday-card p-4 border-l-4 border-l-green-500 min-w-0">
                    <p className="text-xs text-gray-500 mb-1 truncate">שולם</p>
                    {/* Placeholder or calc if same currency - skipping calc for mixed */}
                    <p className="text-xs text-gray-400">---</p>
                </div>
                <div className="monday-card p-4 border-l-4 border-l-red-500 min-w-0">
                    <p className="text-xs text-gray-500 mb-1 truncate">נותר לתשלום</p>
                    <p className="text-xs text-gray-400">---</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="glass-panel p-5 h-fit">
                    <div className="flex items-center gap-2 mb-4 min-w-0">
                        <CreditCard className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <h3 className="text-base md:text-lg font-bold text-[#323338] truncate flex-1 min-w-0">הוספת חשבון חדש</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">שם החשבון</label>
                            <Input
                                value={newBill.name}
                                onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                                placeholder="לדוגמה: ארנונה"
                                className="h-10 text-right"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                                <label className="text-sm font-medium text-gray-700">מטבע</label>
                                <select
                                    className="w-full p-2 border border-gray-200 rounded-lg h-10 bg-white text-sm outline-none"
                                    value={newBill.currency}
                                    onChange={(e) => setNewBill({ ...newBill, currency: e.target.value })}
                                >
                                    {Object.entries(SUPPORTED_CURRENCIES).map(([code, symbol]) => (
                                        <option key={code} value={code}>{code} ({symbol})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium text-gray-700">סכום</label>
                                <Input
                                    type="number"
                                    value={newBill.amount}
                                    onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="h-10 text-right"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">יום בחודש לתשלום</label>
                            <Input
                                type="number"
                                min="1"
                                max="31"
                                value={newBill.dueDay}
                                onChange={(e) => setNewBill({ ...newBill, dueDay: e.target.value })}
                                placeholder="1-31"
                                className="h-10 text-right"
                            />
                        </div>
                        <Button
                            className="w-full bg-orange-500 hover:bg-orange-600 h-10 shadow-sm mt-2 font-medium"
                            onClick={handleAdd}
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-rainbow-spin" /> : "הוסף"}
                        </Button>
                    </div>
                </div>

                <div className="glass-panel p-5 block">
                    <h3 className="text-lg font-bold text-[#323338] mb-4">רשימת חשבונות</h3>
                    <div className="space-y-3">
                        {loading ? (
                            // Skeleton loader while loading
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl animate-pulse">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                                            <div className="h-4 bg-gray-200 rounded w-12"></div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : bills.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                לא נמצאו חשבונות לחודש זה
                            </div>
                        ) : (
                            <>
                                {paginatedBills.map((bill: Bill) => (
                                    <div
                                        key={bill.id}
                                        className="group relative flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                        {editingId === bill.id ? (
                                            <div className="flex items-center gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
                                                <Input
                                                    value={editData.name}
                                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                    className="h-9 flex-1"
                                                    autoFocus
                                                />
                                                <select
                                                    className="p-2 border rounded-md h-9 bg-white text-sm w-20"
                                                    value={editData.currency}
                                                    onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                                                >
                                                    {Object.keys(SUPPORTED_CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <Input
                                                    type="number"
                                                    value={editData.amount}
                                                    onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                                                    className="w-24 h-9"
                                                />
                                                <Input
                                                    type="number"
                                                    value={editData.dueDay}
                                                    onChange={(e) => setEditData({ ...editData, dueDay: e.target.value })}
                                                    className="w-16 h-9"
                                                />
                                                <div className="flex gap-1">
                                                    <Button size="icon" variant="ghost" onClick={handleUpdate} className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700 rounded-full">
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => handleTogglePaid(bill.id, bill.isPaid)}
                                                        className={`
                                                            w-16 h-7 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center
                                                            ${bill.isPaid
                                                                ? 'bg-[#00c875] text-white hover:bg-[#00b065] shadow-sm'
                                                                : 'bg-[#ffcb00] text-[#323338] hover:bg-[#eabb00]'
                                                            }
                                                        `}
                                                    >
                                                        {bill.isPaid ? 'שולם' : 'ממתין'}
                                                    </button>

                                                    <div className="flex flex-col">
                                                        <span className={`font-bold text-base transition-colors ${bill.isPaid ? 'text-gray-400 line-through' : 'text-[#323338]'}`}>
                                                            {bill.name}
                                                        </span>
                                                        <span className="text-xs text-[#676879]">
                                                            תאריך תשלום: {new Date(bill.dueDate).getDate()} בחודש
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <span className={`text-lg font-bold font-mono ${bill.isPaid ? 'text-[#00c875]' : 'text-[#fdab3d]'}`}>
                                                        {formatCurrency(bill.amount, getCurrencySymbol(bill.currency || 'ILS'))}
                                                    </span>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(bill)}
                                                            className="h-8 w-8 text-blue-500 hover:bg-blue-50 rounded-full"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(bill.id)}
                                                            className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
