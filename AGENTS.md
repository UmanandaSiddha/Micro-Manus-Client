<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MicroManus client

Frontend of the MicroManus deep-research agent. **Spec: `../docs/frontend.md`** (pages, timeline, state rules) + `../docs/api.md` (endpoints + the frozen SSE event contract). Root context: `../CLAUDE.md`.

## Rules of this app

- Pure API client. All data via `fetch('/api/…')` — same-origin through the rewrite in `next.config.ts` (`/api/:path*` → `http://localhost:4000/:path*`). No API routes, no server secrets, no direct DB access, nothing `NEXT_PUBLIC_` secret-shaped.
- Auth: Firebase `signInWithPopup` (`lib/firebase.ts` — public web config) → `POST /api/auth/session { idToken }` → backend sets the httpOnly cookie. After that exchange the app never touches Firebase state; session = cookie only.
- Live runs: `new EventSource('/api/chat/runs/{id}/events')`. The server replays persisted steps on connect — the timeline component renders persisted steps and live events through the same code path.
- State: no state library. `me` context (user/credits/hasKey) + local state + plain fetch hooks.
- Styling: Tailwind 4 only, no component library. Dark chat UI, system fonts.
- Route guards (client-side, from `/api/me`): no session → `/`; no credits & no purchase/coupon → `/paywall`; no API key → banner pointing to `/settings`.
- Deps allowed: `react-markdown` + `remark-gfm`. Anything else needs justification.

