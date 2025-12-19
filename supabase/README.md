# Supabase Setup Instructions

This directory contains database migrations and Edge Functions for the Christmas Planner app.

## Getting Started

### 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - Name: `christmas-planner` (or your preferred name)
   - Database Password: Generate a strong password and save it securely
   - Region: Choose the closest region to your users
4. Wait for the project to be created (takes ~2 minutes)

### 2. Link Your Local Project to Supabase

```bash
# Login to Supabase CLI
supabase login

# Link your local project to your remote Supabase project
supabase link --project-ref YOUR_PROJECT_REF
```

You can find your project ref in your Supabase project URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`

### 3. Push Migrations to Your Supabase Project

```bash
# Push all migrations to your remote database
supabase db push
```

This will create all the tables, RLS policies, and storage buckets in your remote Supabase database.

### 4. Get Your API Keys

1. Go to your project settings: Project Settings > API
2. Copy the following values to your `.env.local` file:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service_role key (keep this secret!)

Example `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

## Database Schema Overview

### Core Tables

#### `profiles`
- Extends `auth.users` with additional user information
- Automatically created when a user signs up
- Fields: `id`, `display_name`, `avatar_url`

#### `wishlists`
- User-created wishlists
- Can be shared with other users
- Fields: `id`, `user_id`, `name`, `is_shared`

#### `wishlist_items`
- Items within a wishlist
- Supports: name, description, URL, image, price
- Can be marked as purchased
- Fields: `id`, `wishlist_id`, `name`, `description`, `url`, `image_url`, `price`, `is_purchased`, `purchased_by`

#### `wishlist_shares`
- Tracks which users have access to shared wishlists
- Configurable permissions (can_mark_purchased)

#### `calendars`
- User-created calendars
- Can be shared with other users
- Fields: `id`, `owner_id`, `name`, `is_shared`

#### `calendar_events`
- Events within a calendar
- Supports recurring events (RRULE format)
- Optional reminders
- Fields: `id`, `calendar_id`, `title`, `description`, `start_date`, `end_date`, `is_recurring`, `recurrence_rule`, `reminder_minutes`

#### `calendar_shares`
- Tracks which users have access to shared calendars
- Configurable permissions (can_edit)

#### `notifications`
- System-generated notifications
- Automatically created for calendar event reminders
- Fields: `id`, `user_id`, `event_id`, `message`, `is_read`, `scheduled_for`, `sent_at`

### Storage Buckets

#### `wishlist-images`
- Public bucket for wishlist item images
- 5MB file size limit
- Supported formats: JPEG, PNG, GIF, WebP, HEIC/HEIF
- Users can only upload to their own folder (organized by user_id)

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Shared resources (wishlists, calendars) are accessible to authorized users
- Proper permission checks for create/update/delete operations

## Migrations

Migrations are located in `supabase/migrations/` and are numbered chronologically:

1. `20251219035641_create_profiles_table.sql` - User profiles
2. `20251219035817_create_wishlists_tables.sql` - Wishlists and items
3. `20251219040403_create_calendar_tables.sql` - Calendars and events
4. `20251219040855_create_notifications_table.sql` - Notifications
5. `20251219041024_create_storage_bucket.sql` - Image storage

## Local Development (Optional)

You can run Supabase locally for development:

```bash
# Start local Supabase (requires Docker)
supabase start

# Stop local Supabase
supabase stop

# Reset local database
supabase db reset
```

## Troubleshooting

### Migration Errors

If you encounter errors when pushing migrations:

```bash
# Check migration status
supabase migration list

# Repair migrations if needed
supabase migration repair --status applied <migration-version>
```

### Reset Remote Database

**WARNING: This will delete all data!**

```bash
# Reset remote database (requires confirmation)
supabase db reset --linked
```

## Next Steps

After setting up Supabase:
1. Update your `.env.local` with your Supabase credentials
2. Restart your Next.js dev server
3. Test authentication by creating a user
4. Start building features!
