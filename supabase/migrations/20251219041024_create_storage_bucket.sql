-- Create storage bucket for wishlist images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wishlist-images',
  'wishlist-images',
  true, -- Public bucket (images are viewable via URL)
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for wishlist-images bucket
-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload images to their own folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'wishlist-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'wishlist-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'wishlist-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow everyone to view images (since bucket is public)
CREATE POLICY "Anyone can view images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'wishlist-images');
