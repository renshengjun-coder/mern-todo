# Due Dates + Overdue Highlighting — Product Requirements Document

**Document ID:** PRD-001  
**Date:** 2026-05-24  
**Status:** Draft (amended 2026-05-24 — datetime precision)  
**Author:** Product (practice requirement)  
**Target release:** mern-todo vNext  
**Related work:** Independent of MySQL persistence (PRD can ship against in-memory or MySQL storage)

---

## 1. Summary

Add optional due **date-times** to todos so users can plan work by deadline with **second-level** accuracy. The app should display due date-times clearly, highlight overdue incomplete items when the current moment passes the deadline, support sorting by due date-time, and optionally filter to overdue items only.

This is a full-stack enhancement to the existing MERN todo app. It builds on current CRUD, completion toggling, and All / Active / Completed filters without changing those behaviors.

---

## 2. Problem statement

Users can create, edit, complete, and delete todos, but there is no way to attach a deadline or see which tasks are past due. Without due dates, the list treats every todo equally regardless of urgency, making it harder to prioritize daily work.

---

## 3. Goals

| Goal | Metric |
|------|--------|
| Users can set an optional due date when creating or editing a todo | 100% of create/edit flows support optional due date |
| Overdue incomplete todos are visually distinct | Overdue items use dedicated styling within 1 second of render |
| Users can order todos by urgency | Sort-by-due-date available and stable |
| Invalid dates never corrupt stored data | API returns `400` for malformed `dueDate` values |

---

## 4. Non-goals (out of scope)

- Timezone conversion or multi-region scheduling (due date-times are **local wall-clock** values; no `Z` / offset suffix on the API)
- Sub-second precision (milliseconds not required)
- Email, push, or in-app reminders
- Recurring / repeating todos
- MySQL schema migration (handled by separate database initiative)
- Changes to authentication or multi-user ownership
- Due-date notifications or calendar integrations

---

## 5. Users and use cases

**Primary user:** Individual developer or learner using the todo app locally or in demo deployment.

### User stories

| ID | Story | Priority |
|----|-------|----------|
| US-1 | As a user, I want to optionally set a due date **and time** (to the second) when creating a todo so I can track when it should be done. | Must have |
| US-2 | As a user, I want to see the due date-time on each todo card so I know the deadline at a glance. | Must have |
| US-3 | As a user, I want overdue incomplete todos to stand out visually so I can prioritize them. | Must have |
| US-4 | As a user, I want to edit or clear a todo's due date so I can adjust plans. | Must have |
| US-5 | As a user, I want to sort todos by due date (soonest first) so urgent items appear on top. | Must have |
| US-6 | As a user, I want a filter for overdue todos so I can focus on late work. | Should have |
| US-7 | As a user, I want completed todos to never show as overdue even if the date passed. | Must have |

---

## 6. Current state

### Existing todo shape

```json
{
  "id": 1,
  "title": "Example",
  "description": "Details",
  "completed": false
}
```

### Existing capabilities

- CRUD via REST (`GET`, `POST`, `PUT`, `DELETE /todos`)
- `completed` boolean with checkbox toggle
- Filters: All, Active, Completed (client-side)
- Configurable API base URL (`client/src/config.js`)
- Server may use in-memory storage or MySQL (depending on branch); API contract must remain consistent

### Gaps addressed by this PRD

- No `dueDate` field on todos
- No overdue detection or styling
- No due-date sort or overdue filter

---

## 7. Proposed solution

### 7.1 Data model

Extend the todo object:

```json
{
  "id": 1,
  "title": "Example",
  "description": "Details",
  "completed": false,
  "dueDate": "2026-05-24T17:30:00"
}
```

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `dueDate` | `string \| null` | No | `null` | Local wall-clock datetime `YYYY-MM-DDTHH:mm:ss` (seconds required); no timezone offset |

**Format rules**

- Pattern: `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$`
- Hours `00–23`, minutes/seconds `00–59`
- Semantically invalid values (e.g. `2026-02-30T12:00:00`) are rejected
- Date-only strings (`YYYY-MM-DD`) are **not** accepted after this amendment

### 7.2 Overdue definition

A todo is **overdue** when **all** of the following are true:

1. `completed === false`
2. `dueDate` is not `null`
3. The parsed due date-time is **strictly before** the current date-time in the user's **local** environment, compared at **second** precision

Completed todos are never overdue. A todo due later **today** (e.g. 5:00 PM when it is 2:00 PM) is **not** overdue.

**Examples** (local time, `now = 2026-05-24T14:00:00`):

| `dueDate` | Overdue? |
|-----------|----------|
| `2026-05-24T13:59:59` | Yes |
| `2026-05-24T14:00:00` | No (not strictly before now) |
| `2026-05-24T18:00:00` | No |
| `2026-05-23T23:59:59` | Yes |

### 7.3 Sort behavior

| Sort mode | Label | Behavior |
|-----------|-------|----------|
| `newest` | Newest first | Default; preserve current ordering (by `id` descending or existing list order) |
| `dueDate` | Due date soonest first | Ascending by `dueDate`; todos with `dueDate: null` appear after all dated todos; stable tie-break by `id` |

**Recommendation:** Implement sort on the client initially to avoid API changes. Server-side `GET /todos?sort=dueDate` may be added in a follow-up if needed.

### 7.4 Filter extension

Add an **Overdue** filter alongside All / Active / Completed:

- Shows todos where overdue definition (§7.2) is true
- Hides completed todos and todos whose due date-time is still in the future (or exactly now)

---

## 8. Functional requirements

### 8.1 Backend

| ID | Requirement |
|----|-------------|
| FR-B1 | `POST /todos` accepts optional `dueDate` in the request body. |
| FR-B2 | New todos default to `dueDate: null` when the field is omitted. |
| FR-B3 | `PUT /todos/:id` accepts `dueDate` updates, including setting the value to `null` to clear the date. |
| FR-B4 | `dueDate` must be `null` or match `YYYY-MM-DDTHH:mm:ss` (regex: `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$`). |
| FR-B5 | Invalid `dueDate` values return HTTP `400` with a JSON body such as `{ "error": "Invalid dueDate; expected YYYY-MM-DDTHH:mm:ss or null" }`. |
| FR-B6 | Semantically invalid date-times (e.g. `2026-02-30T12:00:00`, `2026-05-24T25:00:00`) return HTTP `400`. |
| FR-B7 | `GET /todos` and single-todo responses include `dueDate` on every todo object. |
| FR-B8 | Existing PUT partial-update behavior for `title`, `description`, and `completed` remains unchanged. |

### 8.2 Frontend — create flow (`TodoUi.jsx`)

| ID | Requirement |
|----|-------------|
| FR-F1 | Add an optional date-time input to the create form (second precision). |
| FR-F2 | User may submit without selecting a date; empty means no due date sent. |
| FR-F3 | On successful create, the new todo appears in the list with its due date if set. |
| FR-F4 | Create form clears the date field after successful submission. |

### 8.3 Frontend — list and edit (`AddTodo.jsx`)

| ID | Requirement |
|----|-------------|
| FR-F5 | Display formatted due date-time on each card when `dueDate` is set (e.g. "Due May 24, 2026, 5:30:00 PM"). |
| FR-F6 | Apply overdue styling when §7.2 applies (e.g. red text, "Overdue" badge/chip). |
| FR-F7 | In edit mode, user can set, change, or clear the due date. |
| FR-F8 | Provide an explicit way to clear due date in edit mode (empty picker or "Clear date" control). |
| FR-F9 | Saving edits persists `dueDate` via `PUT /todos/:id`. |

### 8.4 Frontend — sort and filter (`App.jsx` / `AddTodo.jsx`)

| ID | Requirement |
|----|-------------|
| FR-F10 | Provide a sort control with at least "Newest first" and "Due date soonest first". |
| FR-F11 | Sort applies to the visible list without a full page reload. |
| FR-F12 | (Should have) Add "Overdue" filter button; works together with sort (filter first, then sort). |

### 8.5 Shared utilities

| ID | Requirement |
|----|-------------|
| FR-F13 | Extract date helpers to `client/src/utils/dates.js`: `isOverdue(dueDate, completed)`, `formatDueDate(dueDate)`, and optionally `compareDueDates(a, b)` for sort. |
| FR-F14 | Date helpers must be unit-testable (pure functions, no DOM). |

---

## 9. UX and visual requirements

| ID | Requirement |
|----|-------------|
| UX-1 | Due date text uses secondary typography when not overdue. |
| UX-2 | Overdue todos use error/destructive color from the Material UI theme (works in light and dark mode). |
| UX-3 | Overdue indicator includes both color and a text label (not color alone) for accessibility. |
| UX-4 | Date-time input uses native `<input type="datetime-local" step="1">` for second precision (no new dependencies). |
| UX-5 | Sort and filter controls follow the existing button group pattern in `AddTodo.jsx`. |

---

## 10. API contract changes

### POST /todos

**Request**

```json
{
  "title": "Finish report",
  "description": "Q2 summary",
  "dueDate": "2026-05-30T17:00:00"
}
```

**Response `201`**

```json
{
  "id": 5,
  "title": "Finish report",
  "description": "Q2 summary",
  "completed": false,
  "dueDate": "2026-05-30T17:00:00"
}
```

### PUT /todos/:id

**Clear due date**

```json
{
  "dueDate": null
}
```

**Response `200`:** Full todo array (unchanged contract), each item including `dueDate`.

### Error response `400`

```json
{
  "error": "Invalid dueDate; expected YYYY-MM-DDTHH:mm:ss or null"
}
```

---

## 11. Technical considerations

### Backend validation approach

1. Reject wrong format with regex (`YYYY-MM-DDTHH:mm:ss` only).
2. Parse year/month/day/hour/minute/second; reject invalid calendar date-times.
3. Store and return the canonical `YYYY-MM-DDTHH:mm:ss` string (no timezone conversion on the server).

### MySQL compatibility

`dueDate` maps to a nullable `DATETIME` column (`due_date DATETIME NULL`). Existing `DATE` values from an earlier rollout must be migrated (see design spec): convert to `DATETIME` and normalize legacy date-only rows to end-of-day `23:59:59` so same-day deadlines are not immediately overdue at midnight.

### Dark mode

Overdue styling must remain readable when `App.jsx` dark theme is active. Prefer theme tokens (`error.main`, `text.secondary`) over hardcoded hex colors.

---

## 12. Acceptance criteria

### Must pass before release

- [ ] Create todo without due date → `dueDate` is `null`; behavior matches today
- [ ] Create todo with future due date-time → date-time displays on card (includes time to the second)
- [ ] Create todo with past due date-time → overdue styling appears immediately
- [ ] Todo due later today → not overdue until that second passes
- [ ] Toggle todo complete → overdue styling removed even if date is in the past
- [ ] Edit todo to add, change, and clear due date → persists after list refresh
- [ ] Sort "Due date soonest first" → earliest dates first; undated todos last
- [ ] POST/PUT with invalid `dueDate` → `400`; no corrupt entries in list
- [ ] All / Active / Completed filters still work as before
- [ ] Dark mode: overdue and due-date text remain legible

### Should pass

- [ ] Overdue filter shows only incomplete todos past their due date
- [ ] Unit tests cover `isOverdue`, `formatDueDate`, and sort comparator

---

## 13. Test plan

| Area | Tests |
|------|-------|
| `client/src/utils/dates.js` | Unit tests: overdue edge cases (today, yesterday, null, completed) |
| Server validation | Unit or integration tests: valid date, invalid format, invalid calendar date, null clear |
| Manual UI | Create, edit, clear, sort, filter, dark mode, empty list |

### Overdue edge cases to test

Assume `now = 2026-05-24T14:00:00` (local).

| dueDate | completed | Expected overdue |
|---------|-----------|------------------|
| `null` | `false` | No |
| `2026-05-24T14:00:00` | `false` | No |
| `2026-05-24T13:59:59` | `false` | Yes |
| `2026-05-24T18:00:00` | `false` | No |
| `2026-05-23T23:59:59` | `false` | Yes |
| `2026-05-23T23:59:59` | `true` | No |

---

## 14. Implementation notes (for engineering / Superpowers)

Suggested file touch list:

| File | Action |
|------|--------|
| `server/index.js` | Add `dueDate` to model, validation, POST/PUT |
| `client/src/utils/dates.js` | Create date helpers |
| `client/src/components/TodoUi.jsx` | Optional date on create |
| `client/src/components/AddTodo.jsx` | Display, edit, overdue UI, sort, Overdue filter |
| `client/src/App.jsx` | Sort state (if lifted to app level) |
| `client/src/utils/dates.test.js` | Unit tests (optional path per test runner choice) |

**Superpowers workflow:** After PRD approval, run brainstorming to resolve open decisions (§15), then write design spec to `docs/superpowers/specs/` and implementation plan to `docs/superpowers/plans/`.

---

## 15. Open decisions (resolve in brainstorming)

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| D1 | Sort location | Client-only vs `GET /todos?sort=dueDate` | Client-only for v1 |
| D2 | Date-time input | Native `datetime-local` vs MUI DateTimePicker | Native `datetime-local` with `step="1"` |
| D5 | Datetime format | `YYYY-MM-DDTHH:mm:ss` local vs UTC ISO | Local wall-clock `YYYY-MM-DDTHH:mm:ss` (amendment 0.2) |
| D6 | Legacy DATE migration | Midnight vs end-of-day | End-of-day `23:59:59` for existing date-only rows |
| D3 | Overdue filter | Include in v1 vs defer | Include (should have) |
| D4 | Clear date UX | Empty picker vs explicit "Clear date" button | Explicit clear in edit mode |

---

## 16. Rollout

- No feature flag required for local/demo use
- Backward compatible: existing todos without `dueDate` treated as `null`
- No client migration; server returns `dueDate: null` for legacy in-memory entries after deploy

---

## 17. Revision history

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-05-24 | — | Initial draft PRD |
| 0.2 | 2026-05-24 | — | **Amendment:** `dueDate` is date-time with second precision (`YYYY-MM-DDTHH:mm:ss`); overdue uses instant comparison, not calendar day |
