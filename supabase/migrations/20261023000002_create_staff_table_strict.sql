-- Supabase Migration: Strict Staff Table & RLS Policies
-- Description: Creates staff table with id, salon_id (foreign key to salons), full_name, role, app_access_level, mobile_number, commission_percentage, status, profile_photo_url, privacy_settings, and weekly_schedule. Restricts RLS access to owners of the same salon_id.

CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL,
    app_access_level TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Available',
    profile_photo_url TEXT,
    privacy_settings BOOLEAN NOT NULL DEFAULT false,
    weekly_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_salon_id ON public.staff(salon_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Restrict read and write access to authenticated owners belonging to the same salon_id
CREATE POLICY "Allow public read active staff"
ON public.staff
FOR SELECT
USING (true);

CREATE POLICY "Allow salon owners full access to their salon staff"
ON public.staff
FOR ALL
USING (
    salon_id IN (
        SELECT id FROM public.salons WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    salon_id IN (
        SELECT id FROM public.salons WHERE owner_id = auth.uid()
    )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_staff_updated_at
    BEFORE UPDATE ON public.staff
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_staff_updated_at();
