# South Haven Thriller Flash Mob

A responsive event signup page with required name, email, and phone fields. Registrations are saved to Cloudflare D1.

## Organizer dashboard

Visit `/organizer` to view registrations, refresh the list, and download all entries as CSV. The dashboard and export endpoint require ChatGPT sign-in and a server-side match against `ORGANIZER_EMAIL`. Configure that value in the hosting environment; never put personal registrations in the repository. CSV exports protect against spreadsheet formula injection.

The site currently uses owner-only Sites access. If the event page is made public later, organizer routes still enforce the organizer account check.

## Development

Requires Node.js 22.13 or newer. Run `npm ci` and `npm run dev`. The portable development preview simulates ChatGPT sign-in as `seedy@sites.test`. For local dashboard testing only, set `ORGANIZER_EMAIL=seedy@sites.test` in ignored `.dev.vars`.

Run `npx tsc --noEmit` to check types and `npm run build` to build. Database schema is in `db/schema.ts`; checked-in SQL migrations are under `drizzle/`. Sites owns production D1 binding and migration application.
