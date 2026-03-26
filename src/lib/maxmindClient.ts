import type { MaxMindPayload, MaxMindResponse } from '@/types/minfraud';

/**
 * MaxMind API Client
 *
 * CRITICAL: This file must NEVER be imported by any client component.
 * It should only be imported by server-side code (route handlers).
 */

interface MaxMindError {
  code?: string;
  error?: string;
  message?: string;
}

/**
 * Constructs the Basic Auth header for MaxMind API
 * Uses Account ID and License Key from environment variables
 */
function getAuthHeader(): string {
  const accountId = process.env.MAXMIND_ACCOUNT_ID;
  const licenseKey = process.env.MAXMIND_LICENSE_KEY;

  if (!accountId || !licenseKey) {
    throw new Error('Missing MaxMind credentials in environment variables');
  }

  const credentials = `${accountId}:${licenseKey}`;
  const encoded = Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
}

/**
 * Calls the MaxMind minFraud Factors API
 *
 * @param payload - The dynamically built payload to send to the API
 * @returns The parsed API response
 * @throws Error if the API call fails
 */
export async function callMaxMindAPI(
  payload: MaxMindPayload,
): Promise<MaxMindResponse> {
  const apiUrl = process.env.MAXMIND_API_URL;

  if (!apiUrl) {
    throw new Error('Missing MAXMIND_API_URL in environment variables');
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `MaxMind API error: ${response.status} ${response.statusText}`;

      // Try to parse error response for more details
      try {
        const errorData: MaxMindError = JSON.parse(errorText);
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error || errorData.message || errorMessage;
        }
      } catch {
        // If parsing fails, use the status text
      }

      throw new Error(errorMessage);
    }

    const data: MaxMindResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw known errors
      if (
        error.message.includes('MaxMind API error') ||
        error.message.includes('Missing MaxMind credentials') ||
        error.message.includes('Missing MAXMIND_API_URL')
      ) {
        throw error;
      }

      // Wrap network errors
      throw new Error(`Network error calling MaxMind API: ${error.message}`);
    }

    throw new Error('Unknown error calling MaxMind API');
  }
}
