# MaxMind FRIQ Fraud Analysis Tool - Implementation Plan

## Project Overview

A secure, standalone, internal fraud risk analysis tool that allows fraud analysts to manually enter order/customer data, submit it to MaxMind's minFraud Factors API, and view the full structured fraud analysis response in a clean, readable interface.

**Tech Stack:** Next.js 16.2.1, React 19.2.4, TypeScript 5.x, Tailwind CSS 4.x, shadcn/ui

---

## Architecture Overview

```mermaid
graph TB
    subgraph Frontend
        A[User Input Form] --> B[Client Components]
        B --> C[API Call]
    end

    subgraph Backend
        C --> D[/api/minfraud/route.ts]
        D --> E[buildPayload.ts]
        D --> F[maxmindClient.ts]
        F --> G[MaxMind API]
    end

    G --> D
    D --> C
    C --> H[ResultDisplay Component]
    H --> I[User View]
```

---

## Implementation Phases

### Phase 1: Project Setup & Configuration

**Status:** Partially complete (Next.js, React, TypeScript, Tailwind already configured)

#### Tasks:

1. ✅ Verify Next.js 16.2.1 installation
2. ✅ Verify React 19.2.4 installation
3. ✅ Verify TypeScript strict mode enabled
4. ✅ Verify Tailwind CSS 4.x configured
5. ⬜ Install and configure shadcn/ui
6. ⬜ Create directory structure
7. ⬜ Set up .env.local file
8. ⬜ Create robots.txt

#### shadcn/ui Installation:

```bash
npx shadcn@latest init
```

- Style: Default
- Base color: Slate
- CSS variables: Yes

```bash
npx shadcn@latest add button input label card checkbox toast badge
```

#### Directory Structure (adapted for /src):

```
src/
  app/
    layout.tsx              ← Update metadata
    page.tsx                ← Replace with main page
    globals.css             ← Update with Tailwind 4
    api/
      minfraud/
        route.ts           ← POST handler
  components/
    InputForm.tsx          ← Full form
    ResultDisplay.tsx      ← Results rendering
    RiskScoreBadge.tsx     ← Color-coded badge
    Loader.tsx             ← Loading spinner
  lib/
    buildPayload.ts        ← Dynamic payload builder
    maxmindClient.ts       ← API client with auth
    validators.ts          ← Email & IP validators
  types/
    minfraud.ts            ← TypeScript types
public/
  robots.txt               ← Disallow all crawlers
.env.local                 ← Server-only env variables
```

---

### Phase 2: TypeScript Types

**File:** `src/types/minfraud.ts`

#### Tasks:

1. Define `FormData` interface (all input fields, optional)
2. Define `MaxMindPayload` interface (API request structure)
3. Define `MaxMindResponse` interface (API response structure)
4. Ensure all fields are optional to handle partial responses

#### Key Types:

```typescript
// Form input data - all optional
interface FormData {
  // Customer
  full_name?: string;
  email?: string;
  phone?: string;

  // Billing
  billing_first_name?: string;
  billing_last_name?: string;
  billing_address1?: string;
  billing_address2?: string;
  billing_city?: string;
  billing_region?: string;
  billing_postal?: string;
  billing_country?: string;
  billing_phone?: string;

  // Shipping
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_address1?: string;
  shipping_address2?: string;
  shipping_city?: string;
  shipping_region?: string;
  shipping_postal?: string;
  shipping_country?: string;
  shipping_phone?: string;

  // Device
  ip_address?: string;
}

// API payload - dynamically built
interface MaxMindPayload {
  device?: { ip_address: string };
  email?: { address: string };
  phone?: { number: string };
  billing?: AddressObject;
  shipping?: AddressObject;
}

// API response - all optional for safety
interface MaxMindResponse {
  risk_score?: number;
  risk_score_reasons?: string[];
  ip_address?: IPAddressData;
  email?: EmailData;
  billing?: AddressVerification;
  shipping?: AddressVerification;
  // ... all other response fields
}
```

---

### Phase 3: Utility Functions

#### 3.1 Validators (`src/lib/validators.ts`)

**Tasks:**

1. Implement email format validator (regex-based)
2. Implement IPv4 validator
3. Implement IPv6 validator
4. Export combined IP validator

#### 3.2 MaxMind Client (`src/lib/maxmindClient.ts`)

**Tasks:**

1. Import environment variables (server-only)
2. Create Basic Auth header from account ID and license key
3. Implement `callMaxMindAPI(payload)` function
4. Handle API errors (4xx, 5xx)
5. Handle network errors
6. Return parsed JSON response

**Critical:** This file must NEVER be imported by client components.

#### 3.3 Payload Builder (`src/lib/buildPayload.ts`)

**Tasks:**

1. Implement `buildPayload(data: FormData)` function
2. Check every field before including it
3. Never include empty strings, null, or undefined
4. Build nested objects only if at least one sub-field exists
5. Implement helper function `buildAddressObject()`

**Rules:**

- Every field is optional
- Only include fields with non-empty trimmed values
- Never send `""`, `null`, or `undefined` to API
- Build nested objects conditionally

---

### Phase 4: API Route

**File:** `src/app/api/minfraud/route.ts`

**Tasks:**

1. Create POST route handler
2. Validate request body
3. Sanitize inputs (trim whitespace)
4. Call `buildPayload()` to construct API payload
5. Call `maxmindClient.callMaxMindAPI()`
6. Handle errors gracefully
7. Return JSON response or error object

**Error Handling:**

- Empty form: Return 400 with message
- Invalid email/IP: Return 400 with validation errors
- API error: Return appropriate status with error message
- Network error: Return 503 with connection error message

---

### Phase 5: Client Components

#### 5.1 Loader Component (`src/components/Loader.tsx`)

**Tasks:**

1. Create simple spinner/loading animation
2. Use Tailwind CSS for styling
3. Export as default

#### 5.2 Risk Score Badge (`src/components/RiskScoreBadge.tsx`)

**Tasks:**

1. Accept `score` prop (number or undefined)
2. Determine color based on score:
   - 0-20: Green
   - 21-60: Amber
   - 61-100: Red
3. Display score prominently with color coding
4. Handle missing/undefined scores

#### 5.3 Input Form Component (`src/components/InputForm.tsx`)

**Tasks:**

1. Mark as client component (`"use client"`)
2. Create form state with all input fields
3. Implement "Same as billing address" checkbox logic
4. Create four form sections:
   - Customer (Name, Email, Phone)
   - Billing Address (all billing fields)
   - Shipping Address (checkbox + all shipping fields)
   - Device/Network (IP Address - marked as "Recommended")
5. Implement field validation (email, IP format)
6. Implement form submission handler
7. Call `/api/minfraud` endpoint
8. Handle loading states
9. Handle errors (display toast)
10. Implement "Clear Form" button
11. Implement "Copy JSON" button (copies API response)

**Critical Logic - Same as Billing:**

```typescript
const [sameAsBilling, setSameAsBilling] = useState(false);
const [billingValues, setBillingValues] = useState({...});
const [shippingFormState, setShippingFormState] = useState({...});

const shippingValues = sameAsBilling ? billingValues : shippingFormState;
```

#### 5.4 Result Display Component (`src/components/ResultDisplay.tsx`)

**Tasks:**

1. Mark as client component (`"use client"`)
2. Accept `response` prop (MaxMindResponse | null)
3. Render eight card sections:
   - Risk Score (large, color-coded)
   - Risk Score Reasons
   - IP Address Analysis
   - IP Anonymity Flags
   - Email Analysis
   - Billing Address Verification
   - Shipping Address Verification
   - Phone Analysis (Billing + Shipping)
4. Use optional chaining everywhere: `response?.ip_address?.country?.iso_code`
5. Use nullish coalescing: `?? "N/A"`
6. Never hide sections - show all with "N/A" if data missing
7. Boolean flags default to `false`: `?? false`

**All 40+ Output Fields:**

- Risk: Risk Score, Risk Score Reasons
- IP: Country, City, Postal Code, Latitude, Longitude, Time Zone, ISP, Organization, Domain, User Type, Risk
- Anonymity: Is Anonymous, Is Anonymous VPN, Is Hosting Provider, Is Public Proxy, Is Residential Proxy, Is Tor Exit Node
- Email: Address, Domain, First Seen, Is Free, Is High Risk, Confidence, Risk
- Billing Address: First Name, Last Name, Address, City, Region, Postal, Country, Is in IP Country, Latitude, Longitude, Distance to IP Location
- Shipping Address: Same fields as billing
- Billing Phone: Number, Country, Type, Is Valid
- Shipping Phone: Number, Country, Type, Is Valid

---

### Phase 6: Main Page

**File:** `src/app/page.tsx`

**Tasks:**

1. Keep as Server Component (no `"use client"`)
2. Import InputForm and ResultDisplay components
3. Create state management for:
   - API response
   - Loading state
   - Error state
4. Render InputForm at top
5. Render ResultDisplay below (only after submission)
6. Pass necessary props to child components
7. Handle form submission from InputForm
8. Update state with API response

---

### Phase 7: Layout & Global Styles

#### 7.1 Update Layout (`src/app/layout.tsx`)

**Tasks:**

1. Update metadata:
   - Title: "FRIQ Fraud Analysis Tool"
   - Description: "Internal fraud risk analysis tool powered by MaxMind"
2. Keep existing font configuration
3. Ensure proper HTML structure

#### 7.2 Update Global CSS (`src/app/globals.css`)

**Tasks:**

1. Keep Tailwind 4 import
2. Add custom CSS variables for shadcn/ui
3. Add any additional styling for the fraud tool
4. Ensure dark mode support if needed

---

### Phase 8: Security & Deployment

#### 8.1 Environment Variables

**File:** `.env.local` (never commit)

**Tasks:**

1. Create `.env.local` file
2. Add MaxMind credentials:
   ```
   MAXMIND_ACCOUNT_ID=1306761
   MAXMIND_LICENSE_KEY=<your_license_key_here>
   MAXMIND_API_URL=https://minfraud.maxmind.com/minfraud/v2.0/factors
   ```
3. Verify `.gitignore` includes `.env.local` (already done ✓)

#### 8.2 Robots.txt

**File:** `public/robots.txt`

**Tasks:**

1. Create `robots.txt`
2. Add:
   ```
   User-agent: *
   Disallow: /
   ```
3. This blocks all crawlers from indexing the tool

#### 8.3 Deployment Preparation

**Tasks:**

1. Run `next build` to verify zero errors
2. Run `tsc --noEmit` to verify no TypeScript errors
3. Set environment variables in Vercel dashboard
4. Configure custom domain `FRIQtool.com`
5. Deploy to Vercel

---

## Testing Checklist

Before delivery, manually verify:

| Test Case                              | Expected Result                                       |
| -------------------------------------- | ----------------------------------------------------- |
| Only IP address entered                | Valid request, full IP section rendered               |
| Only email entered                     | Valid request, email section rendered                 |
| All fields entered                     | Full response rendered across all sections            |
| Billing without shipping               | Shipping section shows N/A                            |
| Invalid IP format                      | Inline error, no API call                             |
| Invalid email format                   | Inline error, no API call                             |
| Empty form submitted                   | Warning message, no API call                          |
| MaxMind returns partial response       | Missing fields show N/A, no crash                     |
| API key is wrong                       | Error toast shown                                     |
| Network disconnect                     | Error toast shown                                     |
| "Same as billing" checkbox checked     | Shipping fields mirror billing and are disabled       |
| "Same as billing" checkbox unchecked   | Shipping fields become editable                       |
| Billing changes while checkbox checked | Shipping fields update in real-time                   |
| Clear Form button                      | All fields reset, results cleared, checkbox unchecked |
| Copy JSON button                       | Raw API response copied to clipboard                  |
| Risk score 0-20                        | Green badge displayed                                 |
| Risk score 21-60                       | Amber badge displayed                                 |
| Risk score 61-100                      | Red badge displayed                                   |

---

## Critical Implementation Rules

### 1. Server vs Client Boundary

| File                                | Type                   | Reason                       |
| ----------------------------------- | ---------------------- | ---------------------------- |
| `src/app/page.tsx`                  | Server Component       | No hooks needed              |
| `src/app/api/minfraud/route.ts`     | Server (Route Handler) | Holds API credentials        |
| `src/components/InputForm.tsx`      | **Client**             | Uses `useState`, form events |
| `src/components/ResultDisplay.tsx`  | **Client**             | Conditional rendering        |
| `src/components/RiskScoreBadge.tsx` | Client or Server       | No hooks, can be either      |
| `src/lib/buildPayload.ts`           | Server-only import     | Called from route handler    |
| `src/lib/maxmindClient.ts`          | Server-only import     | Holds auth logic             |
| `src/lib/validators.ts`             | Client + Server        | Pure functions               |

### 2. The Unbreakable Rule

`lib/maxmindClient.ts` and `app/api/minfraud/route.ts` must **never** be imported by any client component. Client components call the API via `fetch('/api/minfraud', ...)`.

### 3. Partial Input Rule

**Never break on partial input:**

- Accept any combination of fields
- Dynamically build payload
- Never send empty values to API
- Never crash on missing response fields

### 4. Safe Rendering Rule

```typescript
// ✅ Always do this
const riskScore = response?.risk_score ?? 'N/A';
const ipCountry = response?.ip_address?.country?.iso_code ?? 'N/A';
const isTor = response?.ip_address?.traits?.is_tor_exit_node ?? false;

// ❌ Never do this
const riskScore = response.risk_score;
```

---

## Out of Scope (Do Not Build)

- Login / authentication system
- Database or data persistence
- Saving previous results
- Bulk CSV upload
- Analytics dashboard
- Transaction amount/currency fields
- External system integrations

---

## Definition of Done

The project is complete when:

- [ ] User can submit any combination of fields without errors
- [ ] Partial input never breaks the API request
- [ ] All 40+ output fields from client Excel are displayed
- [ ] Missing response fields display "N/A" without crashing
- [ ] API credentials are fully server-side and never exposed
- [ ] `robots.txt` blocks all crawlers
- [ ] Clear Form and Copy JSON buttons work
- [ ] Risk score is prominently color-coded
- [ ] "Same as billing" checkbox works correctly
- [ ] Deployed to Vercel with live URL
- [ ] All 20 test cases pass

---

## Next Steps

1. Review this plan
2. Ask clarifying questions if needed
3. Switch to Code mode to begin implementation
4. Follow phases in order
5. Test thoroughly before deployment

---

## Notes

- The current project uses `/src/app` structure, which differs from AGENTS.md's `/app` structure. This plan adapts to the existing `/src/app` structure.
- All TypeScript types must be strict - no `any` except where explicitly noted.
- The payload builder is the most critical piece of logic - implement it exactly as specified.
- All error handling must be user-friendly with clear messages.
