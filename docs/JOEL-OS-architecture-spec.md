# JOEL OS — Architecture & Product Spec (v1)

This is the single source of truth for the build. Any AI agent (Gemini or otherwise) building this
should follow this document exactly rather than inventing structure. If something isn't covered here,
stop and ask rather than guessing.

---

## 0. What this system is

JOEL OS is the internal operating system for JOEL Academy — the "brain" that runs task assignment,
people, permissions, and accountability across all teams. It is **not** a file store, **not** a chat
app, and **not** a documentation tool. Those jobs are delegated on purpose:

| Job | Lives in |
|---|---|
| Structured operational data (people, tasks, teams, permissions, activity) | **Supabase (Postgres)** |
| Files (designs, videos, PDFs) | **Google Drive** — JOEL OS stores only the link |
| Long documents / deliverables (Google Docs) | Contributor's own Drive — JOEL OS stores only the link |
| Human conversation | **WhatsApp** — JOEL OS never replaces chat |
| Bible / SOPs / FAQ / policy | **Notion** — read-only, cached into Supabase on demand |
| Backups | Secondary free DB / Cloudinary snapshot, nightly |

JOEL OS is deliberately lightweight in storage terms — it holds *records and links*, never the actual
heavy files. This is what keeps Supabase free-tier viable even at hundreds of users.

**Design mandate:** no generic "AI dashboard" look. No default 1px/solid borders, no template feel.
Clean, intentional, has a point of view.

---

## 1. Identity & the @tag system

Every person who joins gets:
- A unique `@handle` (like `@sarah`), assigned once, never reused, shown everywhere instead of raw names
  in task assignment UIs.
- An account created **by an admin**, not self-registered. Email + password set by admin, sent via
  email immediately (not a temporary password — the real one).
- A profile that accumulates their own history automatically as they work: no one manually maintains
  a "reputation score."

**Why the @tag matters (this is a real feature, not cosmetic):**
When a Team Lead or Admin is creating a task and typing who to assign, they get an @mention-style
picker. Selecting a person surfaces, inline, before they confirm the assignment:
- Do they already have active tasks, and how many?
- Their **delivery rate** (see §4).
- Their current workload this week.

This turns "who should I assign this to" from a guess into a data-informed decision — this is one of
the core differentiators from a plain task list.

---

## 2. Roles & permissions (plain-language rules)

Roles, confirmed: **Admin, Executive, Team Lead, Contributor.** A person can hold more than one role
(e.g. a Team Lead who is also an Executive) — role is not mutually exclusive, it's a set of grants a
person has.

**Admin**
- Full access: create/edit/deactivate any account, assign roles, edit teams, view all tasks across all
  teams, view audit log, configure workflows.
- Multiple admins exist simultaneously — no single point of failure.

**Executive**
- Cross-team visibility: sees status/progress at the project and team level, not necessarily every
  individual task by default.
- Can approve major initiatives, resolve cross-team escalations.
- Does not manage individual contributor accounts (that's Admin).

**Team Lead**
- Full visibility and control **only within their own team**. Zero visibility into other teams' tasks
  by default.
- Creates tasks, assigns them to contributors on their team, reviews submissions, approves/requests
  revision, sees their team's delivery-rate leaderboard and weekly roster.

**Contributor**
- Sees only what's assigned to them: their tasks, their calendar, their own delivery-rate stats, team
  announcements relevant to them.
- Cannot assign tasks to others. Cannot see other contributors' task details, only (optionally) that
  they exist on the same team.
- Can break their own assigned task into personal sub-steps/milestones (see §3) to track their own
  progress — this is for their own clarity, not a new approval layer.

**Enforced in two places, always:** the backend rejects any write that violates these rules
*before* touching the database, and the database itself (Row-Level Security) rejects it a second time
even if the backend had a bug. Neither layer trusts the other alone.

---

## 3. Task model

**Creation:** Only Team Leads and Admins create and assign tasks. Contributors do not self-create
tasks in v1 (keeps accountability crisp — no ambiguity about who authorized what).

**Assignment:** One task → one primary assignee (keeps accountability unambiguous). A task has an
optional reviewer (defaults to the assigning Team Lead if not set).

**Submission:** A task is completed by submitting a **link** — Google Doc, Drive folder, Figma,
whatever fits the task type. JOEL OS never hosts the file itself.

**Milestones / sub-steps:** A contributor can break their assigned task into their own checklist of
steps (e.g. "Research → Draft → Design → Final review") to track progress visibly. This is personal
task-management scaffolding, not a second approval chain — the Team Lead still only reviews the final
submission, but can *see* the sub-step progress if they want a sense of where things stand before the
deadline.

**Status lifecycle — configurable per task type, not hardcoded:**
Each *task type* (Academic resource, Marketing asset, Product task, Ops item, etc.) has its own
sequence of statuses and legal transitions between them, stored as configuration, not code. Example:

- Academic: `Not Started → Processing → Verification → Approved → Archived`
- Marketing: `Assigned → In Progress → Submitted → Revision → Approved → Delivered → Published`

Adding a new task type later, or changing a workflow, is a config change — never a rebuild.

**Every status change is logged**: who changed it, from what, to what, when. This is your answer to
"I never approved that" disputes, and it's the raw data behind delivery rate.

---

## 4. Delivery rate & accountability (the analytics layer)

This is the "not just a list of users and a DB" part — the system should function like a lightweight
Zoho/Calendly hybrid, not a static table.

For every contributor, computed automatically from task history (never manually entered):
- **Delivery rate**: % of tasks completed by their original deadline.
- **Current load**: how many active tasks right now.
- **Turnaround time**: average time from assignment to submission.
- **Revision rate**: how often their submissions get sent back for revision (quality signal).

This data surfaces in two places:
1. To the **assigning Team Lead/Admin**, at the moment of assigning a new task (informs who to pick).
2. To the **contributor themselves**, on their own dashboard (self-accountability, not surveillance —
   they see their own stats, not a public ranking, unless you later decide a team leaderboard is
   wanted).

---

## 5. Calendar

Every contributor sees a calendar view of their own tasks by deadline — this is the Calendly/Google
Calendar-like layer. Team Leads see their team's calendar aggregated (who has what due when). No
external calendar sync needed in v1 — this can be a view generated directly from task deadlines, not
a separate calendar system to maintain.

---

## 6. Notifications — two channels, two jobs

**In-app notification center (system of record):** every event that matters (assigned, due soon,
approved, sent back for revision) creates a notification row. This is always accurate and always
available even if WhatsApp fails.

**WhatsApp (the alert layer, not the record):** a self-hosted gateway (WAHA / Evolution API on a small
VPS) pushes a message to the *relevant team's WhatsApp group* — not DMs to individuals, and not every
event, only the ones worth an interruption (new assignment, deadline approaching, urgent revision).
Kept deliberately throttled and targeted to avoid WhatsApp's anti-spam detection banning the number.
One group per team, configured once, not dynamic per-task — simplest thing that can't misfire.

---

## 7. Notion integration (Bible/SOP/FAQ only)

- Notion is **never** written to by the app, and never live in a user's request path.
- First request for a given Bible/FAQ page checks Notion, caches the result into Supabase with a
  timestamp. Subsequent requests for the same page are served from the Supabase cache until it's stale
  (proposed: 1 hour — fine for policy docs that aren't urgent).
- Nothing operational (tasks, people, permissions) ever lives in Notion.

---

## 8. Backups

Nightly export of the Supabase database to a secondary location (a second free DB, or a Cloudinary/S3
snapshot). This is non-negotiable given free-tier Supabase has no built-in backup guarantee.

---

## 9. Build approach: retrofit, don't build from zero

Given the ambition ("our own Zoho + Calendly + Notion + task manager"), the fastest path to something
sturdy is **not** writing every layer from scratch. Look for open-source projects to fork/retrofit for
the pieces that are commodity problems, and reserve custom code for what's actually JOEL-specific
(the role/permission model, the delivery-rate logic, the @tag assignment picker, the Notion/WhatsApp
glue).

Categories worth searching GitHub for before building from scratch:
- **Kanban/task engine** with configurable workflows (e.g. Plane, Taiga, Focalboard-style projects) —
  retrofit their task/status model rather than reinventing one.
- **Notification center** components (many open-source admin dashboards ship one).
- **Calendar view** components — this is a solved, low-risk problem; don't hand-roll date math.

Anything touching permissions, delivery-rate computation, or the WhatsApp/Notion glue should be custom
— that's the actual product, not a commodity.

---

## 10. Phased build order

**Phase 1 — Foundation (must work before anything else)**
Auth (email+password, admin-provisioned) → People/Teams/Roles → Permissions engine (RLS + backend
checks) → Task engine with configurable workflows → basic Dashboard per role → in-app notifications.

**Phase 2 — The differentiators**
@tag assignment picker with live workload/delivery-rate surfaced → delivery-rate computation engine →
milestones/sub-steps on tasks → calendar view.

**Phase 3 — Team-specific workflows**
Academic, Marketing, Operations, Product, Content Strategy each get their configured task-type
workflows plugged into the Phase 1 engine (config, not new code).

**Phase 4 — Integration layer**
Notion caching layer for Bible/FAQ → WhatsApp gateway (WAHA/Evolution API) wired to team groups →
nightly backup job.

**Phase 5 — Org growth features**
Recruitment → onboarding pipeline → reports/impact tracking. (Ambassadors deliberately excluded from
all phases — out of scope, no login, not this system's problem.)

---

## 11. Non-negotiables (repeat, so nothing drifts during build)

- A contributor's submitted work is never lost. Submission = writing a link to Supabase; that write
  must be transactional and confirmed before the UI reports success.
- No one ever sees or edits something outside their role's grant — enforced at both backend and DB
  level, always.
- No AI-generated visual clutter, no default template look.
- Supabase never holds heavy files — links only.
- Notion and WhatsApp are integrations, not dependencies the core system can be broken by.
