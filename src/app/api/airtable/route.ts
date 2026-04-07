

import { NextResponse } from 'next/server';

// Airtable configuration from environment variables
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

/**
 * Fetches ALL records from Airtable with automatic pagination
 * Airtable returns max 100 records per page, so we loop until no offset
 */
async function fetchAllAirtableRecords(): Promise<any[]> {
  // Validate credentials
  if (!AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME || !AIRTABLE_API_KEY) {
    throw new Error('Airtable credentials not configured. Check environment variables.');
  }

  let allRecords: any[] = [];
  let offset: string | undefined;
  const pageSize = 100; // Maximum allowed by Airtable API
  const maxRecords = 10000; // Safety limit to prevent infinite loops

  do {
    // Build URL with pagination and cache-busting parameters
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`);
    url.searchParams.set('pageSize', pageSize.toString());
    
    if (offset) {
      url.searchParams.set('offset', offset);
    }
    
    // Cache-busting parameter to ensure fresh data
    url.searchParams.set('_t', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Airtable-Integration/1.0',
      },
      // Disable Next.js static caching for dynamic data
      cache: 'no-store',
      // Optional: Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      let errorDetails = {};
      try {
        errorDetails = await response.json();
      } catch {
        // Ignore if error response is not JSON
      }
      
      console.error('Airtable API error response:', {
        status: response.status,
        statusText: response.statusText,
        details: errorDetails,
      });
      
      throw new Error(`Airtable request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Append records if they exist
    if (Array.isArray(data.records)) {
      allRecords = [...allRecords, ...data.records];
    }
    
    // Get next page offset (Airtable returns this if more pages exist)
    offset = data.offset;
    
    // Safety break to prevent infinite loops with malformed API responses
    if (allRecords.length >= maxRecords) {
      console.warn(`Reached maximum record limit (${maxRecords}), stopping pagination`);
      break;
    }
    
  } while (offset);

  return allRecords;
}

export async function GET() {
  try {
    const records = await fetchAllAirtableRecords();
    
    return NextResponse.json(
      { 
        records, 
        count: records.length,
        timestamp: new Date().toISOString(),
      },
      { 
        status: 200,
        headers: {
          // Prevent browser/CDN caching of dynamic data
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  } catch (error) {
    console.error('❌ Error fetching Airtable data:', error);
    
    const isConfigError = error instanceof Error && 
      error.message.includes('credentials not configured');
    
    return NextResponse.json(
      { 
        error: isConfigError 
          ? 'Airtable configuration error. Please check your environment variables.' 
          : 'Failed to fetch customer data from Airtable.',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error))
          : undefined,
      },
      { 
        status: isConfigError ? 500 : 503, // 503 for external service issues
        headers: {
          'Cache-Control': 'no-store',
        }
      }
    );
  }
}

// Optional: Enable dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';






// import { NextResponse } from 'next/server';

// export async function GET() {
//   try {
//     const baseId = process.env.AIRTABLE_BASE_ID;
//     const tableName = process.env.AIRTABLE_TABLE_NAME;
//     const apiKey = process.env.AIRTABLE_API_KEY;

//     if (!baseId || !tableName || !apiKey) {
//       return NextResponse.json(
//         { error: 'Airtable credentials are not configured properly.' },
//         { status: 500 }
//       );
//     }

//     const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         Authorization: `Bearer ${apiKey}`,
//         'Content-Type': 'application/json',
//       },
//       // You can add revalidation or cache control if needed
//       cache: 'no-store',
//     });

//     console.log(response)

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       console.error('Airtable API error:', errorData);
//       return NextResponse.json(
//         { error: 'Failed to fetch data from Airtable.' },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();
//     console.log({data})
//     return NextResponse.json(data);
//   } catch (error) {
//     console.error('Error fetching Airtable data:', error);
//     return NextResponse.json(
//       { error: 'Internal server error while fetching Airtable data.' },
//       { status: 500 }
//     );
//   }
// }

