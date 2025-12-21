import { z } from 'zod';

export const createWishlistSchema = z.object({
  name: z.string().min(3, 'Wishlist name must be at least 3 characters'),
});

export const wishlistItemSchema = z.object({
  name: z.string().min(2, 'Item name must be at least 2 characters'),
  description: z.string().optional(),
  url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  price: z.number().positive('Price must be positive').optional().or(z.literal(0)),
  image: z.instanceof(File).optional(),
});

export const shareWishlistSchema = z.object({
  email: z.string().min(1, 'Display name is required'),
  canMarkPurchased: z.boolean(),
});

export type CreateWishlistFormData = z.infer<typeof createWishlistSchema>;
export type WishlistItemFormData = z.infer<typeof wishlistItemSchema>;
export type ShareWishlistFormData = z.infer<typeof shareWishlistSchema>;
