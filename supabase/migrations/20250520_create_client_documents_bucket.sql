
-- Create client_documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'client_documents', 'client_documents', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'client_documents'
);

-- Set RLS policies for the client_documents bucket
-- Allow users to insert their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can insert their own file objects'
  ) THEN
    CREATE POLICY "Users can insert their own file objects"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'client_documents' 
      AND (auth.uid() = owner OR owner IS NULL)
    );
  END IF;
END
$$;

-- Allow users to select their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can select their own file objects'
  ) THEN
    CREATE POLICY "Users can select their own file objects"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'client_documents' 
      AND (auth.uid() = owner OR bucket_id = 'client_documents')
    );
  END IF;
END
$$;

-- Allow users to update their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can update their own file objects'
  ) THEN
    CREATE POLICY "Users can update their own file objects"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'client_documents' 
      AND auth.uid() = owner
    );
  END IF;
END
$$;

-- Allow users to delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Users can delete their own file objects'
  ) THEN
    CREATE POLICY "Users can delete their own file objects"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'client_documents' 
      AND auth.uid() = owner
    );
  END IF;
END
$$;

-- Make the bucket public for downloads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Public access to client_documents files'
  ) THEN
    CREATE POLICY "Public access to client_documents files"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'client_documents');
  END IF;
END
$$;
