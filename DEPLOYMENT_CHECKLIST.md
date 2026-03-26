# Deployment Checklist - MaxMind FRIQ Fraud Analysis Tool

## Pre-Deployment Checklist

- [x] `.env.local` is created and in `.gitignore`
- [x] `robots.txt` contains `Disallow: /` to block all crawlers
- [x] All TypeScript types are defined in `src/types/minfraud.ts`
- [x] Server-side files (`lib/maxmindClient.ts`, `app/api/minfraud/route.ts`) are never imported by client components
- [x] All client components are marked with `"use client"`
- [x] Dynamic payload builder (`lib/buildPayload.ts`) only includes non-empty fields
- [x] API response rendering uses optional chaining everywhere
- [x] "Same as billing" checkbox logic is implemented
- [x] shadcn/ui components are installed (button, input, label, card, checkbox, badge, sonner)
- [x] Toast notifications are configured with sonner

## Before Deploying to Vercel

### 1. Update .env.local with Real Credentials

**IMPORTANT:** Replace the placeholder license key with your actual MaxMind Factors license key.

Edit `.env.local`:

```
MAXMIND_ACCOUNT_ID=1306761
MAXMIND_LICENSE_KEY=<YOUR_ACTUAL_LICENSE_KEY_HERE>
MAXMIND_API_URL=https://minfraud.maxmind.com/minfraud/v2.0/factors
```

### 2. Set Environment Variables in Vercel Dashboard

Go to Vercel Dashboard → Your Project → Settings → Environment Variables and add:

- `MAXMIND_ACCOUNT_ID` = `1306761`
- `MAXMIND_LICENSE_KEY` = `<your_actual_license_key>`
- `MAXMIND_API_URL` = `https://minfraud.maxmind.com/minfraud/v2.0/factors`

**Important:** Do NOT add `NEXT_PUBLIC_` prefix to these variables. They must remain server-only.

### 3. Build and Test Locally

Run the following commands to ensure everything builds correctly:

```bash
npm run build
```

Check for any build errors. If successful, you should see:

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Collecting build traces
✓ Finalizing page optimization
```

Also run TypeScript type checking:

```bash
npx tsc --noEmit
```

This should complete with no errors.

### 4. Test Locally

Start the development server:

```bash
npm run dev
```

Test the following scenarios:

- [ ] Submit form with only IP address
- [ ] Submit form with only email
- [ ] Submit form with all fields
- [ ] Test "Same as billing" checkbox
- [ ] Test invalid email format
- [ ] Test invalid IP format
- [ ] Test empty form submission
- [ ] Verify toast notifications work
- [ ] Verify Copy JSON button works
- [ ] Verify Clear Form button works

### 5. Deploy to Vercel

If you have the Vercel CLI installed:

```bash
vercel --prod
```

Or push to your Git repository and deploy through Vercel dashboard.

### 6. Configure Custom Domain

In Vercel Dashboard → Settings → Domains:

- Add domain: `FRIQtool.com`
- Follow the DNS instructions provided by Vercel

### 7. Post-Deployment Testing

After deployment, test the live URL:

- [ ] Verify the page loads
- [ ] Test form submission with real data
- [ ] Verify API integration works
- [ ] Check browser console for errors
- [ ] Test on mobile devices

## Security Verification

- [x] API credentials are server-only (no `NEXT_PUBLIC_` prefix)
- [x] `.env.local` is in `.gitignore`
- [x] `robots.txt` blocks all crawlers
- [x] No authentication system (as per requirements)
- [x] No database or data persistence (as per requirements)
- [x] All API calls go through `/api/minfraud` route
- [x] Client components never import server-side libs

## Performance Considerations

- The application uses Next.js 16.2.1 with App Router
- Static assets are optimized by Next.js
- Tailwind CSS 4.x provides efficient styling
- shadcn/ui components are lightweight
- No heavy dependencies or unnecessary packages

## Browser Compatibility

The application should work on:

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Monitoring

After deployment, consider setting up:

- Vercel Analytics for traffic monitoring
- Error tracking (optional)
- Uptime monitoring (optional)

## Rollback Plan

If issues arise after deployment:

1. Revert to previous deployment in Vercel dashboard
2. Identify the issue through logs
3. Fix the issue locally
4. Test thoroughly
5. Redeploy

## Support

For issues with:

- **MaxMind API**: Check [MaxMind Documentation](https://dev.maxmind.com/minfraud/api-documentation/)
- **Vercel Deployment**: Check [Vercel Docs](https://vercel.com/docs)
- **Next.js**: Check [Next.js Docs](https://nextjs.org/docs)

## Notes

- The application is designed to be standalone and internal
- No user authentication is required
- All data is transient (not stored)
- The tool is optimized for fraud analysts who need quick, reliable risk assessments
