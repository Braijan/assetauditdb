# Quick Setup Guide

## Prerequisites

1. **PostgreSQL Database**
   - Install PostgreSQL locally or use a cloud service (Vercel Postgres, Supabase, etc.)
   - Note your connection string

2. **Clerk Account**
   - Sign up at https://clerk.com
   - Create a new application
   - Copy your publishable key and secret key

## Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Fill in:
     - `DATABASE_URL` - Your PostgreSQL connection string
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
     - `CLERK_SECRET_KEY` - From Clerk dashboard

3. **Set Up Database**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run migrations to create tables
   npx prisma migrate dev --name init
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open http://localhost:3000
   - Sign up/sign in with Clerk
   - The system will automatically create your user account

## Initial Data Setup

Before you can add assets, you'll need to create:

1. **Organizations (Clients)**
   - You can add these through the Settings page (coming soon)
   - Or directly in the database:
   ```sql
   INSERT INTO org_party (id, type, name, active, "created_at", "updated_at")
   VALUES ('clxxx', 'CUSTOMER', 'Example Client', true, NOW(), NOW());
   ```

2. **Locations**
   ```sql
   INSERT INTO location (id, org_party_id, code, name, "created_at", "updated_at")
   VALUES ('locxxx', 'clxxx', 'WH-01', 'Warehouse 1', NOW(), NOW());
   ```

## First Steps

1. **Add a Client/Organization**
   - Go to Settings (or add via database)
   - Create at least one customer organization

2. **Add a Location**
   - Create at least one location for asset storage

3. **Add Your First Asset**
   - Navigate to Assets → Add Asset
   - Fill in required fields (Client, at least one identifier)
   - Save

4. **Explore Features**
   - View asset details and chain of custody
   - Generate Excel reports
   - Track status changes

## Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall/network settings

### Clerk Authentication Issues
- Verify your Clerk keys are correct
- Check Clerk dashboard for any errors
- Ensure callback URLs are configured in Clerk

### Prisma Issues
- Run `npx prisma generate` if you see Prisma client errors
- Run `npx prisma migrate dev` if tables are missing
- Check `prisma/schema.prisma` for syntax errors

## Next Steps

- Customize user roles in the database
- Add more organizations and locations
- Configure R2v3-specific settings
- Set up document storage (S3, etc.) for file uploads

