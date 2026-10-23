import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Loader2, Eye, EyeOff, Save, X } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { useAuthStore } from '../../stores/authStore';
import { getShopByOwnerId, getShopServices, addService, updateService, deleteService } from '../../lib/api';

export default function OwnerServices() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [shop, setShop] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Add/Edit form fields
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDuration, setFormDuration] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  async function loadData() {
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
      
      // Load services
      const servicesData = await getShopServices(shopData.id);
      // Include inactive services for owner to manage
      const { data: allServices } = await (await import('../../lib/supabase')).supabase
        .from('services')
        .select('*')
        .eq('shop_id', shopData.id)
        .order('created_at', { ascending: false });
      
      setServices(allServices || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load services',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName('');
    setFormPrice('');
    setFormDuration('');
    setIsAdding(false);
    setEditingId(null);
  }

  function startEdit(service: any) {
    setFormName(service.name);
    setFormPrice(service.price.toString());
    setFormDuration(service.duration_minutes.toString());
    setEditingId(service.id);
    setIsAdding(false);
  }

  async function handleSave() {
    if (!shop?.id) return;
    
    if (!formName || !formPrice || !formDuration) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const price = parseInt(formPrice);
    const duration = parseInt(formDuration);

    if (price <= 0 || duration <= 0) {
      toast({
        title: 'Invalid Values',
        description: 'Price and duration must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      if (editingId) {
        // Update existing service
        await updateService(editingId, {
          name: formName,
          price,
          duration_minutes: duration,
        });
        
        toast({
          title: 'Service Updated',
          description: 'Service has been updated successfully',
        });
      } else {
        // Add new service
        await addService({
          shop_id: shop.id,
          name: formName,
          price,
          duration_minutes: duration,
        });
        
        toast({
          title: 'Service Added',
          description: 'New service has been added',
        });
      }

      resetForm();
      await loadData();
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save service',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleVisibility(serviceId: string, currentStatus: boolean) {
    try {
      await updateService(serviceId, {
        is_active: !currentStatus,
      });
      
      toast({
        title: currentStatus ? 'Service Hidden' : 'Service Visible',
        description: currentStatus 
          ? 'Service is now hidden from customers' 
          : 'Service is now visible to customers',
      });
      
      await loadData();
    } catch (error: any) {
      console.error('Error toggling service:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update service',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(serviceId: string, serviceName: string) {
    if (!confirm(`Are you sure you want to delete "${serviceName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteService(serviceId);
      
      toast({
        title: 'Service Deleted',
        description: 'Service has been removed',
      });
      
      await loadData();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete service',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Loading services...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-semibold mb-2">No Shop Found</p>
        <p className="text-muted-foreground">Please register your shop first</p>
      </div>
    );
  }

  const activeServices = services.filter(s => s.is_active);
  const hiddenServices = services.filter(s => !s.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Services Management</h1>
          <p className="text-muted-foreground">
            Add, edit, or remove services offered at {shop.name}
          </p>
        </div>
        {!isAdding && !editingId && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">
            {editingId ? 'Edit Service' : 'Add New Service'}
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="serviceName">Service Name *</Label>
              <Input
                id="serviceName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Hair Cut"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                min="1"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="e.g., 250"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="5"
                step="5"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                placeholder="e.g., 30"
                className="mt-1"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingId ? 'Update Service' : 'Add Service'}
            </Button>
            <Button variant="outline" onClick={resetForm} disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Active Services */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">
          Active Services ({activeServices.length})
        </h3>
        
        {activeServices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active services yet</p>
            <p className="text-sm">Add your first service to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{service.name}</p>
                    <Badge variant="default" className="text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Visible
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>₹{service.price}</span>
                    <span>•</span>
                    <span>{service.duration_minutes} mins</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVisibility(service.id, service.is_active)}
                  >
                    <EyeOff className="w-3 h-3 mr-1" />
                    Hide
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(service)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(service.id, service.name)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Hidden Services */}
      {hiddenServices.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 text-muted-foreground">
            Hidden Services ({hiddenServices.length})
          </h3>
          
          <div className="space-y-3">
            {hiddenServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg opacity-60"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{service.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      <EyeOff className="w-3 h-3 mr-1" />
                      Hidden
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>₹{service.price}</span>
                    <span>•</span>
                    <span>{service.duration_minutes} mins</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVisibility(service.id, service.is_active)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Show
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(service)}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(service.id, service.name)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info Box */}
      <Card className="p-6 bg-muted/50">
        <h4 className="font-semibold mb-2">💡 Service Management Tips</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Active services</strong> are visible to customers on your shop page</li>
          <li>• <strong>Hidden services</strong> are temporarily disabled but can be re-enabled anytime</li>
          <li>• Customers can select services during booking and see total price</li>
          <li>• Duration affects available time slots for booking</li>
          <li>• You cannot edit booking logic, pricing calculations, or platform rules</li>
        </ul>
      </Card>
    </div>
  );
}
