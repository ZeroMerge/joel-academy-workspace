# JOEL OS: Complete Feature Inventory (Phases 1-9)

This document outlines every functional engine and module currently built, running, and accessible within JOEL OS, broken down by architectural layer.

---

## 1. Core Identity & Access Control

*How the system knows who you are and what you can see.*

*   **Scoped Role System:** A matrix of roles (`admin`, `executive`, `lead`, `contributor`) multiplied by Departments/Scopes (e.g., "Marketing", "Operations"). 
    *   *Contributors* only see tasks and data within their assigned scope.
    *   *Leads* manage their scope's resources and users.
    *   *Executives* have cross-scope read access and project sign-off authority.
    *   *Admins* have absolute god-mode.
*   **Profile & Availability Settings (`/profile`):** Users can manage their name and dynamically set their capacity status (`Available`, `Limited`, `Unavailable`) along with an expected return date. This directly alters how Leads view them in the capacity planning screens.

## 2. The Task & Execution Engine

*The beating heart of daily work.*

*   **Task Lifecycle (`/tasks`):** Tasks move strictly through `todo` → `in_progress` → `in_review` → `approved`/`rejected`. 
    *   Contributors can only move tasks to `in_review`.
    *   Only the designated `reviewer_id` (usually a Lead) can move it to `approved`.
*   **Milestones:** Granular, checkable sub-steps attached to a parent task. Progress automatically updates the parent task's completion percentage.
*   **Collaborators:** Beyond the primary assignee, multiple secondary users can be tagged as collaborators on a task.
*   **Task Templates:** Standardized, repeatable structures for recurring work (e.g., "Standard Video Edit" or "Weekly Social Post") that Leads can quickly instantiate.

## 3. High-Level Strategy & Projects

*How large initiatives and cross-team workflows are handled.*

*   **Projects & Campaigns (`/dashboard`):** Groups of tasks spanning multiple scopes. These feature **Executive Sign-Offs**—critical junctures in a campaign that freeze progress until an Executive explicitly hits "Approve".
*   **Cross-Team Requests (`/requests`):** The formal handoff mechanism. If an Academic Lead needs a graphic from Marketing, they file a request here. The Marketing Lead receives it, reviews the brief, and can either "Decline" or "Accept" (which automatically spins up a real task in the Marketing scope).
*   **Product Idea Pipeline (`/product-ideas`):** A rigid funnel for vetting new JOEL offerings. Ideas move from `Draft` → `Review` → `Approved` (which triggers a Project) or `Rejected`.

## 4. Scope-Specific Workspaces

*Tailored views for specific operational departments.*

*   **Marketing Design Queue (`/marketing`):** A highly visual, minimalist kanban board designed specifically for creatives. It strips away heavy metadata and focuses purely on the brief, the assets, and the deadline.
*   **Operations Publishing (`/operations`):** A grid built for the social team. Includes multi-select checkboxes for distribution channels (Instagram, YouTube, X) and post-mortem fields for pasting in analytics after a post goes live.

## 5. Security & Knowledge

*How sensitive data and foundational rules are managed.*

*   **The Access Vault (`/vault`):** A secure, centralized password manager. 
    *   Contributors click "Request Access" for a specific credential (e.g., the Instagram password).
    *   The Lead receives a notification and approves it.
    *   The credential is "revealed" to the contributor for a strict 1-hour time-limited window before it re-encrypts and locks them back out.
*   **The Bible (`/bible`):** A fast, read-only cache of JOEL's foundational documents (Culture, Five Absolute Truths) synced via Notion. 

## 6. Team Health & Capacity Management

*How leadership monitors the organization without micromanaging.*

*   **Team Capacity View (`/team`):** A Lead-facing dashboard showing every team member, their current availability status, their active task load, and their next deadline. It highlights who is bottlenecked and who has free hands.
*   **Admin Org Health (`/admin/health`):** A macro view for Admins showing "Idle Users" (people who haven't logged in for 14 days) and "Reviewer Bottlenecks" (Leads who have too many tasks sitting in the `in_review` column).
*   **Automated Weekly Reports (`/reports`):** Auto-generated snapshots of scope velocity (tasks completed vs. overdue) allowing Executives to track historical momentum.
*   **Suggestion Box (`/suggestions`):** A direct pipeline for volunteers to submit named or anonymous feedback directly to Executives, bypassing the middle-management chain.

## 7. Engagement & Retention Layer

*How the system rewards volunteers and creates momentum.*

*   **The Engagement Feed (`/home`):** The default landing page. It acts as a social feed showing active Streaks, personal goals, and organization-wide wins (e.g., "Marketing just completed the Easter Campaign!").
*   **Automated Recognitions:** The exact second a Lead clicks `approved` on a task, the system automatically fires a recognition into the Home feed celebrating the assignee's win. Leads can also send manual "shout-outs".
*   **Streaks:** The database tracks consecutive weeks of active task completions and displays a flame icon next to users who are on a hot streak.
*   **Onboarding Widget:** A dismissible checklist tracking 6 critical setup steps for brand new users (Profile setup, Bible reading, First task, etc.).

## 8. Infrastructure & Admin Utilities

*The gears running the system.*

*   **Admin Panel (`/admin`):** UIs for creating new Scopes, provisioning users securely (bypassing the sign-up screen), and hard-deleting offboarded volunteers.
*   **Audit Logging:** An immutable ledger tracking every major action (Task deletions, Vault access, Role changes) for security reviews.
*   **Notifications:** An in-app bell dropdown alerting users of mentions, reviews, and vault approvals.
*   **Database Backups:** A script configuration ready for nightly pg_dumps to secure JOEL's historical data.
