# MicroManus — client

Next.js 16 frontend for MicroManus, a deep-research AI agent with usage-based billing. Sign in with Google/GitHub (Firebase popup), unlock with a coupon or $5 test-mode Stripe payment, bring your own LLM key, and watch the agent research live — searches, page reads, token usage and running cost stream into the timeline; reports download as typeset PDFs.

The backend (NestJS) lives in its own repo (`micromanus-server`); this app calls it **directly** at `NEXT_PUBLIC_API_URL` (default `http://localhost:5000`) with credentialed CORS — no proxy.

## Run

```sh
npm install
npm run dev        # :3000 — backend must be running on :4000
```

Auth config: the public Firebase web config is in `lib/firebase.ts`. Enable Google + GitHub providers in the Firebase console.
