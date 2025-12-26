'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Trash2, Edit2 } from 'lucide-react'
import { createCoupon, deleteCoupon, deleteUser, updateSubscription, updateCoupon } from '@/lib/actions/admin'
import { CountdownTimer } from '@/components/admin/CountdownTimer'

interface AdminDashboardProps {
    initialData: {
        users: any[]
        coupons: any[]
        feedbacks: any[]
        totalRevenue: number
    }
}

export function AdminDashboard({ initialData }: AdminDashboardProps) {
    const { users, coupons, feedbacks, totalRevenue } = initialData
    const [editingId, setEditingId] = useState<string | null>(null)
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountPercent: 0,
        expiryDate: '',
        specificEmail: '',
        planType: 'PERSONAL'
    })

    // New State for Editing User Subscriptions
    const [editingUser, setEditingUser] = useState<any>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const handleCreateOrUpdateCoupon = async () => {
        if (editingId) {
            await updateCoupon(editingId, {
                code: newCoupon.code,
                discountPercent: Number(newCoupon.discountPercent),
                expiryDate: newCoupon.expiryDate ? new Date(newCoupon.expiryDate) : undefined,
                specificEmail: newCoupon.specificEmail || undefined,
                planType: (newCoupon.planType as 'PERSONAL' | 'BUSINESS') || undefined
            })
            setEditingId(null)
        } else {
            await createCoupon({
                code: newCoupon.code,
                discountPercent: Number(newCoupon.discountPercent),
                expiryDate: newCoupon.expiryDate ? new Date(newCoupon.expiryDate) : undefined,
                specificEmail: newCoupon.specificEmail || undefined,
                planType: (newCoupon.planType as 'PERSONAL' | 'BUSINESS') || undefined
            })
        }
        setNewCoupon({ code: '', discountPercent: 0, expiryDate: '', specificEmail: '', planType: 'PERSONAL' })
    }

    const startEdit = (coupon: any) => {
        setEditingId(coupon.id)
        setNewCoupon({
            code: coupon.code,
            discountPercent: coupon.discountPercent,
            expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 16) : '',
            specificEmail: coupon.specificEmail || '',
            planType: coupon.planType || ''
        })
    }

    const handleUpdateSubscription = async (subId: string, data: any) => {
        const result = await updateSubscription(subId, data)
        if (!result.success) {
            alert(result.error)
        }
    }

    return (
        <div className="space-y-8">
            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" dir="ltr">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Edit Subscriptions for {editingUser?.email}</DialogTitle>
                        <p className="text-sm text-muted-foreground">Manage user subscription plans, status, and expiration dates</p>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        {editingUser?.subscriptions?.length > 0 ? (
                            editingUser.subscriptions.map((sub: any) => (
                                <div key={sub.id} className="border-2 rounded-lg p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md transition-shadow">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1.5 rounded-md text-sm font-bold uppercase tracking-wide ${sub.planType === 'BUSINESS'
                                                ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                                                : 'bg-orange-100 text-orange-800 border-2 border-orange-300'
                                                }`}>
                                                {sub.planType}
                                            </span>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${sub.status === 'active' ? 'bg-green-100 text-green-800' :
                                                sub.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                                                    sub.status === 'expired' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {sub.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400 font-mono">ID: {sub.id.slice(-8)}</span>
                                    </div>

                                    {/* Subscription Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                        {/* Status */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                                                defaultValue={sub.status}
                                                onChange={(e) => handleUpdateSubscription(sub.id, { status: e.target.value })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="trial">Trial</option>
                                                <option value="expired">Expired</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>

                                        {/* Plan Type */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Plan Type</Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-medium"
                                                defaultValue={sub.planType}
                                                onChange={(e) => handleUpdateSubscription(sub.id, { planType: e.target.value as 'PERSONAL' | 'BUSINESS' })}
                                            >
                                                <option value="PERSONAL">Personal</option>
                                                <option value="BUSINESS">Business</option>
                                            </select>
                                        </div>

                                        {/* Start Date */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Start Date</Label>
                                            <Input
                                                type="date"
                                                className="font-medium"
                                                defaultValue={sub.startDate ? new Date(sub.startDate).toISOString().split('T')[0] : ''}
                                                onChange={(e) => {
                                                    const date = e.target.value ? new Date(e.target.value) : undefined
                                                    if (date) handleUpdateSubscription(sub.id, { startDate: date })
                                                }}
                                            />
                                        </div>

                                        {/* Expiry Date */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Expiry Date</Label>
                                            <Input
                                                type="date"
                                                className="font-medium"
                                                defaultValue={sub.endDate ? new Date(sub.endDate).toISOString().split('T')[0] : ''}
                                                onChange={(e) => {
                                                    const date = e.target.value ? new Date(e.target.value) : undefined
                                                    if (date) handleUpdateSubscription(sub.id, { endDate: date })
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Payment Info */}
                                    {(sub.lastPaymentDate || sub.lastPaymentAmount) && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-3">
                                            <p className="text-xs font-semibold text-blue-900 mb-1">Last Payment</p>
                                            <div className="flex gap-4 text-xs text-blue-800">
                                                {sub.lastPaymentAmount && (
                                                    <span className="font-medium">Amount: ₪{sub.lastPaymentAmount}</span>
                                                )}
                                                {sub.lastPaymentDate && (
                                                    <span>Date: {new Date(sub.lastPaymentDate).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-sm">No subscriptions found for this user.</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* TODO: Re-implement Maintenance Mode with Edge-compatible solution */}

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-center">₪{totalRevenue}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-center">{users.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-center">
                            {users.filter(u => u.subscription?.status === 'active').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Feedbacks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-center">{feedbacks.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="users">Users Management</TabsTrigger>
                    <TabsTrigger value="coupons">Coupons</TabsTrigger>
                    <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center">Email</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Plan</TableHead>
                                        <TableHead className="text-center">Start Date</TableHead>
                                        <TableHead className="text-center">Renewal/Expiry</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="text-center">{user.email}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    {user.subscriptions && user.subscriptions.length > 0 ? (
                                                        user.subscriptions
                                                            .filter((sub: any) => sub.status === 'active' || sub.status === 'trial')
                                                            .map((sub: any) => (
                                                                <span key={sub.id} className={`px-2 py-1 rounded-full text-xs ${sub.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                    sub.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {sub.status === 'active' ? 'Active' :
                                                                        sub.status === 'trial' ? 'Trial' :
                                                                            sub.status || 'None'}
                                                                </span>
                                                            ))
                                                    ) : (
                                                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                                                            {user.subscription?.status || 'None'}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-wrap justify-center gap-1">
                                                    {user.subscriptions && user.subscriptions.length > 0 ? (
                                                        user.subscriptions
                                                            .filter((sub: any) => sub.status === 'active' || sub.status === 'trial')
                                                            .map((sub: any) => (
                                                                <span key={sub.id} className={`px-2 py-0.5 rounded text-[10px] font-medium border ${sub.planType === 'BUSINESS'
                                                                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                                                                    : 'bg-orange-100 text-orange-800 border-orange-200'
                                                                    }`}>
                                                                    {sub.planType}
                                                                </span>
                                                            ))
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">-</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {user.subscription?.startDate ? format(new Date(user.subscription.startDate), 'dd/MM/yyyy') : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {user.subscription?.endDate ? format(new Date(user.subscription.endDate), 'dd/MM/yyyy') : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex gap-2 justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingUser(user)
                                                            setIsEditDialogOpen(true)
                                                        }}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this user?')) deleteUser(user.id)
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="coupons" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{editingId ? 'Edit Coupon' : 'Create Coupon'}</CardTitle>
                            {editingId && (
                                <Button variant="outline" size="sm" onClick={() => {
                                    setEditingId(null)
                                    setNewCoupon({ code: '', discountPercent: 0, expiryDate: '', specificEmail: '', planType: 'PERSONAL' })
                                }}>Cancel Edit</Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-6 items-end text-left" dir="ltr">
                                <div className="space-y-2">
                                    <Label className="text-left block">Code</Label>
                                    <Input
                                        className="text-left"
                                        value={newCoupon.code}
                                        onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-left block">Discount %</Label>
                                    <Input
                                        className="text-left"
                                        type="number"
                                        value={newCoupon.discountPercent}
                                        onChange={e => setNewCoupon({ ...newCoupon, discountPercent: Number(e.target.value) })}
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-left block">Expiry Date</Label>
                                    <Input
                                        className="text-left"
                                        type="datetime-local"
                                        value={newCoupon.expiryDate}
                                        onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-left block">Specific Email</Label>
                                    <Input
                                        className="text-left"
                                        type="email"
                                        value={newCoupon.specificEmail}
                                        onChange={e => setNewCoupon({ ...newCoupon, specificEmail: e.target.value })}
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-left block">Plan Type</Label>
                                    <select
                                        className="w-full border rounded-md p-2 h-10"
                                        value={newCoupon.planType}
                                        onChange={e => setNewCoupon({ ...newCoupon, planType: e.target.value })}
                                    >
                                        <option value="PERSONAL">Personal</option>
                                        <option value="BUSINESS">Business</option>
                                        <option value="">Any</option>
                                    </select>
                                </div>
                                <Button onClick={handleCreateOrUpdateCoupon}>{editingId ? 'Update' : 'Create'}</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Active Coupons</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center">Code</TableHead>
                                        <TableHead className="text-center">Discount</TableHead>
                                        <TableHead className="text-center">Plan</TableHead>
                                        <TableHead className="text-center">Expiry</TableHead>
                                        <TableHead className="text-center">Email Limit</TableHead>
                                        <TableHead className="text-center">Used</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {coupons.map((coupon) => (
                                        <TableRow key={coupon.id}>
                                            <TableCell className="font-mono font-bold text-center">{coupon.code}</TableCell>
                                            <TableCell className="text-center">{coupon.discountPercent}%</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`px-2 py-1 rounded text-xs ${coupon.planType === 'BUSINESS' ? 'bg-purple-100 text-purple-800' :
                                                    coupon.planType === 'PERSONAL' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                                                    }`}>
                                                    {coupon.planType || 'Any'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {coupon.expiryDate ? (
                                                    <CountdownTimer targetDate={coupon.expiryDate} />
                                                ) : 'No Expiry'}
                                            </TableCell>
                                            <TableCell className="text-center">{coupon.specificEmail || 'All'}</TableCell>
                                            <TableCell className="text-center">{coupon.usedCount}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex gap-2 justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => startEdit(coupon)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteCoupon(coupon.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="feedbacks" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>User Feedback</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center">User</TableHead>
                                        <TableHead className="text-center">Date</TableHead>
                                        <TableHead className="text-center">Content</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {feedbacks.map((f) => (
                                        <TableRow key={f.id}>
                                            <TableCell className="text-center">{f.user.email}</TableCell>
                                            <TableCell className="text-center">{format(new Date(f.createdAt), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="max-w-md truncate text-right" dir="rtl">{f.content}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
