-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum for document processing status
CREATE TYPE public.processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create enum for knowledge source type
CREATE TYPE public.knowledge_source_type AS ENUM ('document', 'video');

-- Create knowledge_tags table for organizing content
CREATE TABLE public.knowledge_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#1ECBE1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create knowledge_documents table
CREATE TABLE public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  status processing_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  chunk_count INTEGER DEFAULT 0,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create knowledge_videos table
CREATE TABLE public.knowledge_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  platform TEXT,
  caption_file_path TEXT,
  caption_file_name TEXT,
  status processing_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  chunk_count INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create knowledge_document_tags junction table
CREATE TABLE public.knowledge_document_tags (
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.knowledge_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
);

-- Create knowledge_video_tags junction table
CREATE TABLE public.knowledge_video_tags (
  video_id UUID NOT NULL REFERENCES public.knowledge_videos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.knowledge_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (video_id, tag_id)
);

-- Create knowledge_chunks table with vector embeddings
CREATE TABLE public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type knowledge_source_type NOT NULL,
  source_id UUID NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX knowledge_chunks_embedding_idx ON public.knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index for source lookups
CREATE INDEX knowledge_chunks_source_idx ON public.knowledge_chunks(source_type, source_id);

-- Enable RLS on all tables
ALTER TABLE public.knowledge_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_video_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for knowledge_tags
CREATE POLICY "Admins can manage tags" ON public.knowledge_tags
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view tags" ON public.knowledge_tags
FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for knowledge_documents
CREATE POLICY "Admins can manage documents" ON public.knowledge_documents
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view completed documents" ON public.knowledge_documents
FOR SELECT USING (auth.uid() IS NOT NULL AND status = 'completed');

-- RLS Policies for knowledge_videos
CREATE POLICY "Admins can manage videos" ON public.knowledge_videos
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view completed videos" ON public.knowledge_videos
FOR SELECT USING (auth.uid() IS NOT NULL AND status = 'completed');

-- RLS Policies for junction tables
CREATE POLICY "Admins can manage document tags" ON public.knowledge_document_tags
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view document tags" ON public.knowledge_document_tags
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage video tags" ON public.knowledge_video_tags
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view video tags" ON public.knowledge_video_tags
FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for knowledge_chunks
CREATE POLICY "Admins can manage chunks" ON public.knowledge_chunks
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view chunks" ON public.knowledge_chunks
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION public.search_knowledge_base(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  source_type knowledge_source_type,
  source_id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.source_type,
    kc.source_id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity,
    kc.metadata
  FROM public.knowledge_chunks kc
  WHERE 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_knowledge_documents_updated_at
BEFORE UPDATE ON public.knowledge_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_videos_updated_at
BEFORE UPDATE ON public.knowledge_videos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets for knowledge base files
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-documents', 'knowledge-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-captions', 'knowledge-captions', false);

-- Storage policies for knowledge-documents bucket
CREATE POLICY "Admins can upload documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'knowledge-documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'knowledge-documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete documents" ON storage.objects
FOR DELETE USING (bucket_id = 'knowledge-documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view documents" ON storage.objects
FOR SELECT USING (bucket_id = 'knowledge-documents' AND has_role(auth.uid(), 'admin'));

-- Storage policies for knowledge-captions bucket
CREATE POLICY "Admins can upload captions" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'knowledge-captions' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update captions" ON storage.objects
FOR UPDATE USING (bucket_id = 'knowledge-captions' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete captions" ON storage.objects
FOR DELETE USING (bucket_id = 'knowledge-captions' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view captions" ON storage.objects
FOR SELECT USING (bucket_id = 'knowledge-captions' AND has_role(auth.uid(), 'admin'));