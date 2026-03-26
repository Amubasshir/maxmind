'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidEmail, isValidIP } from '@/lib/validators';
import type { FormData } from '@/types/minfraud';
import { useState } from 'react';

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

    // Resolve shipping values based on checkbox state
    const finalData: FormData = {
      ...formData,
      ...(sameAsBilling ? billingValues : shippingFormState),
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

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form Error */}
        {fieldErrors._form && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {fieldErrors._form}
          </div>
        )}

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
                placeholder="10001"
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
        {/* <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 cursor-pointer"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Fraud Risk'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleClearForm}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Clear Form
          </Button>
        </div> */}
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
