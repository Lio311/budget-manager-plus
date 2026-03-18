# Security Implementation Overview - Budget Manager Plus

This document summarizes the comprehensive security architecture and specific measures implemented to protect the application, its data, and its users.

## 1. Authentication & Identity Management
- **Primary Provider**: Integrated with **Clerk**, an industry-standard identity management platform.
- **Multifactor Authentication (MFA)**: Support for TOTP and biometric authentication.
- **Session Management**: Secure session handling with automatic timeouts and cross-device logout capabilities.
- **Brute Force Protection**: Built-in protection against automated login attempts.

## 2. Authorization & Data Isolation
- **Middleware Protection**: A centralized Next.js middleware enforces authentication for all non-public routes.
- **Row Level Security (RLS)**: Implemented at the database level (PostgreSQL) to ensure that users can *only* access data belonging to their specific `userId`, providing a critical layer of defense-in-depth even if application-level checks are bypassed.
- **Route Matchers**: Strict definition of public vs. protected resources to prevent unauthorized access to sensitive APIs.

## 3. Data Protection & Encryption
- **Encryption at Rest**: All data stored in the Neon database is encrypted at the physical disk level using industry-standard encryption.
- **Encryption in Transit**: All communication between the client, server, and database is forced over **HTTPS/TLS 1.2+**. Port 80 is disabled, and HSTS (HTTP Strict Transport Security) is enforced.
- **Secrets Management**: Sensitive credentials (API keys, database URLs) are never stored in the source code. They are managed via Vercel's secure environment variable encryption and injected only at runtime.

## 4. Application Security (XSS & Injection)
- **Automatic Escaping**: Leveraged React's built-in protection to automatically escape data, preventing most Cross-Site Scripting (XSS) attacks.
- **HTML Sanitization**: For features requiring rich text (e.g., invoice notes), we use **DOMPurify** (`isomorphic-dompurify`) to strip dangerous tags (scripts, iframes, event handlers) before rendering.
- **SQL Injection Prevention**: Exclusive use of **Prisma ORM**, which utilizes parameterized queries, making traditional SQL injection attacks impossible.

## 5. Network & API Security
- **Rate Limiting**: An in-memory token bucket mechanism limits requests to **100 per minute per IP address**, preventing Denial of Service (DoS) and brute force attacks.
- **CORS Protection**: Cross-Origin Resource Sharing is strictly configured to allow requests only from the authorized production domain (`kesefly.co.il`).
- **Security Headers**: The following headers are enforced on all responses:
    - `X-Frame-Options: SAMEORIGIN` (Prevents Clickjacking)
    - `X-Content-Type-Options: nosniff` (Prevents MIME-sniffing)
    - `Content-Security-Policy (CSP)`: Restricts resource loading to trusted sources.
    - `Referrer-Policy`: Limits referral information shared with third parties.

## 6. Audit Logging & Accountability
- **Immutable Audit Logs**: A dedicated `AuditLog` system records every critical action within the platform.
- **Tracking Details**: Logs include the User ID, action performed, entity affected, timestamp, IP address, and browser User Agent.
- **Data Integrity**: Audit logs are designed to be append-only for standard users, ensuring a reliable trail for debugging and security investigations.

## 7. Business Continuity & Recovery
- **Automated Backups**: Managed by Neon DB with "Time Travel" capabilities, allowing restoration to any point in time.
- **Recovery Protocol**: A documented disaster recovery procedure (`RECOVERY_PROTOCOL.md`) defines monthly "restore tests" to verify backup integrity.

---
*Last Security Audit: March 2026*
