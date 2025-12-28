-- ============================================================================
-- GYM LOGS SCHEMA - Tracking Allenamenti con Pesi
-- ============================================================================
-- Tabella per tracciare sessioni di allenamento con note e pesi

-- Drop existing table if needed
-- DROP TABLE IF EXISTS public.gym_logs;

-- Create gym_logs table
CREATE TABLE IF NOT EXISTS public.gym_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  note_testo TEXT DEFAULT '',
  peso_panca DECIMAL(5,2) DEFAULT NULL,  -- Panca piana in kg
  peso_squat DECIMAL(5,2) DEFAULT NULL,  -- Squat in kg
  peso_stacco DECIMAL(5,2) DEFAULT NULL, -- Stacco in kg
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate entries for same user on same day
  UNIQUE(user_id, data)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS gym_logs_user_id_idx ON public.gym_logs(user_id);
CREATE INDEX IF NOT EXISTS gym_logs_data_idx ON public.gym_logs(data DESC);
CREATE INDEX IF NOT EXISTS gym_logs_user_data_idx ON public.gym_logs(user_id, data DESC);

-- Enable Row Level Security
ALTER TABLE public.gym_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own gym logs" ON public.gym_logs;
DROP POLICY IF EXISTS "Users can create their own gym logs" ON public.gym_logs;
DROP POLICY IF EXISTS "Users can update their own gym logs" ON public.gym_logs;
DROP POLICY IF EXISTS "Users can delete their own gym logs" ON public.gym_logs;

-- RLS Policies
CREATE POLICY "Users can view their own gym logs"
  ON public.gym_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gym logs"
  ON public.gym_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gym logs"
  ON public.gym_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gym logs"
  ON public.gym_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_gym_logs_updated_at ON public.gym_logs;
CREATE TRIGGER update_gym_logs_updated_at
  BEFORE UPDATE ON public.gym_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.gym_logs TO authenticated;
GRANT ALL ON public.gym_logs TO service_role;

-- ============================================================================
-- ESEMPIO DI DATI (opzionale - decommenta per testare)
-- ============================================================================
-- INSERT INTO public.gym_logs (user_id, data, note_testo, peso_panca, peso_squat, peso_stacco)
-- VALUES
--   (auth.uid(), CURRENT_DATE - INTERVAL '7 days', 'Ottima sessione, sentito bene', 80.00, 100.00, 120.00),
--   (auth.uid(), CURRENT_DATE - INTERVAL '14 days', 'Faticoso ma completato', 77.50, 95.00, 115.00),
--   (auth.uid(), CURRENT_DATE - INTERVAL '21 days', 'Primo allenamento della settimana', 75.00, 92.50, 110.00);
