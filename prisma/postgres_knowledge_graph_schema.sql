-- postgres_knowledge_graph_schema.sql
-- Production SQL schema design for Promty.ir Prompt Knowledge Platform
-- Optimized for PostgreSQL 16+ supporting pgvector extension and B-Tree/GIN indices.
-- Scalability target: 10M Prompts, 500M Dynamic Relationships, 100M Searches.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector"; -- For semantic semantic search

-- ==========================================
-- 1. ENTITY LAYER (Core Fact Tables)
-- ==========================================

CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title_fa VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    description_fa TEXT NOT NULL,
    description_en TEXT,
    body TEXT NOT NULL,
    fields_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sample_image VARCHAR(1024),
    quality_score REAL NOT NULL DEFAULT 50.0, -- Computed automatically by Intelligence Service
    usage_count INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. DYNAMIC TAXONOMY SYSTEM (Principal Entity Models)
-- ==========================================

CREATE TYPE taxonomy_type AS ENUM (
    'intent', 'domain', 'tool', 'language', 'difficulty', 'outputFormat', 'industry', 'fieldType'
);

CREATE TABLE taxonomy_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type taxonomy_type NOT NULL,
    slug VARCHAR(128) UNIQUE NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_fa VARCHAR(255) NOT NULL,
    description_fa TEXT,
    description_en TEXT,
    aliases VARCHAR(128)[] DEFAULT '{}',
    synonyms VARCHAR(128)[] DEFAULT '{}',
    popularity REAL NOT NULL DEFAULT 0.0,
    usage_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. KNOWLEDGE GRAPH & RELATIONSHIP LAYER
-- ==========================================

CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL,
    source_type VARCHAR(64) NOT NULL, -- 'Prompt', 'TaxonomyTerm'
    target_id UUID NOT NULL,
    target_type VARCHAR(64) NOT NULL, -- 'Prompt', 'TaxonomyTerm'
    relation_type VARCHAR(128) NOT NULL, -- e.g., 'Intent_To_Task', 'Task_To_Tool', 'Prompt_To_Prompt'
    confidence_score REAL NOT NULL DEFAULT 1.0, -- AI or Human verification score (0.0 to 1.0)
    priority INTEGER NOT NULL DEFAULT 0,
    weight REAL NOT NULL DEFAULT 1.0, -- User interaction strength factor
    recommendation_score REAL NOT NULL DEFAULT 0.0, -- Automatically computed by graph recommendation engine
    similarity_score REAL NOT NULL DEFAULT 0.0, -- Vector proximity score
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_confidence CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    CONSTRAINT check_weight CHECK (weight BETWEEN 0.0 AND 1.0)
);

-- ==========================================
-- 4. INTELLIGENCE & EMBEDDING CORES
-- ==========================================

CREATE TABLE prompt_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    embedding vector(1536) NOT NULL, -- 1536-dimensional float vector for Gemini / OpenAI text embeddings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. SEARCH LOGGING & POPULARITY telemetry
-- ==========================================

CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    normalized_query TEXT NOT NULL,
    session_id VARCHAR(255),
    results_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 6. INDEXING STRATEGY (High-performance targets)
-- ==========================================

-- Prompts indexing
CREATE INDEX idx_prompts_slug ON prompts(slug);
CREATE INDEX idx_prompts_active_premium ON prompts(is_active, is_premium);
CREATE INDEX idx_prompts_quality ON prompts(quality_score DESC);

-- Taxonomy indexing
CREATE INDEX idx_taxonomy_type_slug ON taxonomy_terms(type, slug);
CREATE INDEX idx_taxonomy_popularity ON taxonomy_terms(popularity DESC);

-- Knowledge Graph relationships speed indexing
CREATE INDEX idx_relationships_source ON relationships(source_id, source_type);
CREATE INDEX idx_relationships_target ON relationships(target_id, target_type);
CREATE INDEX idx_relationships_lookup ON relationships(source_id, target_id, relation_type);

-- Vector Search (Cosine Similarity HNSW index)
CREATE INDEX idx_prompt_embeddings_vector ON prompt_embeddings USING hnsw (embedding vector_cosine_ops);

-- Full-Text search engine (Combining English/Persian lexemes)
ALTER TABLE prompts ADD COLUMN textsearchable_index_col tsvector;

-- Trigger to auto-update full-text index vector when title or body changes
CREATE OR REPLACE FUNCTION prompts_tsvector_trigger() RETURNS trigger AS $$
BEGIN
  new.textsearchable_index_col :=
     to_tsvector('english', coalesce(new.title_en, '')) ||
     to_tsvector('simple', coalesce(new.title_fa, '')) || -- simple parser handles Persian characters safely
     to_tsvector('english', coalesce(new.body, ''));
  return new;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
ON prompts FOR EACH ROW EXECUTE FUNCTION prompts_tsvector_trigger();

CREATE INDEX idx_prompts_fulltext ON prompts USING GIN (textsearchable_index_col);
