import { useState, useEffect } from 'react';
import { Store, MapPin, Clock, Home, Star, TrendingUp, Edit2, Save, X, Upload, Loader2, Trash2, Video } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { useAuthStore } from '../../stores/authStore';
import { getShopByOwnerId, updateShop, addShopMedia, deleteShopMedia } from '../../lib/api';
import { supabase } from '../../lib/supabase';

export default function OwnerProfile() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editAbout, setEditAbout] = useState('');
  const [editYearsOfExperience, setEditYearsOfExperience] = useState('0');
  const [editSpeciality, setEditSpeciality] = useState('');
  const [editContactNumber, setEditContactNumber] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editOpeningTime, setEditOpeningTime] = useState('');
  const [editClosingTime, setEditClosingTime] = useState('');
  const [editWeeklyOff, setEditWeeklyOff] = useState('Monday');
  const [editHomeServiceAvailable, setEditHomeServiceAvailable] = useState(false);
  const [editHomeServiceCharge, setEditHomeServiceCharge] = useState('0');
  const [editServiceRadius, setEditServiceRadius] = useState('0');

  useEffect(() => {
    if (user?.id) {
      loadShopData();
    }
  }, [user?.id]);

  async function loadShopData() {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const shopData = await getShopByOwnerId(user.id);
      
      if (!shopData) {
        toast({
          title: 'No Shop Found',
          description: 'Please register your shop first',
          variant: 'destructive',
        });
        return;
      }
      
      setShop(shopData);
      initializeEditFields(shopData);
    } catch (error: any) {
      console.error('Error loading shop:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load shop data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function initializeEditFields(shopData: any) {
    setEditName(shopData.name || '');
    setEditTagline(shopData.tagline || '');
    setEditAbout(shopData.about_description || '');
    setEditYearsOfExperience(shopData.years_of_experience?.toString() || '0');
    setEditSpeciality(shopData.speciality || '');
    setEditContactNumber(shopData.contact_number || '');
    setEditAddress(shopData.address || '');
    setEditCity(shopData.city || '');
    setEditOpeningTime(shopData.opening_time || '09:00');
    setEditClosingTime(shopData.closing_time || '21:00');
    setEditWeeklyOff(shopData.weekly_off || 'Monday');
    setEditHomeServiceAvailable(shopData.home_service_available || false);
    setEditHomeServiceCharge(shopData.home_service_charge?.toString() || '0');
    setEditServiceRadius(shopData.service_radius_km?.toString() || '0');
  }

  async function handleSave() {
    if (!shop?.id) return;
    
    try {
      setSaving(true);
      
      await updateShop(shop.id, {
        name: editName,
        tagline: editTagline,
        about_description: editAbout,
        years_of_experience: parseInt(editYearsOfExperience) || 0,
        speciality: editSpeciality,
        contact_number: editContactNumber,
        address: editAddress,
        city: editCity,
        opening_time: editOpeningTime,
        closing_time: editClosingTime,
        weekly_off: editWeeklyOff,
        home_service_available: editHomeServiceAvailable,
        home_service_charge: parseInt(editHomeServiceCharge) || 0,
        service_radius_km: parseInt(editServiceRadius) || 0,
      });

      toast({
        title: 'Shop Updated',
        description: 'Your shop details have been saved successfully',
      });

      setIsEditing(false);
      await loadShopData();
    } catch (error: any) {
      console.error('Error saving shop:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (shop) {
      initializeEditFields(shop);
    }
    setIsEditing(false);
  }

  async function handleVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || !shop?.id) return;

    const videos = shop.shop_media?.filter((m: any) => m.media_type === 'video') || [];
    if (videos.length >= 1) {
      toast({
        title: 'Limit Reached',
        description: 'Maximum 1 video allowed',
        variant: 'destructive',
      });
      return;
    }

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Video must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${shop.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shop-media')
        .getPublicUrl(fileName);

      await addShopMedia({
        shop_id: shop.id,
        media_type: 'video',
        media_url: publicUrl,
        display_order: 1,
      });

      toast({
        title: 'Video Uploaded',
        description: 'Your video has been added successfully',
      });

      await loadShopData();
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload video',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || !shop?.id) return;

    const photos = shop.shop_media?.filter((m: any) => m.media_type === 'photo') || [];
    if (photos.length >= 5) {
      toast({
        title: 'Limit Reached',
        description: 'Maximum 5 photos allowed',
        variant: 'destructive',
      });
      return;
    }

    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Photo must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${shop.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('shop-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('shop-media')
        .getPublicUrl(fileName);

      await addShopMedia({
        shop_id: shop.id,
        media_type: 'photo',
        media_url: publicUrl,
        display_order: photos.length + 1,
      });

      toast({
        title: 'Photo Uploaded',
        description: 'Your photo has been added successfully',
      });

      await loadShopData();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteMedia(mediaId: string, mediaType: string) {
    if (!confirm(`Are you sure you want to delete this ${mediaType}?`)) return;

    try {
      await deleteShopMedia(mediaId);
      toast({
        title: `${mediaType === 'photo' ? 'Photo' : 'Video'} Deleted`,
        description: `${mediaType === 'photo' ? 'Photo' : 'Video'} has been removed`,
      });
      await loadShopData();
    } catch (error: any) {
      console.error(`Error deleting ${mediaType}:`, error);
      toast({
        title: 'Error',
        description: error.message || `Failed to delete ${mediaType}`,
        variant: 'destructive',
      });
    }
  }

  async function handleReorderMedia(mediaId: string, direction: 'up' | 'down') {
    const photos = shop.shop_media?.filter((m: any) => m.media_type === 'photo') || [];
    const currentIndex = photos.findIndex((m: any) => m.id === mediaId);
    
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === photos.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    try {
      // Swap display_order values in database
      const currentPhoto = photos[currentIndex];
      const swapPhoto = photos[newIndex];
      
      const { error: error1 } = await supabase
        .from('shop_media')
        .update({ display_order: swapPhoto.display_order })
        .eq('id', currentPhoto.id);
      
      if (error1) throw error1;
      
      const { error: error2 } = await supabase
        .from('shop_media')
        .update({ display_order: currentPhoto.display_order })
        .eq('id', swapPhoto.id);
      
      if (error2) throw error2;
      
      toast({
        title: 'Photo Reordered',
        description: 'Photo order has been updated',
      });
      
      await loadShopData();
    } catch (error: any) {
      console.error('Error reordering media:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder media',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Loading shop data...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-12">
        <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Shop Registered</h3>
        <p className="text-muted-foreground">Please register your shop first</p>
      </div>
    );
  }

  const photos = shop.shop_media?.filter((m: any) => m.media_type === 'photo') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Shop Profile</h1>
          <p className="text-muted-foreground">Manage your shop information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Shop Details
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Shop Header */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
            {shop.name?.charAt(0) || 'S'}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="shopName">Shop Name *</Label>
                  <Input
                    id="shopName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tagline">Tagline (Short Description)</Label>
                  <Input
                    id="tagline"
                    value={editTagline}
                    onChange={(e) => setEditTagline(e.target.value)}
                    placeholder="e.g., Premium Grooming Experience"
                    className="mt-1"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{editTagline.length}/100 characters</p>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1">{shop.name}</h2>
                {shop.tagline && (
                  <p className="text-muted-foreground mb-2">{shop.tagline}</p>
                )}
              </>
            )}
            <Badge variant={shop.status === 'approved' ? 'default' : 'secondary'} className="mt-2">
              <Store className="w-3 h-3 mr-1" />
              {shop.status === 'approved' ? 'Approved Shop' : 'Pending Approval'}
            </Badge>
          </div>
        </div>

        {/* Shop Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-2xl font-bold">{shop.average_rating || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">{shop.total_reviews || 0} Reviews</p>
          </div>
          <div className="text-center border-x border-border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{shop.total_bookings || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Bookings</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <span className="text-2xl font-bold text-warning">{shop.pending_bookings || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>
      </Card>

      {/* About Section */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">About Shop</h3>
        
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="about">Shop Description</Label>
              <Textarea
                id="about"
                value={editAbout}
                onChange={(e) => setEditAbout(e.target.value)}
                placeholder="Tell customers about your shop, history, and what makes you unique..."
                rows={4}
                maxLength={500}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">{editAbout.length}/500 characters</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="100"
                  value={editYearsOfExperience}
                  onChange={(e) => setEditYearsOfExperience(e.target.value)}
                  placeholder="e.g., 15"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="speciality">Speciality</Label>
                <Input
                  id="speciality"
                  value={editSpeciality}
                  onChange={(e) => setEditSpeciality(e.target.value)}
                  placeholder="e.g., Beard Styling Expert"
                  maxLength={100}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {shop.about_description && (
              <p className="text-muted-foreground whitespace-pre-wrap">{shop.about_description}</p>
            )}
            
            <div className="flex flex-wrap gap-4 pt-2">
              {shop.years_of_experience > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{shop.years_of_experience} Years</p>
                    <p className="text-xs text-muted-foreground">Experience</p>
                  </div>
                </div>
              )}
              
              {shop.speciality && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{shop.speciality}</p>
                    <p className="text-xs text-muted-foreground">Speciality</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Shop Details */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Shop Information</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium mb-2">Contact Number</p>
              {isEditing ? (
                <Input
                  value={editContactNumber}
                  onChange={(e) => setEditContactNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  type="tel"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{shop.contact_number || 'Not provided'}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium mb-2">Address</p>
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Shop address with landmark"
                  />
                  <Input
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="City"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{shop.address}, {shop.city}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium mb-2">Working Hours</p>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="openingTime" className="text-xs">Opening Time</Label>
                      <Input
                        id="openingTime"
                        type="time"
                        value={editOpeningTime}
                        onChange={(e) => setEditOpeningTime(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="closingTime" className="text-xs">Closing Time</Label>
                      <Input
                        id="closingTime"
                        type="time"
                        value={editClosingTime}
                        onChange={(e) => setEditClosingTime(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="weeklyOff" className="text-xs">Weekly Off</Label>
                    <select
                      id="weeklyOff"
                      value={editWeeklyOff}
                      onChange={(e) => setEditWeeklyOff(e.target.value)}
                      className="w-full mt-1 h-9 border border-input bg-background rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {shop.opening_time} - {shop.closing_time}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Weekly Off: {shop.weekly_off}</p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Home className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium mb-2">Home Service</p>
              {isEditing && (
                <div className="mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editHomeServiceAvailable}
                      onChange={(e) => setEditHomeServiceAvailable(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Offer Home Service</span>
                  </label>
                </div>
              )}
              {(shop.home_service_available || editHomeServiceAvailable) && (
                <>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="homeCharge" className="text-xs">Extra Charge (₹)</Label>
                        <Input
                          id="homeCharge"
                          type="number"
                          value={editHomeServiceCharge}
                          onChange={(e) => setEditHomeServiceCharge(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="radius" className="text-xs">Service Radius (km)</Label>
                        <Input
                          id="radius"
                          type="number"
                          value={editServiceRadius}
                          onChange={(e) => setEditServiceRadius(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Available • Extra charge: ₹{shop.home_service_charge}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Service radius: {shop.service_radius_km} km
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Photo Gallery */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Shop Photos ({photos.length}/5)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((media: any, index: number) => (
            <div key={media.id} className="relative aspect-video rounded-lg overflow-hidden bg-muted group">
              <img
                src={media.media_url}
                alt={`Shop photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <div className="flex gap-2">
                    {index > 0 && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReorderMedia(media.id, 'up');
                        }}
                      >
                        ↑
                      </Button>
                    )}
                    {index < photos.length - 1 && (
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReorderMedia(media.id, 'down');
                        }}
                      >
                        ↓
                      </Button>
                    )}
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMedia(media.id, 'photo');
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>
        {photos.length < 5 && (
          <div className="mt-4">
            <input
              type="file"
              id="photo-upload"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => document.getElementById('photo-upload')?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Add Shop Photo
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Maximum 5 photos allowed • Each photo max 2MB • Formats: JPG, PNG, WebP
        </p>
      </Card>

      {/* Video Section */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Video className="w-5 h-5" />
          Shop Video Tour ({shop.shop_media?.filter((m: any) => m.media_type === 'video').length || 0}/1)
        </h3>
        
        {shop.shop_media?.find((m: any) => m.media_type === 'video') ? (
          <div className="space-y-4">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
              <video
                src={shop.shop_media.find((m: any) => m.media_type === 'video').media_url}
                controls
                className="w-full h-full"
              >
                Your browser does not support video playback.
              </video>
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteMedia(shop.shop_media.find((m: any) => m.media_type === 'video').id, 'video')}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Remove Video
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No video uploaded</p>
              </div>
            </div>
            
            <div>
              <input
                type="file"
                id="video-upload"
                accept="video/mp4,video/webm"
                className="hidden"
                onChange={handleVideoUpload}
                disabled={uploading}
              />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => document.getElementById('video-upload')?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Upload Shop Video
              </Button>
            </div>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground mt-4">
          Maximum 1 video allowed • Max size 10MB • Formats: MP4, WebM • Showcase your shop interior and services
        </p>
      </Card>

      {/* Services */}
      {shop.services && shop.services.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Services Offered ({shop.services.length})</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {shop.services.map((service: any) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.duration_minutes} mins</p>
                </div>
                <p className="font-semibold text-primary">₹{service.price}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              💡 To add, edit, or manage service visibility, go to <strong>Services</strong> tab from the dashboard
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
