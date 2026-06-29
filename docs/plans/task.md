| Status | Task | Step |
|---|---|---|
| [x] | Task 1: Update Database Schema | Add itaRefreshToken to BusinessProfile |
| [x] | Task 1: Update Database Schema | Add allocationStatus to Invoice |
| [x] | Task 1: Update Database Schema | Push to DB and generate client |
| [x] | Task 2: Create ITA Callback API Route | Create src/app/api/ita/callback/route.ts |
| [x] | Task 2: Create ITA Callback API Route | Implement OAuth token exchange |
| [x] | Task 3: Create ITA Service | Create src/lib/services/ita-service.ts |
| [x] | Task 3: Create ITA Service | Implement getAccessToken |
| [x] | Task 3: Create ITA Service | Implement generateAllocationNumber |
| [x] | Task 4: Integrate with Invoice Signing | Modify src/lib/actions/invoices.ts |
| [x] | Task 4: Integrate with Invoice Signing | Add B2B and threshold logic |
| [x] | Task 4: Integrate with Invoice Signing | Handle ItaOfflineError |
| [x] | Task 5: Background Retry (CRON Job) | Create src/app/api/cron/ita-retry/route.ts |
| [x] | Task 5: Background Retry (CRON Job) | Implement daily retry logic |
