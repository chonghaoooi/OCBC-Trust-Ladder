# Banking Agent demo

Run both websites with one command from the project root:

```sh
npm run demo
```

- Banker assistant: http://localhost:4180/
- TrustLadder dashboard: http://localhost:4181/

The dashboard replaces the engineer terminal with Inbox, Review queue, Agent
health, and Live activity. It contains the seven PRD cases, five-check details,
highlighted source drawers, supervisor decisions, a three-second re-test, and
the repaired-agent re-run. The banker assistant reads the scripted fix state from the
dashboard before a late-fee request. Reset demo (or Shift + R) restores the story.
The assistant is for bank staff. It helps assess eligibility, look up policies,
check account information, and prepare drafts; it is not a customer self-service site.
Card Servicing, Payments, and Policy each have their own conversation and activity
history. Select an agent on Live activity to see only its requests and outcomes.

The two sites use a shared local event relay, so they can be opened in separate
tabs or different browsers. The engineer feed replays up to 500 recent events
when opened and reconnects automatically. History resets when the server restarts.

This is a scripted prototype with synthetic account data, simulated tool calls,
and no real banking actions or model. Both servers listen on the local machine.

## Standalone offline dashboard

`npm run build` also creates `dist/trustladder-offline.html`. Double-click that
file to run the complete dashboard without a server or Internet. In this mode,
the activity feed records dashboard actions and can play its own scripted example;
the separate banker-assistant connection is available when using `npm run demo` instead.

## Volunteer judgement test

Open `?mode=plain` for reply plus source, or `?mode=assisted` for the TrustLadder
panel. Each mode contains 10 synthetic replies (5 correct, 5 flawed), with
working source drawers. Decisions and time per reply are measured locally and
can be downloaded as JSON. Results are cleared on reload; download before leaving.
No volunteer results are prefilled. Assign the modes and counterbalanced reply
sets according to the study plan; do not describe the synthetic checker scores
as measured proof.
