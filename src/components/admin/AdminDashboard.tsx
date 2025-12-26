'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Trash2, Edit2 } from 'lucide-react'
import { createCoupon, deleteCoupon, deleteUser, updateUserSubscription } from '@/lib/actions/admin'
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
    const [newCoupon, setNewCoupon] = useState({ code: '', discountPercent: 0, expiryDate: '', specificEmail: '' })

    const handleCreateCoupon = async () => {
        await createCoupon({
            code: newCoupon.code,
            discountPercent: Number(newCoupon.discountPercent),
            expiryDate: newCoupon.expiryDate ? new Date(newCoupon.expiryDate) : undefined,
            specificEmail: newCoupon.specificEmail || undefined
        })
        setNewCoupon({ code: '', discountPercent: 0, expiryDate: '', specificEmail: '' })
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-center">₪{totalRevenue}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-center">{users.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-center">
                            {users.filter(u => u.subscription?.status === 'active').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
                                                    <span className={`px-2 py-1 rounded-full text-xs ${user.subscription?.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        user.subscription?.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {user.subscription?.status === 'active' ? 'Active' :
                                                            user.subscription?.status === 'trial' ? 'Trial' :
                                                                user.subscription?.status || 'None'}
                                                    </span>
                                                    {user.subscription?.status === 'trial' && (
                                                        <span className="text-[10px] text-gray-500">
                                                            {user.hasUsedTrial ? '(Used)' : ''}
                                                        </span>
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
                                                            const newDate = prompt('Enter new end date (YYYY-MM-DD):',
                                                                user.subscription?.endDate ? format(new Date(user.subscription.endDate), 'yyyy-MM-dd') : ''
                                                            )
                                                            if (newDate) updateUserSubscription(user.id, new Date(newDate))
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
                        <CardHeader><CardTitle>Create Coupon</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-5 items-end text-left" dir="ltr">
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
                                    <Label className="text-left block">Expiry Date (Optional)</Label>
                                    <Input
                                        className="text-left"
                                        type="datetime-local"
                                        value={newCoupon.expiryDate}
                                        onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                        dir="ltr"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-left block">Specific Email (Optional)</Label>
                                    <Input
                                        className="text-left"
                                        type="email"
                                        value={newCoupon.specificEmail}
                                        onChange={e => setNewCoupon({ ...newCoupon, specificEmail: e.target.value })}
                                        dir="ltr"
                                    />
                                </div>
                                <Button onClick={handleCreateCoupon}>Create Coupon</Button>
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
                                                {coupon.expiryDate ? (
                                                    <CountdownTimer targetDate={coupon.expiryDate} />
                                                ) : 'No Expiry'}
                                            </TableCell>
                                            <TableCell className="text-center">{coupon.specificEmail || 'All'}</TableCell>
                                            <TableCell className="text-center">{coupon.usedCount}</TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteCoupon(coupon.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
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
