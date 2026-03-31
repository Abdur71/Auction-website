# Vercel Deployment Notes

## What Changed

- PHP endpoints are mirrored by Vercel Node functions in `/api`
- Old `.php` request paths are preserved through `vercel.json` rewrites
- Admin login now uses a signed cookie session in Node
- Persistent app state now uses Upstash Redis in production

## Required Vercel Environment Variables

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ADMIN_SESSION_SECRET`

## Optional Environment Variables

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `AUCTION_SHEET_URL`

## Recommended Values

- `ADMIN_USERNAME=admin`
- `ADMIN_PASSWORD=admin123`
- `ADMIN_SESSION_SECRET=` use a long random string

## Important

Without Upstash Redis configured, local JSON fallback works in local development, but production writes on Vercel are not reliable. For real deployment, connect Redis before going live.
