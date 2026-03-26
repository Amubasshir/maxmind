import type { AddressObject, FormData, MaxMindPayload } from '@/types/minfraud';

/**
 * Dynamic Payload Builder
 *
 * This is the core logic of the entire application.
 * It dynamically builds the MaxMind API payload based on the provided form data.
 *
 * CRITICAL RULES:
 * 1. Every field is optional - never assume a field exists
 * 2. Only include a field in the payload if it has a non-empty trimmed string value
 * 3. Never send "", null, or undefined to the API
 * 4. Build nested objects (billing, shipping) only if at least one sub-field is present
 */

/**
 * Builds an address object from form data
 * Only includes fields that have non-empty trimmed values
 *
 * @param data - The form data
 * @param prefix - The prefix for address fields ('billing' or 'shipping')
 * @returns An address object or null if no fields are present
 */
function buildAddressObject(
  data: FormData,
  prefix: 'billing' | 'shipping',
): AddressObject | null {
  const fields: Record<string, string | undefined> = {
    first_name: data[`${prefix}_first_name`],
    last_name: data[`${prefix}_last_name`],
    address: data[`${prefix}_address1`],
    address_2: data[`${prefix}_address2`],
    city: data[`${prefix}_city`],
    region: data[`${prefix}_region`],
    postal: data[`${prefix}_postal`],
    country: data[`${prefix}_country`],
    phone_number: data[`${prefix}_phone`],
  };

  // Filter out empty values
  const filtered = Object.fromEntries(
    Object.entries(fields).filter(([_, value]) => {
      return value && typeof value === 'string' && value.trim().length > 0;
    }),
  );

  // Return null if no fields are present
  return Object.keys(filtered).length > 0 ? filtered : null;
}

/**
 * Builds the MaxMind API payload from form data
 *
 * This function:
 * - Checks every field before including it
 * - Only includes fields with non-empty trimmed values
 * - Never sends "", null, or undefined to the API
 * - Builds nested objects only if at least one sub-field exists
 *
 * @param data - The form data from the input form
 * @returns The dynamically built MaxMind payload
 */
export function buildPayload(data: FormData): MaxMindPayload {
  const payload: MaxMindPayload = {};

  // Device: IP Address
  if (data.ip_address && data.ip_address.trim()) {
    payload.device = {
      ip_address: data.ip_address.trim(),
    };
  }

  // Email
  if (data.email && data.email.trim()) {
    payload.email = {
      address: data.email.trim(),
    };
  }

  // Phone: Billing phone maps to top-level phone
  if (data.billing_phone && data.billing_phone.trim()) {
    payload.phone = {
      number: data.billing_phone.trim(),
    };
  }

  // Billing Address
  const billing = buildAddressObject(data, 'billing');
  if (billing) {
    payload.billing = billing;
  }

  // Shipping Address
  const shipping = buildAddressObject(data, 'shipping');
  if (shipping) {
    payload.shipping = shipping;
  }

  return payload;
}
