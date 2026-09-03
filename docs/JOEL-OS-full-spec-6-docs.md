# JOEL OS — Full Build Package (6 Documents)

This is the complete, final source of truth for building JOEL OS. It supersedes and consolidates
`JOEL-OS-architecture-spec.md` and `JOEL-OS-roles-and-access-spec.md` into the standard 6-document
format. Build exactly to this. If anything is ambiguous, stop and ask rather than assume.

---

# 01 — PRD (Product Requirements Document)

**App Name:** JOEL OS

**Tagline:** The operating system that runs JOEL Academy — tasks, people, permissions, and
accountability, in one place.

**Problem:** JOEL Academy coordinates 50+ contributors across six teams (Academic, Product, Marketing,
Operations, Content Strategy, plus Executive oversight) through scattered WhatsApp messages and
spreadsheets. No one has a single view of who's doing what, whether it's on time, or who can access
what. As JOEL scales past 50 people, this breaks down.

**Target User:** A JOEL Academy contributor, team lead, executive, or admin — a student or young
professional, mobile-first (uses phone more than laptop), already lives in WhatsApp daily, needs
something fast and clear, not a heavyweight enterprise tool.

**Core value proposition:** One lightweight system that replaces the *coordination* layer (Zoho +
Calendly + Notion + a task manager) without trying to replace WhatsApp (chat) or Google Drive
(files) — it stays light because it never carries heavy data, only structured records and links.

## Core Features (Must Have)
- Email+password auth, accounts provisioned by Admin only (no self-signup)
- Scoped role system: `admin`, `executive`, `lead`, `contributor` × `scope` (team/sub-function)
- Unique `@handle` per person
- Task engine with configurable per-type workflows (status stages differ by task type)
- Task assignment with live workload + delivery-rate shown to the assigner
- Task submission via link (Google Doc/Drive/Figma — never file upload)
- Contributor-defined milestones/sub-steps within their own assigned task
- Delivery-rate, turnaround-time, revision-rate analytics per contributor (auto-computed)
- Calendar view (personal + team-aggregated) driven by task deadlines
- In-app notification center (system of record)
- WhatsApp group alerts (push-only, throttled, one group per team) via self-hosted gateway
- Notion Bible/SOP/FAQ — cached read-only, on-demand (never live-queried, never written to)
- Credential/access vault: request → approve → auto-expire after 7 days of inactivity
- Full audit log of status changes and credential reveals
- Nightly backup of Supabase to secondary storage

## Nice to Have (v2+)
- Ambassador-facing lightweight surface (explicitly out of scope for v1 — no login at all currently)
- Team leaderboards (delivery-rate is private-to-self in v1, not public ranking)
- Recruitment → onboarding pipeline automation
- Reports/impact-tracking dashboards for Executives
- Analytics on content performance (Content Strategist's "student pain points" system)

## Out of Scope (v1, explicitly)
- No file storage of any kind in JOEL OS — links only, always
- No in-app chat — WhatsApp remains the communication channel
- No public self-registration
- No Ambassador login
- No native mobile app — PWA-installable web app only

## User Stories
- As a **Team Lead**, I want to see a contributor's delivery rate and current workload before I assign
  them a task, so I assign fairly and realistically.
- As a **Contributor**, I want to see only my own tasks and calendar, so I'm never confused about what
  I owe.
- As a **Contributor**, I want to break my task into my own checklist of steps, so I can track my own
  progress toward a deadline.
- As an **Admin**, I want to create an account and have the person get their login by email
  immediately, so onboarding doesn't require me to be online at the same time as them.
- As anyone needing a shared tool login, I want to request access and have it routed straight to that
  resource's owner, so I'm not blocked waiting on the wrong person.
- As an **Executive**, I want cross-team visibility into reports and progress regardless of which
  department I'm attached to, so I can actually oversee the org, not just my one team.

## Success Metrics
- Every task in the org has a clear owner, status, and audit trail — zero "who approved that?" disputes.
- No submitted work is ever lost.
- Delivery-rate data exists for every contributor within their first two completed tasks.
- WhatsApp number never gets banned (throttled, opt-in, group-only).

---

# 02 — TRD (Technical Requirements Document)

**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS. PWA-installable (manifest + service
worker), mobile-first responsive.

**Backend:** Next.js API routes / server actions — this is also where permission checks and workflow
transition rules are enforced (never trust the client).

**Database:** PostgreSQL via Supabase. Row-Level Security enabled on every table as a second
enforcement layer behind backend checks.

**Auth:** Supabase Auth, email+password only. Accounts created server-side by Admin action (invite
flow sends real password by email, not a magic link, not a temp password).

**Hosting:** Vercel (frontend + API routes), Supabase (DB + Auth), small VPS ($3–5/mo) for the
self-hosted WhatsApp gateway (WAHA or Evolution API, Docker).

**Third-party APIs / services:**
- Notion API — read-only, for Bible/SOP/FAQ content, cached into Supabase
- Google Drive — links only, no API write access needed in v1 (contributors paste links manually)
- WAHA / Evolution API — self-hosted WhatsApp gateway for group alerts
- A secrets/encryption library (e.g. `libsodium` or Postgres `pgcrypto`) for the credential vault —
  do not hand-roll encryption

**Key libraries:** Zod (validation), React Query or SWR (data fetching/cache), date-fns (calendar/
deadline logic), Lucide icons.

**Environment variables (names only):**
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NOTION_API_KEY`,
`NOTION_BIBLE_DB_ID`, `WHATSAPP_GATEWAY_URL`, `WHATSAPP_GATEWAY_TOKEN`, `VAULT_ENCRYPTION_KEY`,
`CRON_SECRET` (if any scheduled jobs remain), `BACKUP_TARGET_URL`.

**Constraints:**
- Must work well on mobile first; desktop is secondary but must also work.
- Free-tier infrastructure by default; backend must tolerate Supabase/Render free-tier cold starts
  gracefully (loading states, not errors).
- No file uploads anywhere in the app — enforced at the UI level (link fields only).
- Credential vault fields must be encrypted at rest — never store plaintext secrets.

---

# 03 — App Flow

## Pages List
- `/login` — email + password
- `/dashboard` — role-aware home (different content per role, same URL/shell)
- `/tasks` — task list (scoped to what the role can see)
- `/tasks/[id]` — task detail, including milestones/sub-steps, submission field, status history
- `/tasks/new` — create/assign task (Lead/Admin/Executive only)
- `/calendar` — personal or team-aggregated, depending on role
- `/team` — team roster (Lead+) or "my team" read-only view (Contributor)
- `/people/[handle]` — a person's profile: delivery rate, current load, task history (visible per
  permission rules — self always visible, others visible to their Lead/Admin/Executive)
- `/bible` — cached Notion content, search + browse
- `/vault` — access/credential requests: browsable resource list, request button, "my active grants"
- `/admin` — Admin-only: people, teams, scopes, roles, resources, audit log, system health
- `/notifications` — in-app notification center
- `/profile` — own account settings

## Navigation
Mobile: bottom tab bar (Dashboard, Tasks, Calendar, Vault, Notifications) + profile in a corner menu.
Desktop: left sidebar mirroring the same items, admin section only visible to Admins.

## First Screen
Unauthenticated visitor → `/login` only. No public marketing page needed in v1 — this is an internal
tool, not a product with outside visitors.

## Auth Flow
Admin creates account in `/admin/people` → system emails the person their login email + real password
→ they go to `/login` → land on `/dashboard` scoped to their role(s).

## Core User Journey 1 — Team Lead assigns a task
Lead goes to `/tasks/new` → picks task type (determines workflow) → types `@` to pick assignee → sees
that person's current load + delivery rate inline before confirming → sets deadline, priority,
reviewer (defaults to self) → assigns → contributor gets in-app + WhatsApp-group notification.

## Core User Journey 2 — Contributor completes work
Contributor opens `/dashboard` → sees task due today → opens `/tasks/[id]` → optionally breaks it into
milestones, checks them off as they go → pastes submission link → submits → status moves to
"Submitted" → Lead notified → Lead reviews, approves or requests revision.

## Core User Journey 3 — Requesting tool access
Contributor opens `/vault` → finds "Canva — Marketing" → taps Request Access → request routes straight
to that resource's designated owner (not necessarily their own Team Lead) → owner approves →
contributor can now reveal the credential in-app → grant auto-expires after 7 days of no use.

## Empty States
- No tasks yet: "Nothing assigned to you right now."
- No vault access yet: list of requestable resources, nothing granted.
- Bible not yet synced: show cached-as-of timestamp; if truly first load, a brief loading state while
  the first Notion fetch completes.

## Error States
- Network/Supabase cold-start: loading skeleton, not a hard error, with automatic retry.
- Failed submission write: explicit "not saved, try again" — never a silent failure, given "never lose
  submitted work" is non-negotiable.

## Redirects
After login → `/dashboard`. After logout → `/login`. After task creation → `/tasks/[id]` of the new
task. After account creation (admin flow) → back to `/admin/people` list.

---

# 04 — UI/UX Design Brief

**Aesthetic:** Monochrome, Notion-style. White and black as the base palette — structure and hierarchy
come from typography, spacing, and dividers, not color. Copy Notion's overall restraint: generous
whitespace, quiet UI chrome, content-first.

**Color use — the one deliberate exception:** status labels, pills/tags, and small indicators (task
status, role badges, delivery-rate indicators) may use color, kept short and desaturated/muted — never
loud. Color is reserved *only* for these small functional labels, never for large surfaces, buttons-as-
blocks, or backgrounds. Everything else stays black/white/gray.

**Background:** White (`#FFFFFF`) primary surface, near-black text (`#191919`, Notion's actual text
color, not pure `#000000`). Dark mode optional for v2, not required for v1.

**Text color:** `#191919` primary, a muted gray (Notion's own secondary-text gray) for secondary/muted
text.

**Borders — explicit rule, non-negotiable:** **Never use a solid 1px border as a container/box
outline.** Structure is communicated through:
- **Dividers** — thin horizontal rules between sections/list items (Notion-style, very light gray,
  not a boxed card)
- **Tables** — real table structure for tabular data (task lists, rosters), not bordered divs
- **Whitespace and grouping** — spacing does the work borders would otherwise do
- Cards, where truly needed, use a very subtle background-color shift or shadow, never a stroked
  border, to separate from the page.

**Typography:** A clean humanist sans-serif (Inter is a strong free equivalent for UI text, close to
Notion's own system-font feel). A distinct weight or slightly monospaced treatment for `@handles` and
task IDs is optional, not required.

**Component style:** Flat, not skeuomorphic. Minimal shadow use — Notion uses very subtle shadows only
on floating elements like modals/popovers, never on static page content. Corners rounded moderately
(small radius, roughly 4–6px on most elements), larger only on true pills/tags.

**Key UI patterns:**
- Status shown as a small colored pill/tag (the one color exception above)
- Task lists as real tables with sortable columns, Notion-database-style
- `@mention` picker like Notion's own — inline, searchable, shows a small preview card of the person
  (avatar, name, live stats) as you select them
- Slide-over or modal for task detail on mobile, full page on desktop
- Sidebar navigation on desktop, bottom tabs on mobile

**Reference apps:** Notion (primary reference — copy its layout logic and restraint wholesale), Linear
(for the pill/status-tag treatment specifically).

**Mobile:** Fully responsive, mobile-first build. Bottom tab bar. PWA install prompt shown after first
meaningful action (not immediately on load).

**Accessibility:** Maintain real contrast between the near-black text and white background (naturally
strong in a monochrome system). Status-pill colors must remain legible/distinguishable, and always
paired with a text label — never color alone to convey status.

---

# 05 — Backend Schema

## Identity & Scoping
```
users              (id uuid, handle text unique, email text unique, name text,
                     password_hash text, created_at timestamp, is_active boolean)

scopes             (id uuid, name text, parent_scope_id uuid nullable FK→scopes.id)
                     -- e.g. 'academic' (parent null), 'past_questions' (parent = academic)

user_role_scopes   (id uuid, user_id FK→users.id, base_role text,  -- admin|executive|lead|contributor
                     scope_id FK→scopes.id, created_at timestamp)
                     -- a user can have multiple rows here (multiple role+scope grants)
```

## Work
```
task_types         (id uuid, name text, workflow jsonb)
                     -- workflow = {"statuses": [...], "transitions": {...}}

tasks              (id uuid, task_type_id FK, scope_id FK→scopes.id, title text,
                     description text, assignee_id FK→users.id, created_by FK→users.id,
                     reviewer_id FK→users.id nullable, priority text, status text,
                     start_date date, deadline date, submission_link text nullable,
                     submitted_at timestamp nullable, completed_at timestamp nullable, notes text)

task_milestones    (id uuid, task_id FK→tasks.id, title text, is_done boolean,
                     order_index int, created_at timestamp)
                     -- contributor's own sub-steps, not an approval gate

task_status_log    (id uuid, task_id FK→tasks.id, from_status text, to_status text,
                     changed_by FK→users.id, changed_at timestamp)
```

## Analytics (derived, not manually entered)
```
-- Computed via query/materialized view from tasks + task_status_log, not a manually written table:
-- delivery_rate = completed_on_time / total_completed, per user
-- avg_turnaround = avg(submitted_at - created_at), per user
-- revision_rate = count(status='revision') / total_reviewed, per user
```

## System
```
notifications      (id uuid, user_id FK→users.id, type text, payload jsonb,
                     read_at timestamp nullable, created_at timestamp)

audit_log          (id uuid, actor_id FK→users.id, action text, entity_type text,
                     entity_id uuid, metadata jsonb, created_at timestamp)
```

## Docs mirror (Notion cache — read-only from app's perspective)
```
content_pages      (id uuid, notion_page_id text unique, category text, title text,
                     slug text, body_md text, last_edited_in_notion timestamp,
                     last_synced_at timestamp)
```

## Access Vault
```
vault_resources    (id uuid, name text, type text,  -- 'login' | 'drive_folder' | 'other'
                     owning_scope_id FK→scopes.id, approver_user_id FK→users.id nullable,
                     approver_role text nullable,  -- fallback if no specific user set, e.g. 'admin'
                     description text, created_at timestamp)

vault_secrets      (id uuid, resource_id FK→vault_resources.id,
                     encrypted_value bytea, -- pgcrypto or app-level encryption, never plaintext
                     updated_at timestamp)

vault_grants       (id uuid, resource_id FK→vault_resources.id, user_id FK→users.id,
                     granted_at timestamp, granted_by FK→users.id,
                     last_used_at timestamp nullable, expires_at timestamp)
                     -- expires_at recalculated forward each time last_used_at updates;
                     -- 7 days of no use → access revoked (checked on access + a periodic sweep)

vault_requests     (id uuid, resource_id FK→vault_resources.id, requested_by FK→users.id,
                     status text,  -- pending | approved | denied
                     requested_at timestamp, resolved_at timestamp nullable,
                     resolved_by FK→users.id nullable)
```

## Relationships (key ones)
- `tasks.assignee_id → users.id`, `tasks.scope_id → scopes.id`
- `user_role_scopes.user_id → users.id`, `user_role_scopes.scope_id → scopes.id`
- `vault_requests.resource_id → vault_resources.id` — request routes straight to
  `vault_resources.approver_user_id` if set, else to whoever holds `approver_role` within
  `owning_scope_id`. Routing is always directly to the resource's designated owner, never through the
  requester's own Team Lead by default.

## Auth Provider
Supabase Auth, email+password. JWT carries `user_id`; role/scope grants are looked up server-side
from `user_role_scopes` on each request (not baked into the JWT, since grants can change without
requiring re-login).

## Row-Level Security — plain-language rules
- `tasks`: visible if `scope_id` is within a scope the requesting user holds *any* role in, OR
  `assignee_id = auth.uid()`, OR requester holds `executive`/`admin` (cross-scope visibility).
- `vault_secrets`: never directly selectable by client — only revealed through a server-side function
  that checks for an active, non-expired `vault_grants` row first, and logs the reveal to `audit_log`.
- `content_pages`: readable by any authenticated user (Bible is org-wide reference material).
- `audit_log`: readable by `admin` only.

## Sensitive Fields
- `vault_secrets.encrypted_value` — encrypted at rest, decrypted only server-side at reveal time,
  every reveal logged.
- `users.password_hash` — standard Supabase Auth handling, never touched directly.

---

# 06 — Implementation Plan

**Phase 1 — Setup**
Init Next.js + TypeScript + Tailwind project. Configure Supabase project, env vars. Set up PWA manifest
+ service worker scaffold. Repo structure agreed (feature-folder based, not one giant `components/`
dump).
*Done when:* app deploys to Vercel and renders a blank authenticated shell.

**Phase 2 — Database & Auth**
Write all migrations for Identity/Scoping/Work/System tables above. Enable RLS with the rules listed
in §05. Implement admin-provisioned account creation (server action that creates a Supabase Auth user
+ sends real password by email). Login/logout flow.
*Done when:* an Admin can create a user, that user can log in, and RLS correctly blocks cross-scope
reads in a manual test.

**Phase 3 — Core task engine**
`task_types` with configurable workflow JSON. Task CRUD respecting role/scope rules. Status transition
enforcement (backend validates against `workflow.transitions` before writing). `task_status_log`
writes on every change.
*Done when:* a Lead can create, assign, and move a task through its full configured lifecycle, and the
log reflects every change.

**Phase 4 — Assignment intelligence & analytics**
`@handle` picker with live workload/delivery-rate lookup. Delivery-rate/turnaround/revision-rate
computed views. Milestones (sub-steps) on tasks.
*Done when:* assigning a task shows real computed stats for the candidate assignee, not placeholders.

**Phase 5 — Calendar & notifications**
Calendar view (personal + team-aggregated) from task deadlines. In-app notification center wired to
task events. WhatsApp gateway (WAHA/Evolution) deployed on VPS, wired to team-group alerts for
key events only.
*Done when:* assigning a task produces both an in-app notification and a WhatsApp group message.

**Phase 6 — Notion Bible cache**
`content_pages` table, on-demand fetch-and-cache logic (check cache freshness, fetch from Notion only
if stale), `/bible` browse/search UI.
*Done when:* Bible content loads from cache on repeat visits and updates within the staleness window
after a real Notion edit.

**Phase 7 — Access Vault**
`vault_resources`, `vault_secrets` (encrypted), `vault_grants`, `vault_requests`. Request → route to
resource owner → approve → reveal (logged) → 7-day inactivity auto-expiry job.
*Done when:* a full request-to-reveal-to-expiry cycle works end to end and every reveal appears in the
audit log.

**Phase 8 — Admin panel**
People, teams/scopes, role grants, resources, audit log, system health — all editable without touching
code.
*Done when:* an Admin can create a new scope (e.g. a new sub-function) and assign a Lead to it with no
deploy required.

**Phase 9 — UI polish**
Full pass against §04's design brief: monochrome base, pill/tag color exception, dividers/tables
instead of solid borders throughout, mobile-first responsive check on every page, PWA install prompt.
*Done when:* no page uses a stroked 1px container border anywhere in the app.

**Phase 10 — Backup & deploy hardening**
Nightly backup job to secondary storage. Final env var audit. Cold-start loading states verified on
free-tier Supabase/Render.
*Done when:* a manual restore-from-backup has been tested at least once, and a cold-start doesn't
throw a visible error to a user.

## Overall Done Criteria
Every user story in §01 works end-to-end on both mobile and desktop, no solid borders anywhere, no
file ever gets uploaded to JOEL OS itself, every credential reveal and every status change is in the
audit log, and a fresh Admin-created account can log in and reach a correctly-scoped dashboard with
zero manual database intervention.
