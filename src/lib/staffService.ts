import { supabase, uploadFile } from './supabase';
import { StaffMember } from '../types';

/**
 * Staff Service Module
 * Handles all CRUD operations for the staff table and storage photo uploads.
 */

/**
 * Upload a staff member's profile photo to Supabase storage bucket 'avatars'
 */
export async function uploadStaffPhoto(shopId: string, file: File): Promise<string> {
  const filename = `staff-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const path = `${shopId}/${filename}`;
  return await uploadFile('avatars', path, file);
}

/**
 * Get all staff members for a specific shop
 */
export async function getShopStaff(shopId: string, onlyActive = true): Promise<StaffMember[]> {
  try {
    let query = supabase
      .from('staff')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as StaffMember[];
  } catch (err) {
    console.warn('getShopStaff error:', err);
    return [];
  }
}

/**
 * Get a single staff member by ID
 */
export async function getStaffById(staffId: string): Promise<StaffMember | null> {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .single();

    if (error) throw error;
    return data as StaffMember;
  } catch (err) {
    console.warn('getStaffById error:', err);
    return null;
  }
}

/**
 * Create a new staff member record in Supabase
 */
export async function createStaffMember(staffData: {
  shop_id: string;
  full_name: string;
  avatar_url?: string | null;
  primary_role: any;
  app_access_role: any;
  mobile_number: string;
  hide_mobile_from_public: boolean;
  commission_percentage: number;
  status: any;
  is_active: boolean;
  assigned_service_ids: string[];
  specializations: string[];
  schedule: any[];
}): Promise<StaffMember> {
  const { data, error } = await supabase
    .from('staff')
    .insert(staffData)
    .select()
    .single();

  if (error) throw error;
  return data as StaffMember;
}

/**
 * Update an existing staff member record
 */
export async function updateStaffMember(
  staffId: string,
  updates: Partial<StaffMember>
): Promise<StaffMember> {
  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', staffId)
    .select()
    .single();

  if (error) throw error;
  return data as StaffMember;
}

/**
 * Deactivate a staff member (soft delete / status update)
 */
export async function deactivateStaffMember(staffId: string): Promise<void> {
  const { error } = await supabase
    .from('staff')
    .update({ is_active: false, status: 'Unavailable' })
    .eq('id', staffId);

  if (error) throw error;
}

/**
 * Reactivate a staff member
 */
export async function reactivateStaffMember(staffId: string): Promise<void> {
  const { error } = await supabase
    .from('staff')
    .update({ is_active: true, status: 'Available' })
    .eq('id', staffId);

  if (error) throw error;
}

/**
 * Permanently delete a staff member record
 */
export async function deleteStaffMember(staffId: string): Promise<void> {
  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', staffId);

  if (error) throw error;
}
