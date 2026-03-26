// Form input data - all fields are optional
export interface FormData {
  // Customer
  full_name?: string;
  email?: string;
  phone?: string;

  // Billing Address
  billing_first_name?: string;
  billing_last_name?: string;
  billing_address1?: string;
  billing_address2?: string;
  billing_city?: string;
  billing_region?: string;
  billing_postal?: string;
  billing_country?: string;
  billing_phone?: string;

  // Shipping Address
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_address1?: string;
  shipping_address2?: string;
  shipping_city?: string;
  shipping_region?: string;
  shipping_postal?: string;
  shipping_country?: string;
  shipping_phone?: string;

  // Device / Network
  ip_address?: string;
}

// Address object for API payload
export interface AddressObject {
  first_name?: string;
  last_name?: string;
  address?: string;
  address_2?: string;
  city?: string;
  region?: string;
  postal?: string;
  country?: string;
  phone_number?: string;
}

// API payload - dynamically built, only includes provided fields
export interface MaxMindPayload {
  device?: {
    ip_address: string;
  };
  email?: {
    address: string;
  };
  billing?: AddressObject;
  shipping?: AddressObject;
}

// IP Address Analysis
export interface IPAddressData {
  country?: {
    iso_code?: string;
    name?: string;
    confidence?: number;
  };
  city?: {
    names?: {
      en?: string;
    };
    confidence?: number;
  };
  postal?: {
    code?: string;
    confidence?: number;
  };
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy_radius?: number;
    time_zone?: string;
  };
  traits?: {
    isp?: string;
    organization?: string;
    domain?: string;
    user_type?: string;
    is_anonymous?: boolean;
    is_anonymous_vpn?: boolean;
    is_hosting_provider?: boolean;
    is_public_proxy?: boolean;
    is_residential_proxy?: boolean;
    is_tor_exit_node?: boolean;
    connection_type?: string;
  };
  risk?: number;
}

// Email Domain Analysis (nested object)
// Note: MaxMind API does NOT return the domain name string, only analysis data
export interface EmailDomainData {
  first_seen?: string;
  risk?: number;
  volume?: number;
}

// Email Analysis
// Note: MaxMind API does NOT return the email address for privacy/security
export interface EmailData {
  domain?: EmailDomainData;
  first_seen?: string;
  is_free?: boolean;
  is_disposable?: boolean;
  is_high_risk?: boolean;
  confidence?: number;
  risk?: number;
}

// Address Verification
export interface AddressVerification {
  is_in_ip_country?: boolean;
  latitude?: number;
  longitude?: number;
  distance_to_ip_location?: number;
  distance_to_billing_address?: number;
  is_postal_in_city?: boolean;
  is_high_risk?: boolean;
  risk?: number;
}

// Phone Analysis
// Note: MaxMind API does NOT return the phone number for privacy/security
export interface PhoneData {
  country?: string; // ISO code (e.g., "BD" for Bangladesh)
  number_type?: string;
  is_valid?: boolean;
  is_mobile?: boolean;
  is_prepaid?: boolean;
  is_voip?: boolean;
  network_operator?: string;
  risk?: number;
}

// Risk Score Reason
export interface RiskScoreReason {
  multiplier: number;
  reasons: Array<{
    reason: string;
  }>;
}

// Warning
export interface Warning {
  code: string;
  warning: string;
  input_pointer?: string;
}

// Full API response - all fields optional for safety
export interface MaxMindResponse {
  // Risk
  risk_score?: number;
  risk_score_reasons?: RiskScoreReason[];

  // IP Address
  ip_address?: IPAddressData;

  // Email
  email?: EmailData;

  // Billing address verification (Factors API)
  billing_address?: AddressVerification;

  // Shipping address verification (Factors API)
  shipping_address?: AddressVerification;

  // Legacy aliases retained for compatibility with any older code paths
  billing?: AddressVerification;
  shipping?: AddressVerification;

  // Billing Phone
  billing_phone?: PhoneData;

  // Shipping Phone
  shipping_phone?: PhoneData;

  // Warnings
  warnings?: Warning[];

  // Additional fields that may be present
  credits_remaining?: number;
  id?: string;
}
