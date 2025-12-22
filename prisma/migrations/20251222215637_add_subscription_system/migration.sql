-- AlterTable
ALTER TABLE "users" ADD COLUMN     "hasUsedTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paypalOrderId" TEXT,
    "paypalPayerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "expiryNotified30Days" BOOLEAN NOT NULL DEFAULT false,
    "expiryNotified7Days" BOOLEAN NOT NULL DEFAULT false,
    "deletionScheduledFor" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "lastPaymentAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paypalOrderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ILS',
    "status" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_paypalOrderId_key" ON "subscriptions"("paypalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_history_paypalOrderId_key" ON "payment_history"("paypalOrderId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
