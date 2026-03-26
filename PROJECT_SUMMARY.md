# MaxMind FRIQ Fraud Analysis Tool - Project Summary

## Project Overview

A secure, standalone, internal fraud risk analysis tool that allows fraud analysts to manually enter order/customer data, submit it to MaxMind's minFraud Factors API, and view the full structured fraud analysis response in a clean, readable interface.

**Status:** ✅ Implementation Complete

## Tech Stack

| Layer         | Technology   | Version |
| ------------- | ------------ | ------- |
| Framework     | Next.js      | 16.2.1  |
| Runtime       | React        | 19.2.4  |
| Language      | TypeScript   | 5.x     |
| Styling       | Tailwind CSS | 4.x     |
| UI Components | shadcn/ui    | latest  |
| Deployment    | Vercel       | —       |

## Project Structure

```
f:/work/2026/maxmind/
├── .env.local                          # Server-only environment variables
├── .gitignore                          # Includes .env.local
├── public/
│   └── robots.txt                     # Disallows all crawlers
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout with Toaster
│   │   ├── page.tsx                  # Main page (Server Component)
│   │   ├── globals.css                # Tailwind 4.x styles
│   │   └── api/
│   │       └── minfraud/
│   │           └── route.ts          # POST handler for MaxMind API
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── badge.tsx
│   │   │   └── sonner.tsx
│   │   ├── InputForm.tsx             # Full form with "Same as billing" logic
│   │   ├── ResultDisplay.tsx         # Safe rendering of API response
│   │   ├── RiskScoreBadge.tsx        # Color-coded risk score
│   │   └── Loader.tsx               # Loading spinner
│   ├── lib/
│   │   ├── buildPayload.ts           # Dynamic payload builder (core logic)
│   │   ├── maxmindClient.ts          # API client with Basic Auth
│   │   ├── validators.ts             # Email & IP validators
│   │   └── utils.ts                # shadcn/ui utilities
│   └── types/
│       └── minfraud.ts              # TypeScript types
├── plans/
│   └── implementation-plan.md         # Detailed implementation plan
├── DEPLOYMENT_CHECKLIST.md            # Deployment guide
└── AGENTS.md                          # Agent instructions
```

## Key Features Implemented

### 1. Dynamic Form Input

- **Customer Information:** Full Name, Email, Phone
- **Billing Address:** First Name, Last Name, Address Lines 1 & 2, City, Region, Postal, Country, Phone
- **Shipping Address:** Same fields as billing, with "Same as billing" checkbox
- **Device/Network:** IP Address (marked as "Recommended")

### 2. "Same as Billing" Checkbox

- Located at top of Shipping Address section
- When checked: shipping fields mirror billing fields in real-time and are disabled
- When unchecked: shipping fields become editable again
- Billing field changes update shipping fields instantly when checkbox is checked
- Resets to unchecked on "Clear Form"

### 3. Dynamic Payload Builder

- Only includes fields with non-empty trimmed values
- Never sends empty strings, null, or undefined to API
- Builds nested objects (billing, shipping) only if at least one sub-field exists
- Located in `src/lib/buildPayload.ts`

### 4. Safe Response Rendering

- Uses optional chaining everywhere: `response?.ip_address?.country?.iso_code`
- Uses nullish coalescing: `?? "N/A"`
- Boolean flags default to `false`: `?? false`
- Never crashes on missing fields
- All sections shown even if data is absent

### 5. Risk Score Color Coding

- **0-20:** Green (`text-green-600 bg-green-50`) - Low Risk
- **21-60:** Amber (`text-amber-600 bg-amber-50`) - Medium Risk
- **61-100:** Red (`text-red-600 bg-red-50`) - High Risk

### 6. Error Handling

- Empty form: Inline warning "Enter at least one field to analyze"
- Invalid email: Inline field error
- Invalid IP: Inline field error
- MaxMind API error: Toast notification
- Network error: Toast notification
- Missing response fields: Display "N/A" (never crash)

### 7. Additional Features

- **Clear Form:** Resets all inputs, results, and checkbox state
- **Copy JSON:** Copies raw API response to clipboard
- **Toast Notifications:** Success/error messages via sonner
- **Loading State:** Spinner while API call is in progress

## Security Implementation

✅ **API Credentials:**

- Stored in `.env.local` (never committed)
- No `NEXT_PUBLIC_` prefix (server-only)
- Accessed only in route handlers and server libs

✅ **Server/Client Boundary:**

- `lib/maxmindClient.ts` never imported by client components
- `app/api/minfraud/route.ts` never imported by client components
- Client components call API via `fetch('/api/minfraud', ...)`

✅ **Input Sanitization:**

- All strings trimmed before processing
- Empty values filtered out
- Never send invalid data to API

✅ **Crawler Blocking:**

- `robots.txt` contains `Disallow: /`
- Blocks all search engine crawlers

✅ **No Data Persistence:**

- No database
- No localStorage
- All data is transient

## All Output Fields Rendered

### Risk

- Risk Score (color-coded badge)
- Risk Score Reasons (list)

### IP Address Analysis (11 fields)

- IP Country, IP City, IP Postal Code, IP Latitude, IP Longitude
- IP Time Zone, IP ISP, IP Organization, IP Domain, IP User Type, IP Risk

### IP Anonymity Flags (6 fields)

- Is Anonymous, Is Anonymous VPN, Is Hosting Provider
- Is Public Proxy, Is Residential Proxy, Is Tor Exit Node

### Email Analysis (7 fields)

- Email Address, Email Domain, Email First Seen
- Email Is Free, Email Is High Risk, Email Confidence, Email Risk

### Billing Address Verification (4 fields)

- Billing Is in IP Country, Billing Latitude, Billing Longitude
- Billing Distance to IP Location

### Shipping Address Verification (4 fields)

- Shipping Is in IP Country, Shipping Latitude, Shipping Longitude
- Shipping Distance to IP Location

### Phone Analysis (8 fields)

- Billing Phone Number, Billing Phone Country, Billing Phone Type, Billing Phone Is Valid
- Shipping Phone Number, Shipping Phone Country, Shipping Phone Type, Shipping Phone Is Valid

**Total: 40+ output fields**

## Testing Checklist

Before deployment, verify:

- [ ] Submit form with only IP address → Valid request, full IP section rendered
- [ ] Submit form with only email → Valid request, email section rendered
- [ ] Submit form with all fields → Full response rendered across all sections
- [ ] Submit without shipping → Shipping verification shows N/A
- [ ] Invalid IP format → Inline error, no API call
- [ ] Invalid email format → Inline error, no API call
- [ ] Empty form submitted → Warning message, no API call
- [ ] MaxMind returns partial response → Missing fields show N/A, no crash
- [ ] API key is wrong → Error toast shown
- [ ] Network disconnect → Error toast shown
- [ ] "Same as billing" checkbox checked → Shipping fields mirror billing and are disabled
- [ ] "Same as billing" checkbox unchecked → Shipping fields become editable
- [ ] Billing changes while checkbox checked → Shipping fields update in real-time
- [ ] Clear Form button → All fields reset, results cleared, checkbox unchecked
- [ ] Copy JSON button → Raw API response copied to clipboard
- [ ] Risk score 0-20 → Green badge displayed
- [ ] Risk score 21-60 → Amber badge displayed
- [ ] Risk score 61-100 → Red badge displayed

## Deployment Steps

### 1. Update .env.local

Replace `your_factors_license_key_here` with your actual MaxMind Factors license key.

### 2. Build Project

```bash
npm run build
```

### 3. Deploy to Vercel

- Push to Git repository
- Connect to Vercel
- Add environment variables in Vercel dashboard
- Deploy

### 4. Configure Custom Domain

- Add `FRIQtool.com` in Vercel dashboard
- Update DNS records as instructed

## Next Steps

1. **Update License Key:** Replace placeholder in `.env.local` with actual MaxMind license key
2. **Test Locally:** Run `npm run dev` and test all scenarios
3. **Build:** Run `npm run build` to verify no errors
4. **Deploy:** Deploy to Vercel and configure environment variables
5. **Test Live:** Verify all functionality works on deployed URL

## Files Created/Modified

### Created Files

- `src/types/minfraud.ts` - TypeScript types
- `src/lib/validators.ts` - Email & IP validators
- `src/lib/buildPayload.ts` - Dynamic payload builder
- `src/lib/maxmindClient.ts` - MaxMind API client
- `src/app/api/minfraud/route.ts` - API route handler
- `src/components/InputForm.tsx` - Input form component
- `src/components/ResultDisplay.tsx` - Results display component
- `src/components/RiskScoreBadge.tsx` - Risk score badge
- `src/components/Loader.tsx` - Loading spinner
- `public/robots.txt` - Crawler blocker
- `.env.local` - Environment variables
- `DEPLOYMENT_CHECKLIST.md` - Deployment guide
- `plans/implementation-plan.md` - Implementation plan

### Modified Files

- `src/app/page.tsx` - Main page
- `src/app/layout.tsx` - Root layout
- `src/app/globals.css` - Global styles
- `package.json` - Added dependencies (via shadcn)

## Compliance with Requirements

✅ No authentication system
✅ No database or data persistence
✅ No external system integrations
✅ Standalone only
✅ Next.js 16.2.1 with App Router
✅ React 19.2.4
✅ TypeScript 5.x with strict mode
✅ Tailwind CSS 4.x
✅ shadcn/ui components
✅ All 40+ output fields rendered
✅ Safe response rendering (optional chaining)
✅ Dynamic payload builder (no empty values)
✅ "Same as billing" checkbox
✅ Risk score color coding
✅ Error handling with toast notifications
✅ Clear Form and Copy JSON buttons
✅ robots.txt blocks all crawlers
✅ API credentials server-only
✅ Vercel deployment ready

## Known Limitations

- Billing and shipping address fields (first name, last name, address, etc.) are NOT echoed back by MaxMind API. Only verification fields (is_in_ip_country, latitude, longitude, distance_to_ip_location) are returned. This is a limitation of the MaxMind API, not our implementation.

## Support

- **MaxMind API Docs:** https://dev.maxmind.com/minfraud/api-documentation/
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Docs:** https://vercel.com/docs

---

**Project Status:** ✅ Ready for Testing and Deployment
