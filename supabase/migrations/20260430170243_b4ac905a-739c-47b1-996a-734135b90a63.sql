INSERT INTO storage.buckets (id, name, public)
VALUES ('sitter-photos', 'sitter-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Sitter photos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'sitter-photos');

CREATE POLICY "Users can upload their own sitter photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sitter-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own sitter photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sitter-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own sitter photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sitter-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);