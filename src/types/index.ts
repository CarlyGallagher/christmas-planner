// Shared TypeScript type definitions
// Database types will be generated from Supabase

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  name: string;
  is_shared: boolean;
  hide_purchased?: boolean;
  share_token?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  name: string;
  description?: string;
  url?: string;
  image_url?: string;
  price?: number;
  is_purchased: boolean;
  purchased_by?: string;
  created_at: string;
  sort_order: number;
}

export interface CalendarEvent {
  id: string;
  calendar_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  reminder_minutes?: number;
  created_by: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  event_id?: string;
  message: string;
  is_read: boolean;
  scheduled_for: string;
  sent_at?: string;
  created_at: string;
}
