# Environment Variables Setup Guide

This document explains how to configure the required environment variables for the Budget Manager application.

## Required Environment Variables

### 1. Clerk Authentication

Get these from [Clerk Dashboard](https://dashboard.clerk.com):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

**Where to find:**
- Go to https://dashboard.clerk.com
- Select your application
- Navigate to "API Keys"
- Copy the Publishable Key and Secret Key

### 2. Database (Neon PostgreSQL)

Get this from [Neon Console](https://console.neon.tech):

```bash
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

**Where to find:**
- Go to https://console.neon.tech
- Select your project
- Navigate to "Connection Details"
- Copy the connection string

### 3. Email Service (Resend)

Get this from [Resend Dashboard](https://resend.com/api-keys):

```bash
RESEND_API_KEY=re_...
FROM_EMAIL="Budget Manager <noreply@yourdomain.com>"
```

**Where to find:**
- Go to https://resend.com/api-keys
- Click "Create API Key"
- Copy the generated key (starts with `re_`)
- Set FROM_EMAIL to your verified domain email

### 4. App URL

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For local development
# OR
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # For production
```

## GitHub Repository Secrets

For deployment on Vercel/production, add these as **Repository Secrets** in GitHub:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of the following:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Clerk publishable key (production) |
| `CLERK_SECRET_KEY` | `sk_live_...` | Clerk secret key (production) |
| `DATABASE_URL` | `postgresql://...` | Neon PostgreSQL connection string |
| `RESEND_API_KEY` | `re_...` | Resend API key for emails |
| `FROM_EMAIL` | `Budget Manager <noreply@yourdomain.com>` | Email sender address |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | Production app URL |

## Vercel Environment Variables

If deploying to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all the variables listed above
4. Make sure to set the correct environment (Production/Preview/Development)

## Local Development Setup

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in all the values in `.env.local` with your actual keys

3. **IMPORTANT**: Never commit `.env.local` to git (it's already in `.gitignore`)

## Security Notes

- ✅ All API keys are stored in environment variables
- ✅ `.env` and `.env.local` files are git-ignored
- ✅ Never hardcode API keys in source code
- ✅ Use different keys for development and production
- ✅ Rotate keys regularly for security
