-- ============================================================================
-- WORKOUT TRACKING SCHEMA - SIMPLIFIED
-- ============================================================================
-- Tabella per gestire gli allenamenti settimanali degli utenti
-- Ogni record rappresenta una sessione di allenamento con note libere

-- Drop existing table if needed (ATTENZIONE: cancella tutti i dati!)
-- DROP TABLE IF EXISTS public.workouts;

-- Create workouts table
CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_name TEXT NOT NULL,
  note_content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS workouts_created_at_idx ON public.workouts(created_at DESC);
CREATE INDEX IF NOT EXISTS workouts_week_name_idx ON public.workouts(week_name);

-- Enable Row Level Security (RLS)
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can create their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.workouts;

-- RLS Policies: Users can only access their own workouts
CREATE POLICY "Users can view their own workouts"
  ON public.workouts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workouts"
  ON public.workouts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
  ON public.workouts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
  ON public.workouts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_workouts_updated_at ON public.workouts;
CREATE TRIGGER update_workouts_updated_at
  BEFORE UPDATE ON public.workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.workouts TO authenticated;
GRANT ALL ON public.workouts TO service_role;

-- ============================================================================
-- ESEMPIO DI DATI INIZIALI (opzionale)
-- ============================================================================
-- Decommentare per inserire dati di esempio
--
-- INSERT INTO public.workouts (user_id, week_name, note_content)
-- VALUES
--   (auth.uid(), 'Settimana 1 - Gennaio',
--    E'Lunedì: Petto/Dorso\n\nRiscaldamento\n- 5 min bike\n- Mobilità spalle\n\nPanca Piana\n- 3x10 @ 80kg\n- Sentito bene\n\nSquat\n- 4x8 @ 100kg'),
--   (auth.uid(), 'Settimana 1 - Gennaio',
--    E'Mercoledì: Gambe\n\nRiscaldamento\n- 10 min ellittica\n\nSquat\n- 5x5 @ 120kg\n\nStacco\n- 3x8 @ 140kg');
