# MicroManus — client

Next.js 16 frontend for MicroManus, a deep-research AI agent with usage-based billing. Sign in with Google/GitHub (Firebase popup), unlock with a coupon or $5 test-mode Stripe payment, bring your own LLM key, and watch the agent research live — searches, page reads, token usage and running cost stream into the timeline; reports download as typeset PDFs.

The backend (NestJS) lives in its own repo (`micromanus-server`); this app reaches it same-origin via the `/api/*` rewrite in `next.config.ts` (`API_URL`, default `http://localhost:4000`).

## Run

```sh
npm install
npm run dev        # :3000 — backend must be running on :4000
```

Auth config: the public Firebase web config is in `lib/firebase.ts`. Enable Google + GitHub providers in the Firebase console.
