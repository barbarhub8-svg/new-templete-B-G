-- Supabase Migration: Create Staff Management Table and Policies
-- Description: Creates the staff table with profile details, app access roles, commission %, status, privacy settings, schedule, specializations, and RLS policies.

-- 1. Create staff table if not exists
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT NOT NULL, -- references shops(id) or salons(id)
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    primary_role TEXT NOT NULL DEFAULT 'Senior Stylist',
    app_access_role TEXT NOT NULL DEFAULT 'Service Provider (Assigned)',
    mobile_number TEXT NOT NULL,
    hide_mobile_from_public BOOLEAN NOT NULL DEFAULT false,
    commission_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    status TEXT NOT NULL DEFAULT 'Available', -- Available, Busy, On Leave, Unavailable
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_service_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
    schedule JSONB NOT NULL DEFAULT '[
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

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_shop_id ON public.staff(shop_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON public.staff(is_active);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow public read access to active staff of approved/active shops
CREATE POLICY "Public can view active staff of shops"
ON public.staff
FOR SELECT
USING (is_active = true);

-- Allow salon owners to manage (SELECT, INSERT, UPDATE, DELETE) their own shop's staff
CREATE POLICY "Salon owners can manage their shop staff"
ON public.staff
FOR ALL
USING (
    shop_id IN (
        SELECT id FROM public.shops WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    shop_id IN (
        SELECT id FROM public.shops WHERE owner_id = auth.uid()
    )
);

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_staff_updated_at
    BEFORE UPDATE ON public.staff
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
