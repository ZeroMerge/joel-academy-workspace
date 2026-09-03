# JOEL OS — Roles, Scoping & Access Vault Spec (v1 Addendum)

This document extends `JOEL-OS-architecture-spec.md`. It replaces the simple 4-role model in that
document's §2 with a proper scoped-role mechanism, and adds the credential/access-vault system in full.
Treat this as equally authoritative — read both before building.

---

## 1. The core idea: one mechanism, not one role per job title

JOEL's org chart will keep producing new titles (Past Questions Lead, Filmmaking Function, a future
"Growth Executive" nobody's thought of yet). Hardcoding a system role per title guarantees the
permission system needs a code change every time the org chart changes. Instead, every person's access
is defined by **two things combined**:

```
base_role   +   scope
```

- **base_role** — one of: `admin`, `executive`, `lead`, `contributor`. This determines the *shape* of
  what someone can do (what kind of actions are even possible for them).
- **scope** — which team/domain/sub-function it applies to (e.g. `academic`, `marketing`,
  `past_questions`, `org_wide`). This determines *where* those actions apply.

A person can hold multiple `(base_role, scope)` pairs at once (e.g. someone is `lead` scoped to
`past_questions` and also `contributor` scoped to `marketing`).

### What stays fixed regardless of scope
- **`admin`** is always `org_wide` — there's no such thing as a scoped admin. Full access, always.
- **`executive`**'s *shape* of access never changes by department: cross-team visibility, approval
  rights on major initiatives, access to reports across teams. What changes is only which department's
  reports/initiatives they're *primarily* attached to (their `scope`) — e.g. Academic Executive and
  Product Executive have identical permission shape, different scope tag, and (per your instruction)
  each still sees reports the way the other does — executive-level report access is `org_wide` by
  definition even though their scope label says which department they lead.

  In practice: `executive` scope controls **ownership/primary responsibility**, not **visibility**.
  Visibility for `executive` is always cross-team. This is the one deliberate exception to "scope
  restricts access" — confirmed by you as intentional.

- **`lead`** is the opposite: scope *does* restrict visibility. A `lead` scoped to `academic` sees and
  manages only Academic. A `lead` scoped to `past_questions` (a sub-function within Academic) sees and
  manages only past-questions tasks — narrower than the Academic Lead, not equal to them.

- **`contributor`** scope restricts to their own assigned work within that scope, same as before.

### Why this solves the sub-lead problem
Past Questions Lead, Tutorial Function, Filmmaking Function all become: `lead` scoped to
`past_questions` / `tutorial` / `filmmaking` — sub-scopes nested under `academic`. No new role type,
no code change, just a new scope value in a config table. When JOEL creates a new function next year,
it's a data entry, not a rebuild.

**Scope hierarchy:** scopes can nest (`past_questions` is a child of `academic`). A `lead` scoped to
the parent (`academic`) automatically sees everything in child scopes too. A `lead` scoped only to the
child (`past_questions`) sees only that slice.

---

## 2. Access & Credential Vault

You confirmed: **JOEL OS is the vault.** It stores real credentials, not just metadata pointers. This
is a materially higher security bar than the rest of the system — treat this subsystem with more
paranoia than everything else combined.

### 2.1 What a "resource" is
One unified system, three kinds of resource:
- **Login credentials** — Canva, Figma, Notion workspace, any tool with a username/password or shared
  login.
- **Drive folders/files** — specific Google Drive resources that need controlled access.
- **(Extensible)** — same model should work for anything added later (API keys, other SaaS logins)
  without a redesign.

Every resource has: a name, a type, an **owning scope** (which team/domain it belongs to), and a
designated **approver role** for granting access to it.

### 2.2 Requesting access
1. A contributor (or anyone lacking access) sees a resource exists (name + description visible, actual
   credential hidden) and taps **Request Access**.
2. The request routes to an approver, determined by the resource's configured rule:
   - **Default:** the requester's own **Team Lead**.
   - **Override per resource:** some resources specify a different required approver — e.g. a
     Marketing-owned tool requires the **Marketing Lead** specifically (even if the requester's own
     lead is someone else, in a cross-team request scenario); an **org-wide** resource requires
     **Admin** regardless of requester's team.
3. Approver sees the request with context (who's asking, what team, what resource) and
   grants/denies in one action.
4. On grant, the requester gets access **through the app** — meaning JOEL OS reveals/proxies the
   credential to them within the UI (e.g. a "reveal password" action that's itself logged), not by
   emailing the raw secret.

### 2.3 Auto-expiry
Every grant has an inactivity-based expiry: if a person hasn't used/viewed that credential within a
configured window (e.g. 30 days — confirm your preferred window when we finalize this), access is
automatically revoked and they'd need to re-request. This bounds the blast radius of a stale grant
nobody remembered to revoke.

### 2.4 Security requirements (non-negotiable given JOEL OS is the vault)
- Credentials are stored **encrypted at rest**, never in plaintext in the database.
- Every reveal/view of a credential is written to the audit log — who viewed what, when. This is what
  makes "JOEL OS as vault" defensible instead of reckless: nothing is invisible after the fact.
- Only the credential owner's designated approver (or Admin) can ever see the raw secret during
  granting — the request/approval flow itself should not leak the credential to anyone but the final
  approved requester.
- This subsystem should be built or reviewed with extra care — this is the one part of JOEL OS where
  "move fast" is the wrong instinct. If retrofitting an open-source component (per the original spec's
  §9), a purpose-built open-source **secrets manager** (not a generic CRUD admin panel) is the right
  category to search for and adapt, rather than hand-rolling encryption logic from scratch.

---

## 3. What changes in the original architecture doc

Replace §2 ("Roles & permissions") in `JOEL-OS-architecture-spec.md` with the scoped model above.
Add this document's §2 (Access & Credential Vault) as a new §13, after Notion integration and before
Backups, since it's a similarly load-bearing integration.

Everything else in the original spec (task model, delivery rate, calendar, notifications, phased build
order) stands unchanged.

---

## 4. Still open — confirm before build

1. **Inactivity window for auto-expiry** — 30 days? 14? Different per resource type (e.g. shorter for
   high-sensitivity tools)?
2. **Cross-team access requests** — if a Marketing contributor needs a Product-owned resource, does it
   go to their own Team Lead first (who then escalates), or straight to the resource's designated
   approver?
3. **Scope list** — should I draft the full initial scope tree now (`academic` → `past_questions`,
   `tutorials`, `filmmaking`; `marketing`; `product`; `operations`; `content_strategy`) as a starting
   config table, so Gemini has literal seed data rather than inferring it?
