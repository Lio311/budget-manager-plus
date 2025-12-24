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
import { Trash2, Edit2, Timer } from 'lucide-react'
import { createCoupon, deleteCoupon, deleteUser, updateUserSubscription } from '@/lib/actions/admin'

interface AdminDashboardProps {
    initialData: {
        users: any[]
        coupons: any[]
        feedbacks: any[]
    }
}

export function AdminDashboard({ initialData }: AdminDashboardProps) {
    const { users, coupons, feedbacks } = initialData
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
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {users.filter(u => u.subscription?.status === 'active').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Feedbacks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{feedbacks.length}</div>
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
                                        <TableHead className="text-right">Name</TableHead>
                                        <TableHead className="text-right">Email</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                        <TableHead className="text-right">Last Payment</TableHead>
                                        <TableHead className="text-right">End Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.name || 'User'}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs ${user.subscription?.status === 'active' ? 'bg-green-100 text-green-800' :
                                                        user.subscription?.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {user.subscription?.status || 'None'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {user.paymentHistory?.[0] ? `₪${user.paymentHistory[0].amount}` : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {user.subscription?.endDate ? format(new Date(user.subscription.endDate), 'dd/MM/yyyy') : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
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
                            <div className="grid gap-4 md:grid-cols-5 items-end">
                                <div className="space-y-2">
                                    <Label>Code</Label>
                                    <Input
                                        value={newCoupon.code}
                                        onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Discount %</Label>
                                    <Input
                                        type="number"
                                        value={newCoupon.discountPercent}
                                        onChange={e => setNewCoupon({ ...newCoupon, discountPercent: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expiry Date (Optional)</Label>
                                    <Input
                                        type="datetime-local"
                                        value={newCoupon.expiryDate}
                                        onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Specific Email (Optional)</Label>
                                    <Input
                                        type="email"
                                        value={newCoupon.specificEmail}
                                        onChange={e => setNewCoupon({ ...newCoupon, specificEmail: e.target.value })}
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
                                        <TableHead className="text-right">Code</TableHead>
                                        <TableHead className="text-right">Discount</TableHead>
                                        <TableHead className="text-right">Expiry</TableHead>
                                        <TableHead className="text-right">Email Limit</TableHead>
                                        <TableHead className="text-right">Used</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {coupons.map((coupon) => (
                                        <TableRow key={coupon.id}>
                                            <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                                            <TableCell>{coupon.discountPercent}%</TableCell>
                                            <TableCell>
                                                {coupon.expiryDate ? (
                                                    <div className="flex items-center gap-1 text-orange-600">
                                                        <Timer className="h-4 w-4" />
                                                        {format(new Date(coupon.expiryDate), 'dd/MM/yyyy HH:mm')}
                                                    </div>
                                                ) : 'No Expiry'}
                                            </TableCell>
                                            <TableCell>{coupon.specificEmail || 'All'}</TableCell>
                                            <TableCell>{coupon.usedCount}</TableCell>
                                            <TableCell>
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
                                        <TableHead className="text-right">User</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                        <TableHead className="text-right">Content</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {feedbacks.map((f) => (
                                        <TableRow key={f.id}>
                                            <TableCell>{f.user.email}</TableCell>
                                            <TableCell>{format(new Date(f.createdAt), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell className="max-w-md truncate">{f.content}</TableCell>
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
