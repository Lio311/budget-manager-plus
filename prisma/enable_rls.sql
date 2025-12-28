-- Enable RLS on all sensitive tables
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "budgets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_payment_methods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_advice_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "incomes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "debts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "savings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "category_budgets" ENABLE ROW LEVEL SECURITY;

-- Create Policies for Direct Tables (filtering by userId)
CREATE POLICY "Users can manage their own clients" ON "clients" USING ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY "Users can manage their own suppliers" ON "suppliers" USING ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY "Users can manage their own invoices" ON "invoices" USING ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY "Users can manage their own quotes" ON "quotes" USING ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY "Users can manage their own budgets" ON "budgets" USING ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY "Users can manage their own categories" ON "categories" USING ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY "Users can manage their own payment methods" ON "user_payment_methods" USING ("userId" = current_setting('app.current_user_id', true));
CREATE POLICY "Users can manage their own ai advice cache" ON "ai_advice_cache" USING ("userId" = current_setting('app.current_user_id', true));

-- Create Policies for Indirect Tables (linking via budgets table)
CREATE POLICY "Users can manage their own incomes" ON "incomes"
  USING ("budgetId" IN (SELECT id FROM "budgets" WHERE "userId" = current_setting('app.current_user_id', true)));

CREATE POLICY "Users can manage their own expenses" ON "expenses"
  USING ("budgetId" IN (SELECT id FROM "budgets" WHERE "userId" = current_setting('app.current_user_id', true)));

CREATE POLICY "Users can manage their own bills" ON "bills"
  USING ("budgetId" IN (SELECT id FROM "budgets" WHERE "userId" = current_setting('app.current_user_id', true)));

CREATE POLICY "Users can manage their own debts" ON "debts"
  USING ("budgetId" IN (SELECT id FROM "budgets" WHERE "userId" = current_setting('app.current_user_id', true)));

CREATE POLICY "Users can manage their own savings" ON "savings"
  USING ("budgetId" IN (SELECT id FROM "budgets" WHERE "userId" = current_setting('app.current_user_id', true)));

CREATE POLICY "Users can manage their own category budgets" ON "category_budgets"
  USING ("budgetId" IN (SELECT id FROM "budgets" WHERE "userId" = current_setting('app.current_user_id', true)));

