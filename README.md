# South Haven Thriller Flash Mob

A responsive event signup page with required name, email, and phone fields. Registrations are saved to Cloudflare D1.

## Organizer dashboard

Visit `/organizer` to view registrations, refresh the list, and download all entries as CSV. The Sites dashboard requires organizer sign-in. The Vercel dashboard uses a private access link, with no login required. Configure that value in the hosting environment; never put personal registrations in the repository. CSV exports protect against spreadsheet formula injection.

The site currently uses owner-only Sites access. If the event page is made public later, organizer routes still enforce the organizer account check.

## Development

Requires Node.js 22.13 or newer. Run `npm ci` and `npm run dev`. The portable development preview simulates ChatGPT sign-in as `seedy@sites.test`. For local dashboard testing only, set `ORGANIZER_EMAIL=seedy@sites.test` in ignored `.dev.vars`.

Run `npx tsc --noEmit` to check types and `npm run build` to build. Database schema is in `db/schema.ts`; checked-in SQL migrations are under `drizzle/`. Sites owns production D1 binding and migration application.

## Vercel

`vercel.json` selects standard Next.js output and runs `npm run build:vercel`. The existing `npm run build` remains the Sites/Cloudflare build.

Vercel submits validated registrations server-to-server to the existing private Sites backend, preserving one database. Configure `SITES_SERVICE_TOKEN` as a server-only Vercel environment variable from the private Site service credential. Never use a `NEXT_PUBLIC_` prefix or commit the token. Missing credentials fail safely without claiming the signup was saved.

On Vercel, open `/organizer/access?key=YOUR_PRIVATE_ACCESS_KEY` once to establish a secure, HttpOnly organizer cookie. The browser redirects to `/organizer` without leaving the key in the address bar. All organizer data and CSV endpoints check organizer access server-side. Configure the same `ORGANIZER_ACCESS_KEY` secret on Sites and Vercel production. Treat the private link like a password: anyone receiving it can view and export contact details. Rotate the shared key to revoke existing links and cookies. The backend remains private; its service credential is never sent to the browser.

## PIN-protected event notices

Organizer entries can be selected across pages (up to 500 per notice). Unlock the mailer with a six-digit PIN, compose a plain-text event notice, and review the recipients and message before sending. Only registered participant IDs are accepted; the server looks up addresses and removes duplicate emails. Every recipient gets a separate email. Sending is disabled until the delivery service is configured.

On Sites only, configure server secrets `MAILER_PIN_HASH` (SHA-256 hex digest of the six-digit PIN), `RESEND_API_KEY`, and `NOTICE_FROM_EMAIL` (a Resend-verified sender). These are never exposed in client JavaScript. Vercel proxies through the existing private organizer backend and does not need an extra service credential. The checked-in D1 migration limits wrong PIN attempts to five per 15-minute window. The PIN is verified again for each send. Notice retries retain the same request ID and Resend idempotency keys; retry the unchanged notice within 24 hours after a timeout or partial acceptance. Acceptance by the provider is not a guarantee of inbox delivery.
