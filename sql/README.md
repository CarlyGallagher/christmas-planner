# SQL Scripts

This folder contains SQL scripts for setting up and managing the Christmas Planner database.

## Main Setup Script

### setup.sql
The complete database setup script that should be run on a fresh Supabase instance. This script includes:
- Database schema (profiles, wishlists, wishlist_items, wishlist_shares tables)
- Row Level Security (RLS) policies
- Storage bucket configuration
- Database triggers and functions

**Usage:** Run this script in your Supabase SQL Editor when setting up the database for the first time.

## Archive Folder

The `archive/` folder contains historical SQL scripts that were used during development and troubleshooting. These are kept for reference but are not needed for normal operation:

- `SETUP_DATABASE.sql` - Original database setup script
- `FIX_RLS_POLICIES.sql` - RLS policy fixes during development
- `SIMPLE_RLS_FIX.sql` - Simplified RLS policy implementation
- `DIAGNOSE_POLICIES.sql` - Diagnostic queries for troubleshooting policies
- `CREATE_MISSING_PROFILES.sql` - Script to create profiles for existing users
- `CREATE_YOUR_PROFILE.sql` - Manual profile creation for specific user
- `FORCE_CREATE_PROFILE.sql` - Force profile creation script

These archived scripts can be safely ignored unless you need to reference the development history.

## Migrations

For production database schema changes, use the migration files in `supabase/migrations/` instead of these ad-hoc SQL scripts.
