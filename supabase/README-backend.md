# SketchClash — Supabase backend (starting point, NOT yet wired into the client)

This folder is the server-side hardening that pairs with the client-side audit
fixes. **Status: apply-ready migration + docs. It is not imported anywhere in
`src/` yet.** The app still runs entirely on Supabase *Realtime* (broadcast +
presence) with no database.

## What already protects the game (shipped in the client)

1. **Room-token gate (shipped).** On create, the room mints a high-entropy
   `roomToken`; the invite link carries it as `?t=`; the *remote* Supabase
   channel name is `sketchclash_room_<CODE>_<TOKEN>`. A stranger who knows only
   the (wide) room code cannot reach the channel, which closes the code-scan
   enumeration and room-full DoS vector. Local same-device tabs stay
   code-named (trusted). See `src/services/supabase.ts` (`remoteName`) and
   `src/hooks/useRoomConnection.ts` (token mint/read).
2. **Deterministic host election + presence projection + wall-clock timers** —
   see the audit report.

## What this folder adds (the DB/RLS layer)

`migrations/0001_room_authority.sql` creates three tables that move
authoritative state off "whichever client claims to be host" and onto
server-enforced rows:

| Table | Purpose |
|---|---|
| `rooms` | Authoritative room config + `owner_id` + `room_token`. |
| `room_members` | Membership rows (`room_code` + `user_id` + `joined_at`). This is the RLS membership key — everyone else is a stranger. |
| `room_state` | Authoritative `GameState` as `jsonb` with a monotonic `version`, so cross-client ordering/anti-stale (the earlier `_seq`/dedupe findings) is enforced server-side instead of per-tab. |

## The one prerequisite you must decide (this is why it's a "starting point")

The app currently uses **anonymous per-tab identities** (`sessionStorage`), so
`auth.uid()` is `null` and RLS policies can't distinguish a member from a
stranger. To make the RLS policies in this migration *enforceable*, pick one:

- **Option A — enable Supabase Auth (recommended for open rooms).** Sign each
  player in (magic link / OAuth). Then `auth.uid()` is real, `room_members`
  gates who can read/write, and the host is the `rooms.owner_id`. This is the
  only configuration that is actually secure against anonymous cheaters.
- **Option B — keep anon tabs, gate on `room_token` claims.** Present the room
  token as a custom JWT claim and have RLS check it. Supabase's static
  **anon** key cannot carry per-user custom claims, so this only works if every
  client authenticates with a *per-tab JWT* issued by an Edge Function that
  signs the token in. More moving parts than A.

Until you enable Auth (Option A) or wire the Edge Function (Option B), the
**token gate from the shipped client code is the active defense**, and these
tables are dormant scaffolding.

## Applying it

```bash
# from a Supabase project (CLI or SQL editor)
supabase db push            # or paste the SQL file into the SQL editor
```

Then, to actually use it, the client `RealtimeRoomService` would:
- `insert` into `rooms`/`room_members` on create/join (idempotent),
- read authoritative state via `room_state` (with RLS), and
- replace the "first game_state_sync claims host" path with
  "host = `rooms.owner_id`".

That last refactor is intentionally **not done here** — it changes the core
state machine and only makes sense once you've committed to Option A/B. The
migration is provided so that step is a clean diff later.
