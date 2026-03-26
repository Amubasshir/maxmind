# AGENT.md — MaxMind FRIQ Fraud Analysis Tool

This file is the single source of truth for any AI agent (Cursor, Claude Code, etc.) working on this project.
Read it fully before writing a single line of code.

---

## 1. Project Summary

A secure, standalone, internal fraud risk analysis tool. The analyst enters order/customer data, submits it to MaxMind's minFraud Factors API, and sees the full fraud analysis response in a clean UI.

**No auth. No database. No external system integrations. Standalone only.**

Full requirements are in `PRD_MaxMind_Fraud_Tool.md`. When in doubt, the PRD wins.

---

## 2. Exact Stack — Do Not Deviate

| Layer         | Technology   | Version                  |
| ------------- | ------------ | ------------------------ |
| Framework     | Next.js      | **16.2.1**               |
| Runtime       | React        | **19.2.4**               |
| Language      | TypeScript   | 5.x                      |
| Styling       | Tailwind CSS | **4.x**                  |
| UI Components | shadcn/ui    | latest (to be installed) |
| Deployment    | Vercel       | —                        |

---

## 3. Critical Version Warnings

### Next.js 16.2

- Uses the **App Router** exclusively. Never use `pages/` directory.
- Server Components are the default. Mark client components explicitly with `"use client"` at the top of the file.
- Route Handlers live in `app/api/[route]/route.ts`, not `pages/api/`.
- `next.config.js` is now `next.config.ts` (TypeScript native).
- Read `node_modules/next/dist/docs/` before using any Next.js API — do not rely on training data for Next.js internals.

### React 19

- `use client` directive is required for any component using hooks (`useState`, `useEffect`, etc.) or browser APIs.
- Do not use legacy React patterns (class components, `React.FC`, `PropTypes`).
- Server Actions are available but not used in this project — all API calls go through the `/api/minfraud` route handler.

### Tailwind CSS 4

- **No `tailwind.config.js` file** — Tailwind 4 uses CSS-native configuration via `@import "tailwindcss"` in the global CSS file.
- Do not create a `tailwind.config.js` or `tailwind.config.ts` — it will be ignored or cause conflicts.
- PostCSS config uses `@tailwindcss/postcss` plugin (already in devDependencies).
- All Tailwind utilities work as expected — the API is the same, only the config method changed.

### TypeScript

- Strict mode must be on (`"strict": true` in `tsconfig.json`).
- All props, API payloads, and response shapes must be typed. No `any` except where explicitly noted in the PRD payload builder.

---

## 4. Project Structure

Build exactly this structure — do not add, rename, or reorganize:

```
/app
  layout.tsx                  ← Root layout, imports global CSS
  page.tsx                    ← Main page: renders InputForm + ResultDisplay
  globals.css                 ← Tailwind 4 imports + CSS variables
  /api
    /minfraud
      route.ts                ← POST handler — the ONLY file that calls MaxMind

/components
  InputForm.tsx               ← Full form (all four sections)
  ResultDisplay.tsx           ← All output sections, safe rendering
  RiskScoreBadge.tsx          ← Color-coded risk score display
  Loader.tsx                  ← Spinner / loading state

/lib
  buildPayload.ts             ← Dynamic payload builder (core logic — see PRD §5)
  maxmindClient.ts            ← Constructs Basic Auth header, calls MaxMind API
  validators.ts               ← Email format + IPv4/IPv6 validators

/types
  minfraud.ts                 ← All TypeScript types: FormData, MaxMindPayload, MaxMindResponse

/public
  robots.txt                  ← Must contain: User-agent: * / Disallow: /

.env.local                    ← Never committed. See §6 below.
AGENT.md                      ← This file
PRD_MaxMind_Fraud_Tool.md     ← Full product requirements
```

---

## 5. Architecture Rules

### Server vs Client boundary

| File                            | Type                        | Reason                                          |
| ------------------------------- | --------------------------- | ----------------------------------------------- |
| `app/page.tsx`                  | Server Component            | No hooks needed at page level                   |
| `app/api/minfraud/route.ts`     | Server (Route Handler)      | Must stay server — holds API credentials        |
| `components/InputForm.tsx`      | **Client** (`"use client"`) | Uses `useState`, form events                    |
| `components/ResultDisplay.tsx`  | **Client** (`"use client"`) | Conditional rendering from state                |
| `components/RiskScoreBadge.tsx` | Client or Server            | No hooks, can be either                         |
| `lib/buildPayload.ts`           | Server-only import          | Called from route handler only                  |
| `lib/maxmindClient.ts`          | Server-only import          | Holds auth logic — never import in client files |
| `lib/validators.ts`             | Client + Server             | Pure functions, safe to import anywhere         |

### The one unbreakable rule

`lib/maxmindClient.ts` and `app/api/minfraud/route.ts` must **never** be imported by any client component. If a client component needs to call the API, it does so via `fetch('/api/minfraud', ...)` — never by importing server-side libs directly.

---

## 6. Environment Variables

File: `.env.local` (never commit this file — confirm it is in `.gitignore`)

```
MAXMIND_ACCOUNT_ID=1306761
MAXMIND_LICENSE_KEY=your_factors_license_key_here
MAXMIND_API_URL=https://minfraud.maxmind.com/minfraud/v2.0/factors
```

Rules:

- **No `NEXT_PUBLIC_` prefix** on any of these. They are server-only.
- Access via `process.env.MAXMIND_ACCOUNT_ID` inside route handlers and server libs only.
- Never reference these variables in any file marked `"use client"`.
- In Vercel: add all three under Project Settings → Environment Variables before deploying.

---

## 7. Installing shadcn/ui

shadcn/ui is not yet installed. Run this once before building any components:

```bash
npx shadcn@latest init
```

When prompted:

- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Then install the components you need as you build:

```bash
npx shadcn@latest add button input label card checkbox toast badge
```

Do not install the entire component library at once. Add only what is used.

---

## 8. The "Same as Billing" Checkbox

This is a required UX feature. Implement it exactly as described here.

- The checkbox sits at the **top of the Shipping Address section**, above all shipping fields.
- Label: `"Same as billing address"`
- Default state: **unchecked**
- When **checked**: shipping fields mirror billing fields in real-time and are visually disabled (dimmed, not editable)
- When **unchecked**: shipping fields become editable again; mirrored values remain but can be changed
- If billing fields change while checkbox is checked: shipping fields update instantly
- On **Clear Form**: checkbox resets to unchecked, shipping fields clear

Implementation pattern:

```typescript
const [sameAsBilling, setSameAsBilling] = useState(false);

const shippingValues = sameAsBilling ? billingValues : shippingFormState;
```

The payload builder receives resolved `shippingValues` — it does not care whether the checkbox was used.

---

## 9. Dynamic Payload Builder Rules

The payload builder (`lib/buildPayload.ts`) is the most critical piece of logic. Follow these rules exactly:

1. Every field is optional — never assume a field exists
2. Only include a field in the payload if it has a non-empty trimmed string value
3. Never send `""`, `null`, or `undefined` to the API
4. Build nested objects (billing, shipping) only if at least one sub-field is present
5. The full implementation spec is in PRD §5 — copy it exactly

---

## 10. Safe Response Rendering Rules

The API response may be partial — any field may be absent. Follow these rules in `ResultDisplay.tsx`:

- Always use optional chaining: `response?.ip_address?.country?.iso_code`
- Always use nullish coalescing: `?? "N/A"`
- If a section is entirely absent from the response: show the section header with all fields as `"N/A"` — do not hide the section
- Never use `response.anything` without the `?.` guard
- Boolean flags (`is_tor_exit_node`, etc.) default to `false` if absent: `?? false`

---

## 11. All Output Fields to Render

These come directly from the client's specification. All must be in `ResultDisplay.tsx`. All must handle missing data.

**Risk:** Risk Score, Risk Score Reasons
**IP:** Country, City, Postal Code, Latitude, Longitude, Time Zone, ISP, Organization, Domain, User Type, Risk
**Anonymity:** Is Anonymous, Is Anonymous VPN, Is Hosting Provider, Is Public Proxy, Is Residential Proxy, Is Tor Exit Node
**Email:** Address, Domain, First Seen, Is Free, Is High Risk, Confidence, Risk
**Billing Address:** First Name, Last Name, Address, City, Region, Postal, Country, Is in IP Country, Latitude, Longitude, Distance to IP Location
**Shipping Address:** same fields as billing
**Billing Phone:** Number, Country, Type, Is Valid
**Shipping Phone:** Number, Country, Type, Is Valid

---

## 12. Risk Score Color Coding

| Score    | Color | Tailwind Class               |
| -------- | ----- | ---------------------------- |
| 0 – 20   | Green | `text-green-600 bg-green-50` |
| 21 – 60  | Amber | `text-amber-600 bg-amber-50` |
| 61 – 100 | Red   | `text-red-600 bg-red-50`     |

Display the score prominently — large font, color-coded badge, at the very top of results.

---

## 13. Error Handling

| Scenario                  | UI Response                                                         |
| ------------------------- | ------------------------------------------------------------------- |
| Empty form submit         | Inline warning: "Enter at least one field to analyze" — no API call |
| Invalid email format      | Inline field error                                                  |
| Invalid IP format         | Inline field error                                                  |
| MaxMind API 4xx/5xx       | Toast: "Analysis failed. Please check your inputs and try again."   |
| Network failure           | Toast: "Connection error. Please try again."                        |
| Missing field in response | Show "N/A" — never throw                                            |

---

## 14. What NOT to Build

Do not build any of the following — they are explicitly out of scope:

- Login / authentication
- Database or any data persistence
- Saving or viewing previous results
- Bulk / CSV upload
- Analytics or reporting dashboard
- Transaction amount or currency fields
- Any integration with external systems

If a feature is not in the PRD, do not build it.

---

## 15. Deployment Checklist

Before pushing to Vercel:

- [ ] `.env.local` is in `.gitignore` and not committed
- [ ] All three env variables are set in Vercel dashboard
- [ ] `robots.txt` contains `Disallow: /`
- [ ] `next build` completes with zero errors
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] All 10 test cases from PRD §15 pass manually
- [ ] Custom domain `FRIQtool.com` is configured in Vercel
