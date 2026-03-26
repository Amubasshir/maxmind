/**
 * Email format validator
 * Returns true if the email format is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * IPv4 address validator
 * Returns true if the IP is a valid IPv4 address, false otherwise
 */
export function isValidIPv4(ip: string): boolean {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip.trim())) {
    return false;
  }

  const octets = ip.split('.');
  return octets.every((octet) => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * IPv6 address validator
 * Returns true if the IP is a valid IPv6 address, false otherwise
 */
export function isValidIPv6(ip: string): boolean {
  if (!ip || typeof ip !== 'string') {
    return false;
  }

  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6Regex.test(ip.trim());
}

/**
 * Combined IP address validator
 * Returns true if the IP is a valid IPv4 or IPv6 address, false otherwise
 */
export function isValidIP(ip: string): boolean {
  return isValidIPv4(ip) || isValidIPv6(ip);
}

/**
 * ISO 3166-1 alpha-2 country code validator
 * Returns true if the code is a valid 2-letter country code, false otherwise
 */
export function isValidCountryCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  const countryCodeRegex = /^[A-Z]{2}$/;
  return countryCodeRegex.test(code.trim().toUpperCase());
}
