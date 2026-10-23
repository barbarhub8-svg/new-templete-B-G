-- Supabase Migration: Staff Table with primary_role and Salon-Owner Isolation RLS
-- Description: Creates the staff table with full_name, primary_role, app_access_level, mobile_number, commission_percentage, status, profile_photo_url, privacy_settings, and weekly_schedule.

CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    primary_role TEXT NOT NULL DEFAULT 'Senior Stylist',
    app_access_level TEXT NOT NULL DEFAULT 'Service Provider',
    mobile_number TEXT NOT NULL,
    commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    status TEXT NOT NULL DEFAULT 'Available',
    profile_photo_url TEXT,
    privacy_settings BOOLEAN NOT NULL DEFAULT false,
    weekly_schedule JSONB NOT NULL DEFAULT '[
        {"day": "Monday", "is_working": true, "start_time": "10:00", "end_time": "20:00"},
        {"day": "Tuesday", "is_working": true, "start_time": "10:00", "end_time": "20:00"},
        {"day": "Wednesday", "is_working": true, "start_time": "10:00", "end_time": "20:00"},
        {"day": "Thursday", "is_working": true, "start_time": "10:00", "end_time": "20:00"},
        {"day": "Friday", "is_working": true, "start_time": "10:00", "end_time": "20:00"},
        {"day": "Saturday", "is_working": true, "start_time": "10:00", "end_time": "20:00"},
        {"day": "Sunday", "is_working": false, "start_time": "10:00", "end_time": "18:00"}
    ]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_staff_salon_id ON public.staff(salon_id);

-- Enable Row Level Security
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies for salon-owner isolation
CREATE POLICY "Public read active staff"
ON public.staff
FOR SELECT
USING (true);

CREATE POLICY "Salon owners can manage their staff"
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
