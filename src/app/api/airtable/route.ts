import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const tableName = process.env.AIRTABLE_TABLE_NAME;
    const apiKey = process.env.AIRTABLE_API_KEY;

    if (!baseId || !tableName || !apiKey) {
      return NextResponse.json(
        { error: 'Airtable credentials are not configured properly.' },
        { status: 500 }
      );
    }

    const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // You can add revalidation or cache control if needed
      cache: 'no-store',
    });

    console.log(response)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Airtable API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch data from Airtable.' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log({data})
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Airtable data:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching Airtable data.' },
      { status: 500 }
    );
  }
}
