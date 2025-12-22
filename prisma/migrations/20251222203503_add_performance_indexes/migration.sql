-- CreateIndex
CREATE INDEX "bills_budgetId_idx" ON "bills"("budgetId");

-- CreateIndex
CREATE INDEX "budgets_userId_month_year_idx" ON "budgets"("userId", "month", "year");

-- CreateIndex
CREATE INDEX "categories_userId_type_idx" ON "categories"("userId", "type");

-- CreateIndex
CREATE INDEX "debts_budgetId_idx" ON "debts"("budgetId");

-- CreateIndex
CREATE INDEX "expenses_budgetId_idx" ON "expenses"("budgetId");

-- CreateIndex
CREATE INDEX "incomes_budgetId_idx" ON "incomes"("budgetId");

-- CreateIndex
CREATE INDEX "savings_budgetId_idx" ON "savings"("budgetId");
