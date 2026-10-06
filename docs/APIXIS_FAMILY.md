# Apixis family notes for Recovra

The family source of truth is ApixisWallet → `AGENTS.md` (decisions D1–D18) and `docs/FAMILY_STATUS.md`.

## AI Receptionist: family add-on (D18). Read before anything phone-related

Approved by Awad on 2026-10-06. The full spec is ApixisWallet → `docs/AI_RECEPTIONIST.md`; if this note disagrees with it, the spec wins.

- Recovra will offer the **AI Receptionist** for **$100/month (10,000 Ixis)**, renewing every 30 days. There is one Wallet SKU for the whole family: `apixis.receptionist.monthly` (app `Family`).
- **Do not build** a receptionist, voice agent, call-answering or phone-number feature in this repo, and **do not add or price** a receptionist SKU here. The one engine lives in Apixis.dev (`/api/receptionist/*`).
- This repo never holds voice-provider or phone-provider keys and never calls those services.
- What this site will get: an "AI Receptionist" card on the signed-in account page, a setup page and a calls page, using `sdk/apixis-receptionist.ts` copied byte-for-byte from Apixis.dev (copy, never fork). Script preset: `general`.
- Every call opens with the recording notice. Illinois requires all-party consent, and the family applies that everywhere.
- **Status here:** Not started. Comes after Awad reviews the Contraxis pilot. Do not start it early.
