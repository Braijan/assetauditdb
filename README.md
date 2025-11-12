# Asset Audit System - R2v3 Compliance

A comprehensive web application for tracking ITAD (IT Asset Disposition) assets end-to-end for R2v3 compliance, built with Next.js, Prisma, PostgreSQL, and Clerk.

## Features

- **Asset Management**: Complete CRUD operations for ITAD assets with multiple identifier support
- **Chain of Custody**: Immutable audit trail of all asset movements and status changes
- **Work Orders**: Track testing, repair, sanitization, and teardown workflows
- **Sanitization Tracking**: Record and verify data sanitization actions and results
- **Testing & Grading**: Functional testing with pass/fail results
- **Excel Reports**: Generate comprehensive Excel reports for assets, chain of custody, and work orders
- **R2v3 Compliance**: Built-in support for R2v3 compliance requirements including:
  - Document management
  - Nonconformance tracking (NCR)
  - CAPA (Corrective and Preventive Actions)
  - Certification management
  - Downstream vendor approvals

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **UI**: Tailwind CSS + shadcn/ui components
- **Forms**: React Hook Form + Zod validation
- **Reports**: xlsx library for Excel export

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Clerk account (for authentication)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Fill in your:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

4. Set up the database:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Time Setup

1. Sign up/sign in through Clerk
2. The system will automatically create a user account on first login
3. Start adding assets, clients, and locations through the UI

## Project Structure

```
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── assets/            # Asset management pages
│   ├── dashboard/         # Dashboard
│   └── reports/           # Reports page
├── components/            # React components
│   ├── assets/           # Asset-related components
│   ├── layout/           # Layout components (navbar, etc.)
│   └── ui/               # shadcn/ui components
├── lib/                  # Utilities
│   └── prisma.ts         # Prisma client
└── prisma/
    └── schema.prisma     # Database schema
```

## Database Schema

The database includes comprehensive tables for:
- Organizations (customers, suppliers, downstream vendors)
- Assets with multiple identifiers
- Locations and facilities
- Chain of custody events (immutable audit trail)
- Work orders and steps
- Sanitization actions and results
- Test results
- Components and BOM
- Material lots
- Shipments
- Sales orders
- Certifications
- Nonconformances and CAPA actions
- Documents

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Set up PostgreSQL database (Vercel Postgres or external)
5. Run migrations: `npx prisma migrate deploy`

### Environment Variables for Production

Make sure to set:
- `DATABASE_URL` (production database)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- Clerk URLs for production

## Usage

### Adding Assets

1. Navigate to Assets → Add Asset
2. Fill in required information (client, at least one identifier)
3. Add additional identifiers, location, and metadata
4. Save to create the asset and initial chain of custody event

### Tracking Chain of Custody

- All asset movements are automatically tracked
- Status changes create immutable history records
- View complete audit trail on asset detail page

### Generating Reports

1. Navigate to Reports
2. Select report type (Assets, Chain of Custody, or Work Orders)
3. Apply optional filters
4. Click "Generate Excel Report" to download

## R2v3 Compliance Features

- **Immutable Audit Trail**: All events are append-only
- **Document Management**: Link documents to assets, orders, shipments
- **Sanitization Validation**: Enforce data sanitization before shipping/resale
- **Nonconformance Tracking**: Track and resolve compliance issues
- **Certification Management**: Track R2v3, ISO 14001, e-Stewards certifications

## Contributing

This is a private project. For questions or issues, contact the development team.

## License

Private - All rights reserved
