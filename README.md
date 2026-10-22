# TrustLadder

A clickable prototype for bank staff to review banking-agent drafts, inspect
evidence, make supervisor decisions, and follow each agent's activity.

Built for the OCBC Ignite Innovation Challenge: Trusted AI Agents.

## The two workspaces

- **Dashboard (`/`)**: Inbox, Review queue, Agent health, and per-agent Live activity.
- **Banker assistant (`/banker/`)**: Card Servicing, Payments, and Policy agents for
  account checks, waiver assessments, policy summaries, and payment preparation.

The hosted version runs entirely in the browser. Open both pages in tabs of the
same browser to see requests stream into the matching agent's activity feed.
Events and the scripted fix state are shared only within that browser profile;
different visitors and devices have independent demos. Recent activity expires
after one hour, and Reset demo clears it immediately.

## What is simulated

All accounts, policies, tool responses, claims, five-check verdicts, charts, trust
levels, and re-test scores are scripted synthetic data. There is no AI model,
bank connection, payment execution, or actual customer communication.

The judgement-test mode records real choices and elapsed time in the visitor's
current session. It does not contain prefilled volunteer results or measured
checker-accuracy claims.

## Run locally

Use Node.js 20 or newer:

```sh
npm ci
npm run test:demo
npm run build
npm run preview
```

Open the printed preview URL for the dashboard and append `/banker/` for the
assistant. These routes use the same browser-only transport as the hosted site.

For the original two-port local relay, run `npm run demo` instead:

- Banker assistant: http://localhost:4180/
- Dashboard: http://localhost:4181/

## Presenter walkthrough

1. Open Tan Wei Ling: the draft is Rejected because the account is 70 days overdue.
2. View the eligibility evidence and expand the five checks and skipped agent step.
3. Send the verified suggested reply (demo only).
4. In Review queue, Agree on Ahmad Rizal, then Disagree on Priya Nair to add test #46.
5. In Agent health, Apply and re-test: 35 → 41 of 46, Fixed 6, Broke 0.
6. Return to Tan Wei Ling and Re-run agent: the corrected decline is Verified.
7. Use Reset demo or **Shift + R** to start again.

Live activity has separate views for Card Servicing, Payments, and Policy. Each
also has a built-in scripted example that can run without opening the assistant.

## Judgement test and offline copy

- `?mode=plain`: 10 synthetic replies with source access.
- `?mode=assisted`: the same replies with the TrustLadder assessment.
- Five replies are correct and five flawed; session decisions and timings can be
  downloaded as JSON. Download before reloading, because results are not persisted.
- `npm run build` creates `dist/trustladder-offline.html` with application, fonts,
  and styles embedded. The offline file includes the dashboard and scripted
  examples; the hosted banker-assistant connection needs the two same-origin tabs.

## Vercel

`vercel.json` builds the Vite app into `dist`. The build also packages the banker
assistant at `/banker/`. No environment variables or paid services are required.
The GitHub source branch is `main`. Production can be deployed from a linked
checkout with `vercel --prod`. Automatic deployments from GitHub require the
Vercel GitHub integration to be granted access to this repository.
