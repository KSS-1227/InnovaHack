-- =============================================================================
--  002_cases_schema.sql
--  Run this in Supabase SQL Editor:
--  https://supabase.com/dashboard/project/ohqkjizvfrmfdxghkurp/sql/new
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
--  public.cases
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cases (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title       TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    description TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_user_id    ON public.cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.cases(created_at DESC);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Users can only see their own cases
DROP POLICY IF EXISTS cases_select_own ON public.cases;
CREATE POLICY cases_select_own ON public.cases
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own cases
DROP POLICY IF EXISTS cases_insert_own ON public.cases;
CREATE POLICY cases_insert_own ON public.cases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own cases
DROP POLICY IF EXISTS cases_update_own ON public.cases;
CREATE POLICY cases_update_own ON public.cases
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own cases
DROP POLICY IF EXISTS cases_delete_own ON public.cases;
CREATE POLICY cases_delete_own ON public.cases
    FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cases_set_updated_at ON public.cases;
CREATE TRIGGER cases_set_updated_at
    BEFORE UPDATE ON public.cases
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
