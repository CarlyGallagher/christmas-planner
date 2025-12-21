# SQL Cleanup Recommendations

## Summary
The project has redundant SQL files and unused database migrations that can be safely removed or consolidated.

## Current Status

### Active/Used:
- `sql/setup.sql` - Complete database setup (currently in use)
- `supabase/migrations/20251219035641_create_profiles_table.sql` - Profiles setup
- `supabase/migrations/20251219035817_create_wishlists_tables.sql` - Wishlists setup
- `supabase/migrations/20251220205650_add_wishlist_sharing_features.sql` - Sharing features
- `supabase/migrations/20251220210409_expand_image_formats.sql` - Image format expansion

### Unused/Future Features:
These migrations create tables for features that are **NOT currently implemented** in the app:
- `supabase/migrations/20251219040403_create_calendar_tables.sql` - Calendar feature (not implemented)
- `supabase/migrations/20251219040855_create_notifications_table.sql` - Notifications (not implemented)
- `supabase/migrations/20251219041024_create_storage_bucket.sql` - Storage (redundant, handled in setup.sql)

### Archived (Historical):
- `sql/archive/*` - All troubleshooting scripts (keep for reference)

## Recommendations

### Option 1: Clean Removal (Recommended for Production)
**Remove unused migrations since they're not being used:**

```bash
# Move unused migrations to archive
mkdir -p sql/archive/unused-migrations
mv supabase/migrations/20251219040403_create_calendar_tables.sql sql/archive/unused-migrations/
mv supabase/migrations/20251219040855_create_notifications_table.sql sql/archive/unused-migrations/
mv supabase/migrations/20251219041024_create_storage_bucket.sql sql/archive/unused-migrations/
```

**Benefits:**
- Cleaner migration history
- No confusion about what's actually implemented
- Can be restored if/when calendar and notifications are implemented

### Option 2: Keep for Future (Development)
**Keep all migrations if you plan to implement these features:**
- Calendar events
- Notifications system

**Note:** The `CalendarEvent` and `Notification` TypeScript interfaces in `src/types/index.ts` are defined but never used in the codebase.

### Option 3: Complete Consolidation
**Consolidate everything into a single setup script:**

Since the app only uses wishlists functionality, you could:
1. Keep only `sql/setup.sql` for fresh database setups
2. Remove all migration files from `supabase/migrations/`
3. Use Supabase migration system only for future changes going forward

**Warning:** This breaks migration history but simplifies initial setup.

## What the App Actually Uses

Currently implemented and working:
- ✅ Profiles
- ✅ Wishlists
- ✅ Wishlist Items
- ✅ Wishlist Sharing
- ✅ Image Storage

Not implemented (but in migrations):
- ❌ Calendar Events
- ❌ Notifications
- ❌ Calendar Sharing

## Recommended Action

**For immediate cleanup:**
```bash
# 1. Move unused migrations to archive
mkdir -p sql/archive/unused-migrations
mv supabase/migrations/20251219040403_create_calendar_tables.sql sql/archive/unused-migrations/
mv supabase/migrations/20251219040855_create_notifications_table.sql sql/archive/unused-migrations/
mv supabase/migrations/20251219041024_create_storage_bucket.sql sql/archive/unused-migrations/

# 2. Remove unused types from src/types/index.ts (CalendarEvent and Notification interfaces)

# 3. Keep sql/setup.sql as the canonical database setup script
```

This keeps your active codebase clean while preserving the unused migrations for future reference or implementation.
