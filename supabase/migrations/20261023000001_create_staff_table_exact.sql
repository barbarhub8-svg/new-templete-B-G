-- Supabase Migration: Create Staff Table with Exact Requested Schema
-- Description: Creates the staff table with salon_id, full_name, role, app_access_level, mobile_number, commission_percentage, status, profile_photo_url, privacy_settings, weekly_schedule, and RLS policies.

CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id TEXT NOT NULL, -- Foreign key referencing salons/shops
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Senior Stylist',
    app_access_level TEXT NOT NULL DEFAULT 'Service Provider',
    mobile_number TEXT NOT NULL,
    commission_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    status TEXT NOT NULL DEFAULT 'Available',
    profile_photo_url TEXT,
    privacy_settings BOOLEAN NOT NULL DEFAULT false, -- e.g. hide mobile from public
    weekly_schedule JSONB NOT NULL DEFAULT '[
        {"day": "Monday", "is_working": true, "start_time": "10:00", "end_time": "20:00"},
        {"day": "Tuesday", "is_working": true, "start_time": "10:00", "end_time": "20:00"},
        {"day": "Wednesday", "is_working": true, "start_time": "10:00", "end_time": "20:00"},
        {"day": "Thursday", "is_working": true, "start_time": "10:00", "end_time": "20:00"},
        {"day": "Friday", "is_working": true, "start_time": "10:00", "end_time": "20:00"},
        {"day": "Saturday", "is_working": true, "start_time": "10:00", "end_time": "20:00"},
        {"day": "Sunday", "is_working": false, "start_time": "10:00", "end_time": "18:00"}
    ]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_salon_id ON public.staff(salon_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies for salon ownership isolation
CREATE POLICY "Public can view active staff of salons"
ON public.staff
FOR SELECT
USING (is_active = true);

CREATE POLICY "Salon owners can manage their salon staff"
ON public.staff
FOR ALL
USING (
    salon_id IN (
        SELECT id FROM public.shops WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    salon_id IN (
        SELECT id FROM public.shops WHERE owner_id = auth.uid()
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
