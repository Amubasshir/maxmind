
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidEmail, isValidIP } from '@/lib/validators';
import type { FormData } from '@/types/minfraud';
import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface InputFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
  error?: string;
}

export default function InputForm({
  onSubmit,
  isLoading,
  error,
}: InputFormProps) {
  // Form state
  const [formData, setFormData] = useState<FormData>({});

  // "Same as billing" checkbox state
  const [sameAsBilling, setSameAsBilling] = useState(false);

  // Billing values (for "same as billing" logic)
  const [billingValues, setBillingValues] = useState<Partial<FormData>>({});

  // Shipping form state
  const [shippingFormState, setShippingFormState] = useState<Partial<FormData>>(
    {},
  );

  // Field errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Airtable integration state
  const [airtableData, setAirtableData] = useState<any[]>([]);
  const [isAirtableLoading, setIsAirtableLoading] = useState(false);
  const [airtableError, setAirtableError] = useState<string | null>(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  /**
   * Fetch Airtable data with cache-busting and error handling
   */
  const fetchAirtable = useCallback(async () => {
    try {
      setIsAirtableLoading(true);
      setAirtableError(null);
      
      // Cache-busting query parameter
      const res = await fetch(`/api/airtable?t=${Date.now()}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.records && Array.isArray(data.records)) {
        setAirtableData(data.records);
        console.log(`✅ Loaded ${data.count || data.records.length} customers from Airtable`);
      } else {
        throw new Error('Invalid response format from Airtable API');
      }
    } catch (error) {
      console.error('❌ Failed to fetch Airtable data:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load customers';
      setAirtableError(errorMessage);
      
      // Optional: Show toast notification here if you have a toast system
      // toast.error(errorMessage);
    } finally {
      setIsAirtableLoading(false);
    }
  }, []);

  // Initial fetch on component mount
  useEffect(() => {
    fetchAirtable();
  }, [fetchAirtable]);

  // Handle input change
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // If this is a billing field and "same as billing" is checked,
    // update shipping fields in real-time
    if (field.startsWith('billing_') && sameAsBilling) {
      const shippingField = field.replace('billing_', 'shipping_');
      setShippingFormState((prev) => ({ ...prev, [shippingField]: value }));
    }

    // Update billing values separately for "same as billing" logic
    if (field.startsWith('billing_')) {
      setBillingValues((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Handle "same as billing" checkbox change
  const handleSameAsBillingChange = (checked: boolean) => {
    setSameAsBilling(checked);

    if (checked) {
      // When checked, populate shipping fields with current billing values
      const newShippingValues: Partial<FormData> = {};
      Object.keys(billingValues).forEach((key) => {
        if (key.startsWith('billing_')) {
          const shippingKey = key.replace('billing_', 'shipping_');
          newShippingValues[shippingKey as keyof FormData] =
            billingValues[key as keyof FormData];
        }
      });
      setShippingFormState(newShippingValues);
    }
    // When unchecked, shipping fields remain with current values but become editable
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    // Validate email if provided
    if (formData.email && formData.email.trim()) {
      if (!isValidEmail(formData.email)) {
        errors.email = 'Invalid email format';
        isValid = false;
      }
    }

    // Validate IP if provided
    if (formData.ip_address && formData.ip_address.trim()) {
      if (!isValidIP(formData.ip_address)) {
        errors.ip_address = 'Invalid IP address format';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if at least one field is filled
    const hasAnyField = Object.values(formData).some(
      (value) => value && value.trim().length > 0,
    );

    if (!hasAnyField) {
      setFieldErrors({ _form: 'Enter at least one field to analyze' });
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    const resolvedShippingData: Partial<FormData> = sameAsBilling
      ? {
          shipping_first_name: formData.billing_first_name,
          shipping_last_name: formData.billing_last_name,
          shipping_address1: formData.billing_address1,
          shipping_address2: formData.billing_address2,
          shipping_city: formData.billing_city,
          shipping_region: formData.billing_region,
          shipping_postal: formData.billing_postal,
          shipping_country: formData.billing_country,
          shipping_phone: formData.billing_phone || formData.phone,
        }
      : shippingFormState;

    // Resolve shipping values based on checkbox state
    const finalData: FormData = {
      ...formData,
      ...resolvedShippingData,
    };

    onSubmit(finalData);
  };

  // Handle clear form
  const handleClearForm = () => {
    setFormData({});
    setBillingValues({});
    setShippingFormState({});
    setSameAsBilling(false);
    setFieldErrors({});
    setSelectedCustomerId('');
  };

  // Get shipping field value (from billing if checkbox is checked, otherwise from shipping state)
  const getShippingValue = (field: string): string => {
    const key = `shipping_${field}` as keyof FormData;
    if (sameAsBilling) {
      const billingKey = `billing_${field}` as keyof FormData;
      return (formData[billingKey] || '') as string;
    }
    return (shippingFormState[key] || '') as string;
  };

  // Helper: Map country names to ISO codes
  const mapCountry = (c?: string): string => {
    if (!c) return '';
    if (c.length === 2) return c.toUpperCase();
    const cl = c.toLowerCase().trim();
    if (cl === 'united states' || cl === 'usa') return 'US';
    if (cl === 'united kingdom' || cl === 'uk') return 'GB';
    if (cl === 'canada') return 'CA';
    if (cl === 'australia') return 'AU';
    return c.substring(0, 2).toUpperCase();
  };

  // Helper: Auto-fill form from Airtable record
  const autoFillFromRecord = (record: any) => {
    const fields = record.fields || {};
    const matchShipping = fields['Billing matches Shipping'] === true;
    
    setSameAsBilling(matchShipping);

    const newBillingValues: Partial<FormData> = {
      billing_first_name: fields['Billing First Name'] || '',
      billing_last_name: fields['Billing Last Name'] || '',
      billing_address1: fields['Billing Address 1'] || '',
      billing_address2: fields['Billing Address 2'] || '',
      billing_city: fields['Billing City'] || '',
      billing_region: fields['Billing Province'] || '',
      billing_postal: fields['Billing ZIP'] || '',
      billing_country: mapCountry(fields['Billing Country']),
      billing_phone: fields['Billing Phone'] || fields['Phone'] || '',
    };

    setFormData(prev => ({
      ...prev,
      full_name: fields['Customer Name'] || '',
      email: fields['Customer Email'] || '',
      phone: fields['Phone'] || fields['Billing Phone'] || '',
      ip_address: fields['Browser IP'] || '',
      ...newBillingValues,
    }));

    setBillingValues(newBillingValues);

    if (!matchShipping) {
      setShippingFormState({
        shipping_first_name: fields['Shipping First Name'] || '',
        shipping_last_name: fields['Shipping Last Name'] || '',
        shipping_address1: fields['Shipping Address 1'] || '',
        shipping_address2: fields['Shipping Address 2'] || '',
        shipping_city: fields['Shipping City'] || '',
        shipping_region: fields['Shipping Province'] || fields['Shipping Provence'] || '',
        shipping_postal: fields['Shipping ZIP'] || '',
        shipping_country: mapCountry(fields['Shipping Country']),
        shipping_phone: fields['Shipping Phone'] || fields['Phone'] || '',
      });
    } else {
      // Map shipping to billing to match visual state since checkbox is checked
      const newShippingValues: Partial<FormData> = {};
      Object.keys(newBillingValues).forEach((key) => {
        if (key.startsWith('billing_')) {
          const shippingKey = key.replace('billing_', 'shipping_');
          newShippingValues[shippingKey as keyof FormData] =
            newBillingValues[key as keyof FormData];
        }
      });
      setShippingFormState(newShippingValues);
    }
    
    setFieldErrors({});
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Error */}
        {fieldErrors._form && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {fieldErrors._form}
          </div>
        )}

        {/* Airtable Error */}
        {airtableError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded text-sm">
            ⚠️ {airtableError}
            <button
              type="button"
              onClick={fetchAirtable}
              className="ml-2 underline hover:text-amber-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* Airtable Customers Dropdown */}
        <div className="space-y-4 pb-6 mb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Load from Airtable</h3>
            {airtableData.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {airtableData.length} customer{airtableData.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="flex flex-col space-y-2">
            <Label htmlFor="customer-select">Select Customer</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button 
                  id="customer-select"
                  variant="outline" 
                  className="w-full justify-between" 
                  disabled={isAirtableLoading || airtableData.length === 0}
                  role="combobox"
                  aria-expanded={openCombobox}
                >
                  <span className="truncate">
                    {isAirtableLoading
                      ? 'Loading customers...'
                      : airtableError
                      ? 'Error loading customers'
                      : selectedCustomerId
                      ? airtableData.find((record) => record.id === selectedCustomerId)?.fields?.['Case Name'] ||
                        airtableData.find((record) => record.id === selectedCustomerId)?.fields?.['Customer Email'] || 
                        'Selected Customer'
                      : airtableData.length === 0
                      ? 'No customers available'
                      : 'Search and select a customer...'}
                  </span>
                  {isAirtableLoading ? (
                    <RefreshCw className="ml-2 h-4 w-4 shrink-0 opacity-50 animate-spin" />
                  ) : (
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[--radix-popover-trigger-width] p-0 bg-white dark:bg-gray-900" 
                align="start"
              >
                <Command>
                  <CommandInput 
                    placeholder="Search customer (Name, Email, ID)..." 
                    disabled={isAirtableLoading}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {isAirtableLoading ? (
                        'Loading...'
                      ) : airtableError ? (
                        <span>
                          Failed to load.{' '}
                          <button 
                            type="button"
                            onClick={fetchAirtable}
                            className="text-blue-500 hover:underline"
                          >
                            Retry
                          </button>
                        </span>
                      ) : airtableData.length === 0 ? (
                        <span>
                          No customers found.{' '}
                          <button 
                            type="button"
                            onClick={fetchAirtable}
                            className="text-blue-500 hover:underline"
                          >
                            Refresh
                          </button>
                        </span>
                      ) : (
                        <span className="block">
                          No customer found.
                          <span className="block mt-1 text-xs text-muted-foreground">
                            Try adjusting your search or{' '}
                            <button 
                              type="button"
                              onClick={fetchAirtable}
                              className="text-blue-500 hover:underline"
                            >
                              refresh
                            </button>
                          </span>
                        </span>
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {airtableData.map((record) => {
                        const fields = record.fields || {};
                        const name = fields['Case Name'] || fields['Name'] || record.id || 'Unnamed';
                        const email = fields['Customer Email'] || fields['Email'] || '';
                        const searchValue = `${name} ${email} ${record.id}`.toLowerCase();
                        
                        return (
                          <CommandItem
                            key={record.id}
                            value={searchValue}
                            onSelect={() => {
                              const isSelected = record.id === selectedCustomerId;
                              setSelectedCustomerId(isSelected ? '' : record.id);
                              setOpenCombobox(false);

                              if (!isSelected) {
                                autoFillFromRecord(record);
                              }
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCustomerId === record.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium truncate">{name}</span>
                              {email && (
                                <span className="text-xs text-muted-foreground truncate">{email}</span>
                              )}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {/* Refresh Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={fetchAirtable}
              disabled={isAirtableLoading}
              className="w-fit h-7 text-xs gap-1 ml-auto -mt-1"
            >
              <RefreshCw className={cn("h-3 w-3", isAirtableLoading && "animate-spin")} />
              {isAirtableLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Customer Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Customer Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('full_name', e.target.value)
                }
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('email', e.target.value)
                }
                placeholder="john@example.com"
                className={fieldErrors.email ? 'border-red-500' : ''}
              />
              {fieldErrors.email && (
                <p className="text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('phone', e.target.value)
                }
                placeholder="+1 555-123-4567"
              />
            </div>
          </div>
        </div>

        {/* Billing Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Billing Address</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billing_first_name">First Name</Label>
              <Input
                id="billing_first_name"
                value={formData.billing_first_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('billing_first_name', e.target.value)
                }
                placeholder="John"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_last_name">Last Name</Label>
              <Input
                id="billing_last_name"
                value={formData.billing_last_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('billing_last_name', e.target.value)
                }
                placeholder="Doe"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="billing_address1">Address Line 1</Label>
              <Input
                id="billing_address1"
                value={formData.billing_address1 || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('billing_address1', e.target.value)
                }
                placeholder="123 Main St"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="billing_address2">Address Line 2</Label>
              <Input
                id="billing_address2"
                value={formData.billing_address2 || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('billing_address2', e.target.value)
                }
                placeholder="Apt 4B"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_city">City</Label>
              <Input
                id="billing_city"
                value={formData.billing_city || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('billing_city', e.target.value)
                }
                placeholder="New York"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_region">State / Province / Region</Label>
              <Input
                id="billing_region"
                value={formData.billing_region || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('billing_region', e.target.value)
                }
                placeholder="NY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_postal">Postal Code / ZIP</Label>
              <Input
                id="billing_postal"
                value={formData.billing_postal || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('billing_postal', e.target.value)
                }
                placeholder="10000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_country">Country</Label>
              <Input
                id="billing_country"
                value={formData.billing_country || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('billing_country', e.target.value)
                }
                placeholder="US"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_phone">Phone (optional)</Label>
              <Input
                id="billing_phone"
                value={formData.billing_phone || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('billing_phone', e.target.value)
                }
                placeholder="+1 555-123-4567"
              />
            </div>
          </div>
        </div>

        {/* Shipping Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Shipping Address</h3>

          {/* Same as Billing Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="same_as_billing"
              checked={sameAsBilling}
              onCheckedChange={(checked: boolean) =>
                handleSameAsBillingChange(checked)
              }
            />
            <Label htmlFor="same_as_billing" className="cursor-pointer">
              Same as billing address
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shipping_first_name">First Name</Label>
              <Input
                id="shipping_first_name"
                value={getShippingValue('first_name')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!sameAsBilling) {
                    setShippingFormState((prev) => ({
                      ...prev,
                      shipping_first_name: e.target.value,
                    }));
                  }
                }}
                disabled={sameAsBilling}
                placeholder="John"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping_last_name">Last Name</Label>
              <Input
                id="shipping_last_name"
                value={getShippingValue('last_name')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!sameAsBilling) {
                    setShippingFormState((prev) => ({
                      ...prev,
                      shipping_last_name: e.target.value,
                    }));
                  }
                }}
                disabled={sameAsBilling}
                placeholder="Doe"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="shipping_address1">Address Line 1</Label>
              <Input
                id="shipping_address1"
                value={getShippingValue('address1')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!sameAsBilling) {
                    setShippingFormState((prev) => ({
                      ...prev,
                      shipping_address1: e.target.value,
                    }));
                  }
                }}
                disabled={sameAsBilling}
                placeholder="123 Main St"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="shipping_address2">Address Line 2</Label>
              <Input
                id="shipping_address2"
                value={getShippingValue('address2')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!sameAsBilling) {
                    setShippingFormState((prev) => ({
                      ...prev,
                      shipping_address2: e.target.value,
                    }));
                  }
                }}
                disabled={sameAsBilling}
                placeholder="Apt 4B"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping_city">City</Label>
              <Input
                id="shipping_city"
                value={getShippingValue('city')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!sameAsBilling) {
                    setShippingFormState((prev) => ({
                      ...prev,
                      shipping_city: e.target.value,
                    }));
                  }
                }}
                disabled={sameAsBilling}
                placeholder="New York"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping_region">State / Province / Region</Label>
              <Input
                id="shipping_region"
                value={getShippingValue('region')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!sameAsBilling) {
                    setShippingFormState((prev) => ({
                      ...prev,
                      shipping_region: e.target.value,
                    }));
                  }
                }}
                disabled={sameAsBilling}
                placeholder="NY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping_postal">Postal Code / ZIP</Label>
              <Input
                id="shipping_postal"
                value={getShippingValue('postal')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!sameAsBilling) {
                    setShippingFormState((prev) => ({
                      ...prev,
                      shipping_postal: e.target.value,
                    }));
                  }
                }}
                disabled={sameAsBilling}
                placeholder="10001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping_country">Country</Label>
              <Input
                id="shipping_country"
                value={getShippingValue('country')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!sameAsBilling) {
                    setShippingFormState((prev) => ({
                      ...prev,
                      shipping_country: e.target.value,
                    }));
                  }
                }}
                disabled={sameAsBilling}
                placeholder="US"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping_phone">Phone (optional)</Label>
              <Input
                id="shipping_phone"
                value={getShippingValue('phone')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (!sameAsBilling) {
                    setShippingFormState((prev) => ({
                      ...prev,
                      shipping_phone: e.target.value,
                    }));
                  }
                }}
                disabled={sameAsBilling}
                placeholder="+1 555-123-4567"
              />
            </div>
          </div>
        </div>

        {/* Device / Network Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Device / Network</h3>

          <div className="space-y-2">
            <Label htmlFor="ip_address" className="flex items-center gap-2">
              IP Address
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Recommended
              </span>
            </Label>
            <Input
              id="ip_address"
              value={formData.ip_address || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange('ip_address', e.target.value)
              }
              placeholder="192.168.1.1 or 2001:0db8:85a3:0000:0000:8a2e:0370:7334"
              className={fieldErrors.ip_address ? 'border-red-500' : ''}
            />
            {fieldErrors.ip_address && (
              <p className="text-sm text-red-600">{fieldErrors.ip_address}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-2">
          {/* Primary CTA */}
          <Button
            type="submit"
            disabled={isLoading}
            className="
              flex-1 relative overflow-hidden
              bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700
              hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 cursor-pointer
              text-white font-semibold tracking-wide
              shadow-lg shadow-blue-900/30
              border border-white/10
              backdrop-blur-xl
              transition-all duration-300
              hover:scale-[1.02] active:scale-[0.98]
            "
          >
            <span className="relative z-10">
              {isLoading ? 'Analyzing...' : 'Analyze Fraud Risk'}
            </span>

            {/* subtle glow effect */}
            <span
              className="
                absolute inset-0 opacity-0 hover:opacity-100
                bg-white/10 blur-xl transition duration-300
              "
            />
          </Button>

          {/* Secondary CTA */}
          <Button
            type="button"
            variant="ghost"
            onClick={handleClearForm}
            disabled={isLoading}
            className="
              text-gray-400 hover:text-white cursor-pointer
              border border-white/10
              hover:bg-white/5
              backdrop-blur-md
              transition-all duration-200
            "
          >
            Clear Form
          </Button>
        </div>
      </form>
    </Card>
  );
}








// 'use client';

// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { isValidEmail, isValidIP } from '@/lib/validators';
// import type { FormData } from '@/types/minfraud';
// import { useState, useEffect } from 'react';
// import { Check, ChevronsUpDown } from 'lucide-react';
// import { cn } from '@/lib/utils';
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from '@/components/ui/command';
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from '@/components/ui/popover';

// interface InputFormProps {
//   onSubmit: (data: FormData) => void;
//   isLoading: boolean;
//   error?: string;
// }

// export default function InputForm({
//   onSubmit,
//   isLoading,
//   error,
// }: InputFormProps) {
//   // Form state
//   const [formData, setFormData] = useState<FormData>({});

//   // "Same as billing" checkbox state
//   const [sameAsBilling, setSameAsBilling] = useState(false);

//   // Billing values (for "same as billing" logic)
//   const [billingValues, setBillingValues] = useState<Partial<FormData>>({});

//   // Shipping form state
//   const [shippingFormState, setShippingFormState] = useState<Partial<FormData>>(
//     {},
//   );

//   // Field errors
//   const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

//   // Airtable integration state
//   const [airtableData, setAirtableData] = useState<any[]>([]);
//   const [isAirtableLoading, setIsAirtableLoading] = useState(false);
//   const [openCombobox, setOpenCombobox] = useState(false);
//   const [selectedCustomerId, setSelectedCustomerId] = useState('');

//   // Fetch Airtable data
//   useEffect(() => {
//     const fetchAirtable = async () => {
//       try {
//         setIsAirtableLoading(true);
//         const res = await fetch('/api/airtable');
//         if (res.ok) {
//           const data = await res.json();
//           console.log("my records", data)
//           if (data.records) {
//             setAirtableData(data.records);
//           }
//         }
//       } catch (error) {
//         console.error('Failed to fetch Airtable data:', error);
//       } finally {
//         setIsAirtableLoading(false);
//       }
//     };
//     fetchAirtable();
//   }, []);

//   // Handle input change
//   const handleInputChange = (field: keyof FormData, value: string) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));

//     // Clear field error when user starts typing
//     if (fieldErrors[field]) {
//       setFieldErrors((prev) => {
//         const newErrors = { ...prev };
//         delete newErrors[field];
//         return newErrors;
//       });
//     }

//     // If this is a billing field and "same as billing" is checked,
//     // update shipping fields in real-time
//     if (field.startsWith('billing_') && sameAsBilling) {
//       const shippingField = field.replace('billing_', 'shipping_');
//       setShippingFormState((prev) => ({ ...prev, [shippingField]: value }));
//     }

//     // Update billing values separately for "same as billing" logic
//     if (field.startsWith('billing_')) {
//       setBillingValues((prev) => ({ ...prev, [field]: value }));
//     }
//   };

//   // Handle "same as billing" checkbox change
//   const handleSameAsBillingChange = (checked: boolean) => {
//     setSameAsBilling(checked);

//     if (checked) {
//       // When checked, populate shipping fields with current billing values
//       const newShippingValues: Partial<FormData> = {};
//       Object.keys(billingValues).forEach((key) => {
//         if (key.startsWith('billing_')) {
//           const shippingKey = key.replace('billing_', 'shipping_');
//           newShippingValues[shippingKey as keyof FormData] =
//             billingValues[key as keyof FormData];
//         }
//       });
//       setShippingFormState(newShippingValues);
//     }
//     // When unchecked, shipping fields remain with current values but become editable
//   };

//   // Validate form
//   const validateForm = (): boolean => {
//     const errors: Record<string, string> = {};
//     let isValid = true;

//     // Validate email if provided
//     if (formData.email && formData.email.trim()) {
//       if (!isValidEmail(formData.email)) {
//         errors.email = 'Invalid email format';
//         isValid = false;
//       }
//     }

//     // Validate IP if provided
//     if (formData.ip_address && formData.ip_address.trim()) {
//       if (!isValidIP(formData.ip_address)) {
//         errors.ip_address = 'Invalid IP address format';
//         isValid = false;
//       }
//     }

//     setFieldErrors(errors);
//     return isValid;
//   };

//   // Handle form submission
//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();

//     // Check if at least one field is filled
//     const hasAnyField = Object.values(formData).some(
//       (value) => value && value.trim().length > 0,
//     );

//     if (!hasAnyField) {
//       setFieldErrors({ _form: 'Enter at least one field to analyze' });
//       return;
//     }

//     // Validate form
//     if (!validateForm()) {
//       return;
//     }

//     const resolvedShippingData: Partial<FormData> = sameAsBilling
//       ? {
//           shipping_first_name: formData.billing_first_name,
//           shipping_last_name: formData.billing_last_name,
//           shipping_address1: formData.billing_address1,
//           shipping_address2: formData.billing_address2,
//           shipping_city: formData.billing_city,
//           shipping_region: formData.billing_region,
//           shipping_postal: formData.billing_postal,
//           shipping_country: formData.billing_country,
//           shipping_phone: formData.billing_phone || formData.phone,
//         }
//       : shippingFormState;

//     // Resolve shipping values based on checkbox state
//     const finalData: FormData = {
//       ...formData,
//       ...resolvedShippingData,
//     };

//     onSubmit(finalData);
//   };

//   // Handle clear form
//   const handleClearForm = () => {
//     setFormData({});
//     setBillingValues({});
//     setShippingFormState({});
//     setSameAsBilling(false);
//     setFieldErrors({});
//   };

//   // Get shipping field value (from billing if checkbox is checked, otherwise from shipping state)
//   const getShippingValue = (field: string): string => {
//     const key = `shipping_${field}` as keyof FormData;
//     if (sameAsBilling) {
//       const billingKey = `billing_${field}` as keyof FormData;
//       return (formData[billingKey] || '') as string;
//     }
//     return (shippingFormState[key] || '') as string;
//   };

//   return (
//     <Card className="p-6">
//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Form Error */}
//         {fieldErrors._form && (
//           <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
//             {fieldErrors._form}
//           </div>
//         )}

//         {/* Airtable Customers Dropdown */}
//         <div className="space-y-4 pb-6 mb-6 border-b border-gray-200 dark:border-gray-800">
//           <h3 className="text-lg font-semibold">Load from Airtable</h3>
//           <div className="flex flex-col space-y-2">
//             <Label>Select Customer</Label>
//             <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
//               <PopoverTrigger render={<Button variant="outline" className="w-full justify-between" disabled={isAirtableLoading} />}>
//                   {isAirtableLoading
//                     ? 'Loading customers...'
//                     : selectedCustomerId
//                     ? airtableData.find((record) => record.id === selectedCustomerId)?.fields?.['Case Name'] ||
//                       airtableData.find((record) => record.id === selectedCustomerId)?.fields?.['Customer Email'] || 'Selected Customer'
//                     : 'Search and select a customer...'}
//                   <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//               </PopoverTrigger>
//               <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white dark:bg-gray-900" align="start">
//                 <Command>
//                   <CommandInput placeholder="Search customer (Name, Email)..." />
//                   <CommandList>
//                     <CommandEmpty>No customer found.</CommandEmpty>
//                     <CommandGroup>
//                       {airtableData.map((record) => {
//                         const fields = record.fields || {};
//                         // Match Airtable data structure
//                         const name = fields['Case Name'] || fields['Name'] || record.id || 'Unnamed';
//                         const email = fields['Customer Email'] || fields['Email'] || '';
                        
//                         // We use the ID + Name + Email as Search string so people can search by Name or Email
//                         const searchValue = `${name} ${email} ${record.id}`;
                        
//                         return (
//                           <CommandItem
//                             key={record.id}
//                             value={searchValue}
//                             onSelect={() => {
//                               const isSelected = record.id === selectedCustomerId;
//                               setSelectedCustomerId(isSelected ? '' : record.id);
//                               setOpenCombobox(false);

//                               // Auto-fill logic
//                               if (!isSelected) {
//                                 const mapCountry = (c?: string) => {
//                                   if (!c) return '';
//                                   if (c.length === 2) return c.toUpperCase();
//                                   const cl = c.toLowerCase().trim();
//                                   if (cl === 'united states' || cl === 'usa') return 'US';
//                                   if (cl === 'united kingdom' || cl === 'uk') return 'GB';
//                                   if (cl === 'canada') return 'CA';
//                                   if (cl === 'australia') return 'AU';
//                                   return c.substring(0, 2).toUpperCase();
//                                 };

//                                 const matchShipping = fields['Billing matches Shipping'] === true;
//                                 setSameAsBilling(matchShipping);

//                                 const newBillingValues: Partial<FormData> = {
//                                   billing_first_name: fields['Billing First Name'] || '',
//                                   billing_last_name: fields['Billing Last Name'] || '',
//                                   billing_address1: fields['Billing Address 1'] || '',
//                                   billing_address2: fields['Billing Address 2'] || '',
//                                   billing_city: fields['Billing City'] || '',
//                                   billing_region: fields['Billing Province'] || '',
//                                   billing_postal: fields['Billing ZIP'] || '',
//                                   billing_country: mapCountry(fields['Billing Country']),
//                                   billing_phone: fields['Billing Phone'] || fields['Phone'] || '',
//                                 };

//                                 setFormData(prev => ({
//                                   ...prev,
//                                   full_name: fields['Customer Name'] || '',
//                                   email: fields['Customer Email'] || '',
//                                   phone: fields['Phone'] || fields['Billing Phone'] || '',
//                                   ip_address: fields['Browser IP'] || '',
//                                   ...newBillingValues,
//                                 }));

//                                 setBillingValues(newBillingValues);

//                                 if (!matchShipping) {
//                                   setShippingFormState({
//                                     shipping_first_name: fields['Shipping First Name'] || '',
//                                     shipping_last_name: fields['Shipping Last Name'] || '',
//                                     shipping_address1: fields['Shipping Address 1'] || '',
//                                     shipping_address2: fields['Shipping Address 2'] || '',
//                                     shipping_city: fields['Shipping City'] || '',
//                                     shipping_region: fields['Shipping Province'] || fields['Shipping Provence'] || '',
//                                     shipping_postal: fields['Shipping ZIP'] || '',
//                                     shipping_country: mapCountry(fields['Shipping Country']),
//                                     shipping_phone: fields['Shipping Phone'] || fields['Phone'] || '',
//                                   });
//                                 } else {
//                                   // Map shipping to billing to match visual state since checkbox is checked
//                                   const newShippingValues: Partial<FormData> = {};
//                                   Object.keys(newBillingValues).forEach((key) => {
//                                     if (key.startsWith('billing_')) {
//                                       const shippingKey = key.replace('billing_', 'shipping_');
//                                       newShippingValues[shippingKey as keyof FormData] =
//                                         newBillingValues[key as keyof FormData];
//                                     }
//                                   });
//                                   setShippingFormState(newShippingValues);
//                                 }
                                
//                                 setFieldErrors({});
//                               }
//                             }}
//                           >
//                             <Check
//                               className={cn(
//                                 "mr-2 h-4 w-4",
//                                 selectedCustomerId === record.id ? "opacity-100" : "opacity-0"
//                               )}
//                             />
//                             <div className="flex flex-col">
//                               <span className="font-medium">{name}</span>
//                             </div>
//                           </CommandItem>
//                         );
//                       })}
//                     </CommandGroup>
//                   </CommandList>
//                 </Command>
//               </PopoverContent>
//             </Popover>
//           </div>
//         </div>

//         {/* Customer Section */}
//         <div className="space-y-4">
//           <h3 className="text-lg font-semibold">Customer Information</h3>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="full_name">Full Name</Label>
//               <Input
//                 id="full_name"
//                 value={formData.full_name || ''}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   handleInputChange('full_name', e.target.value)
//                 }
//                 placeholder="John Doe"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="email">Email Address</Label>
//               <Input
//                 id="email"
//                 type="email"
//                 value={formData.email || ''}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   handleInputChange('email', e.target.value)
//                 }
//                 placeholder="john@example.com"
//                 className={fieldErrors.email ? 'border-red-500' : ''}
//               />
//               {fieldErrors.email && (
//                 <p className="text-sm text-red-600">{fieldErrors.email}</p>
//               )}
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="phone">Phone Number</Label>
//               <Input
//                 id="phone"
//                 value={formData.phone || ''}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   handleInputChange('phone', e.target.value)
//                 }
//                 placeholder="+1 555-123-4567"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Billing Address Section */}
//         <div className="space-y-4">
//           <h3 className="text-lg font-semibold">Billing Address</h3>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="billing_first_name">First Name</Label>
//               <Input
//                 id="billing_first_name"
//                 value={formData.billing_first_name || ''}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   handleInputChange('billing_first_name', e.target.value)
//                 }
//                 placeholder="John"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="billing_last_name">Last Name</Label>
//               <Input
//                 id="billing_last_name"
//                 value={formData.billing_last_name || ''}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   handleInputChange('billing_last_name', e.target.value)
//                 }
//                 placeholder="Doe"
//               />
//             </div>

//             <div className="space-y-2 md:col-span-2">
//               <Label htmlFor="billing_address1">Address Line 1</Label>
//               <Input
//                 id="billing_address1"
//                 value={formData.billing_address1 || ''}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   handleInputChange('billing_address1', e.target.value)
//                 }
//                 placeholder="123 Main St"
//               />
//             </div>

//             <div className="space-y-2 md:col-span-2">
//               <Label htmlFor="billing_address2">Address Line 2</Label>
//               <Input
//                 id="billing_address2"
//                 value={formData.billing_address2 || ''}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   handleInputChange('billing_address2', e.target.value)
//                 }
//                 placeholder="Apt 4B"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="billing_city">City</Label>
//               <Input
//                 id="billing_city"
//                 value={formData.billing_city || ''}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   handleInputChange('billing_city', e.target.value)
//                 }
//                 placeholder="New York"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="billing_region">State / Province / Region</Label>
//               <Input
//                 id="billing_region"
//                 value={formData.billing_region || ''}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   handleInputChange('billing_region', e.target.value)
//                 }
//                 placeholder="NY"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="billing_postal">Postal Code / ZIP</Label>
//               <Input
//                 id="billing_postal"
//                 value={formData.billing_postal || ''}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   handleInputChange('billing_postal', e.target.value)
//                 }
//                 placeholder="10001"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="billing_country">Country</Label>
//               <Input
//                 id="billing_country"
//                 value={formData.billing_country || ''}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   handleInputChange('billing_country', e.target.value)
//                 }
//                 placeholder="US"
//                 maxLength={2}
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="billing_phone">Phone (optional)</Label>
//               <Input
//                 id="billing_phone"
//                 value={formData.billing_phone || ''}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   handleInputChange('billing_phone', e.target.value)
//                 }
//                 placeholder="+1 555-123-4567"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Shipping Address Section */}
//         <div className="space-y-4">
//           <h3 className="text-lg font-semibold">Shipping Address</h3>

//           {/* Same as Billing Checkbox */}
//           <div className="flex items-center space-x-2">
//             <Checkbox
//               id="same_as_billing"
//               checked={sameAsBilling}
//               onCheckedChange={(checked: boolean) =>
//                 handleSameAsBillingChange(checked)
//               }
//             />
//             <Label htmlFor="same_as_billing" className="cursor-pointer">
//               Same as billing address
//             </Label>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="shipping_first_name">First Name</Label>
//               <Input
//                 id="shipping_first_name"
//                 value={getShippingValue('first_name')}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                   if (!sameAsBilling) {
//                     setShippingFormState((prev) => ({
//                       ...prev,
//                       shipping_first_name: e.target.value,
//                     }));
//                   }
//                 }}
//                 disabled={sameAsBilling}
//                 placeholder="John"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="shipping_last_name">Last Name</Label>
//               <Input
//                 id="shipping_last_name"
//                 value={getShippingValue('last_name')}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                   if (!sameAsBilling) {
//                     setShippingFormState((prev) => ({
//                       ...prev,
//                       shipping_last_name: e.target.value,
//                     }));
//                   }
//                 }}
//                 disabled={sameAsBilling}
//                 placeholder="Doe"
//               />
//             </div>

//             <div className="space-y-2 md:col-span-2">
//               <Label htmlFor="shipping_address1">Address Line 1</Label>
//               <Input
//                 id="shipping_address1"
//                 value={getShippingValue('address1')}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                   if (!sameAsBilling) {
//                     setShippingFormState((prev) => ({
//                       ...prev,
//                       shipping_address1: e.target.value,
//                     }));
//                   }
//                 }}
//                 disabled={sameAsBilling}
//                 placeholder="123 Main St"
//               />
//             </div>

//             <div className="space-y-2 md:col-span-2">
//               <Label htmlFor="shipping_address2">Address Line 2</Label>
//               <Input
//                 id="shipping_address2"
//                 value={getShippingValue('address2')}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                   if (!sameAsBilling) {
//                     setShippingFormState((prev) => ({
//                       ...prev,
//                       shipping_address2: e.target.value,
//                     }));
//                   }
//                 }}
//                 disabled={sameAsBilling}
//                 placeholder="Apt 4B"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="shipping_city">City</Label>
//               <Input
//                 id="shipping_city"
//                 value={getShippingValue('city')}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                   if (!sameAsBilling) {
//                     setShippingFormState((prev) => ({
//                       ...prev,
//                       shipping_city: e.target.value,
//                     }));
//                   }
//                 }}
//                 disabled={sameAsBilling}
//                 placeholder="New York"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="shipping_region">State / Province / Region</Label>
//               <Input
//                 id="shipping_region"
//                 value={getShippingValue('region')}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                   if (!sameAsBilling) {
//                     setShippingFormState((prev) => ({
//                       ...prev,
//                       shipping_region: e.target.value,
//                     }));
//                   }
//                 }}
//                 disabled={sameAsBilling}
//                 placeholder="NY"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="shipping_postal">Postal Code / ZIP</Label>
//               <Input
//                 id="shipping_postal"
//                 value={getShippingValue('postal')}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                   if (!sameAsBilling) {
//                     setShippingFormState((prev) => ({
//                       ...prev,
//                       shipping_postal: e.target.value,
//                     }));
//                   }
//                 }}
//                 disabled={sameAsBilling}
//                 placeholder="10001"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="shipping_country">Country</Label>
//               <Input
//                 id="shipping_country"
//                 value={getShippingValue('country')}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                   if (!sameAsBilling) {
//                     setShippingFormState((prev) => ({
//                       ...prev,
//                       shipping_country: e.target.value,
//                     }));
//                   }
//                 }}
//                 disabled={sameAsBilling}
//                 placeholder="US"
//                 maxLength={2}
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="shipping_phone">Phone (optional)</Label>
//               <Input
//                 id="shipping_phone"
//                 value={getShippingValue('phone')}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                   if (!sameAsBilling) {
//                     setShippingFormState((prev) => ({
//                       ...prev,
//                       shipping_phone: e.target.value,
//                     }));
//                   }
//                 }}
//                 disabled={sameAsBilling}
//                 placeholder="+1 555-123-4567"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Device / Network Section */}
//         <div className="space-y-4">
//           <h3 className="text-lg font-semibold">Device / Network</h3>

//           <div className="space-y-2">
//             <Label htmlFor="ip_address" className="flex items-center gap-2">
//               IP Address
//               <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
//                 Recommended
//               </span>
//             </Label>
//             <Input
//               id="ip_address"
//               value={formData.ip_address || ''}
//               onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                 handleInputChange('ip_address', e.target.value)
//               }
//               placeholder="192.168.1.1 or 2001:0db8:85a3:0000:0000:8a2e:0370:7334"
//               className={fieldErrors.ip_address ? 'border-red-500' : ''}
//             />
//             {fieldErrors.ip_address && (
//               <p className="text-sm text-red-600">{fieldErrors.ip_address}</p>
//             )}
//           </div>
//         </div>

//         {/* Action Buttons */}
//         {/* <div className="flex gap-4">
//           <Button
//             type="submit"
//             disabled={isLoading}
//             className="flex-1 cursor-pointer"
//           >
//             {isLoading ? 'Analyzing...' : 'Analyze Fraud Risk'}
//           </Button>

//           <Button
//             type="button"
//             variant="outline"
//             onClick={handleClearForm}
//             disabled={isLoading}
//             className="cursor-pointer"
//           >
//             Clear Form
//           </Button>
//         </div> */}
//         <div className="flex gap-4 pt-2">
//           {/* Primary CTA */}
//           <Button
//             type="submit"
//             disabled={isLoading}
//             className="
//       flex-1 relative overflow-hidden
//       bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700
//       hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 cursor-pointer
//       text-white font-semibold tracking-wide
//       shadow-lg shadow-blue-900/30
//       border border-white/10
//       backdrop-blur-xl
//       transition-all duration-300
//       hover:scale-[1.02] active:scale-[0.98]
//     "
//           >
//             <span className="relative z-10">
//               {isLoading ? 'Analyzing...' : 'Analyze Fraud Risk'}
//             </span>

//             {/* subtle glow effect */}
//             <span
//               className="
//       absolute inset-0 opacity-0 hover:opacity-100
//       bg-white/10 blur-xl transition duration-300
//     "
//             />
//           </Button>

//           {/* Secondary CTA */}
//           <Button
//             type="button"
//             variant="ghost"
//             onClick={handleClearForm}
//             disabled={isLoading}
//             className="
//       text-gray-400 hover:text-white cursor-pointer
//       border border-white/10
//       hover:bg-white/5
//       backdrop-blur-md
//       transition-all duration-200
//     "
//           >
//             Clear Form
//           </Button>
//         </div>
//       </form>
//     </Card>
//   );
// }
