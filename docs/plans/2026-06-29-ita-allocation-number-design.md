# ITA API Implementation Plan (Updated)

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Automate the generation of an Allocation Number (מספר הקצאה) for invoices using the Israel Tax Authority (ITA) OpenAPI, with offline fallback and background retries.

**Architecture:**
- **OAuth:** OAuth2 flow to connect the business profile to the ITA.
- **Generation:** Fetches allocation number during the signing process, immediately before PDF generation.
- **B2B/B2C Logic:** Only B2B invoices (client has a Tax ID) above 5,000 ILS (2026 limit) will trigger the API.
- **Fallback:** If ITA is down, invoice is signed normally with a `PENDING_ITA` status, and a CRON job will retry the next day.

**Tech Stack:** Next.js App Router (API Routes & CRON), Prisma, Node.js `fetch`.

---

### Task 1: Update Database Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add fields**
- Add `itaRefreshToken String?` to `BusinessProfile`.
- Add `allocationStatus String @default("NOT_REQUIRED")` to `Invoice`.

**Step 2: Generate client**
Run `npx prisma db push` and `npx prisma generate`.

### Task 2: Create ITA Callback API Route

**Files:**
- Create: `src/app/api/ita/callback/route.ts`

**Step 1: Write Route Handler**
Implement GET handler that takes `code` from URL parameters.
Exchange code for token using `fetch` to `https://openapi.taxes.gov.il/shaam/tsandbox/longtimetoken/oauth2/token`
Save the resulting `refresh_token` to `BusinessProfile`.

### Task 3: Create ITA Service

**Files:**
- Create: `src/lib/services/ita-service.ts`

**Step 1: Write Token Management**
Implement `getAccessToken(refreshToken: string)` which calls the ITA API.

**Step 2: Write Allocation Request with Fallback**
Implement `generateAllocationNumber(invoiceId: string)` which formats the invoice and POSTs to the ITA allocation endpoint.
Wrap the fetch call in a try/catch block with a timeout. If it fails, throw a specific `ItaOfflineError`.

### Task 4: Integrate with Invoice Signing

**Files:**
- Modify: `src/lib/actions/invoices.ts`

**Step 1: Inject service call in signInvoice**
Before `generateInvoicePDF` is called, check if:
`invoice.subtotal >= 5000` AND `client.taxId != null` AND `businessProfile.itaRefreshToken` exists.
If true, await `generateAllocationNumber`.
If successful, update invoice `allocationNumber` and set `allocationStatus = 'COMPLETED'`.
If `ItaOfflineError` is caught, set `allocationStatus = 'PENDING_ITA'` and continue.

### Task 5: Background Retry (CRON Job)

**Files:**
- Create: `src/app/api/cron/ita-retry/route.ts`

**Step 1: Create Cron Endpoint**
Create a GET route handler.
Query all invoices where `allocationStatus == 'PENDING_ITA'`.
Loop through them, fetch the allocation number, and update the invoice record.
