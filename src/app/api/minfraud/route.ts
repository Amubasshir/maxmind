import { buildPayload } from '@/lib/buildPayload';
import { callMaxMindAPI } from '@/lib/maxmindClient';
import { isValidEmail, isValidIP } from '@/lib/validators';
import type { FormData } from '@/types/minfraud';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/minfraud
 *
 * This is the only API route in the application.
 * It receives form data from the frontend, validates it, builds the payload,
 * calls the MaxMind API, and returns the response.
 *
 * CRITICAL: This route handler must NEVER be imported by client components.
 * Client components call this route via fetch('/api/minfraud', ...).
 */

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: FormData = await request.json();

    // Validate that at least one field was provided
    const hasAnyField = Object.values(body).some(
      (value) => value && typeof value === 'string' && value.trim().length > 0,
    );

    if (!hasAnyField) {
      return NextResponse.json(
        { error: 'Enter at least one field to analyze' },
        { status: 400 },
      );
    }

    // Validate email format if provided
    if (body.email && body.email.trim()) {
      if (!isValidEmail(body.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 },
        );
      }
    }

    // Validate IP format if provided
    if (body.ip_address && body.ip_address.trim()) {
      if (!isValidIP(body.ip_address)) {
        return NextResponse.json(
          { error: 'Invalid IP address format' },
          { status: 400 },
        );
      }
    }

    // Sanitize inputs: trim all string values
    const sanitizedBody: FormData = {};
    for (const [key, value] of Object.entries(body)) {
      if (value && typeof value === 'string') {
        sanitizedBody[key as keyof FormData] = value.trim();
      }
    }

    // Build the dynamic payload
    const payload = buildPayload(sanitizedBody);

    // Call MaxMind API
    const response = await callMaxMindAPI(payload);

    // Return the API response
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error in /api/minfraud:', error);

    // Handle different error types
    if (error instanceof Error) {
      // Check if it's a MaxMind API error or network error
      if (error.message.includes('MaxMind API error')) {
        return NextResponse.json(
          { error: 'Analysis failed. Please check your inputs and try again.' },
          { status: 500 },
        );
      }

      if (error.message.includes('Network error')) {
        return NextResponse.json(
          { error: 'Connection error. Please try again.' },
          { status: 503 },
        );
      }

      if (
        error.message.includes('Missing MaxMind credentials') ||
        error.message.includes('Missing MAXMIND_API_URL')
      ) {
        return NextResponse.json(
          { error: 'Server configuration error. Please contact support.' },
          { status: 500 },
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }
}

// Explicitly disallow GET requests
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
