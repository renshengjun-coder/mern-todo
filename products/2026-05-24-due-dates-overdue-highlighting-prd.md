# Due Dates + Overdue Highlighting — Product Requirements Document

**Document ID:** PRD-001  
**Date:** 2026-05-24  
**Status:** Draft  
**Author:** Product (practice requirement)  
**Target release:** mern-todo vNext  
**Related work:** Independent of MySQL persistence (PRD can ship against in-memory or MySQL storage)

---

## 1. Summary

Add optional due dates to todos so users can plan work by deadline. The app should display due dates clearly, highlight overdue incomplete items, support sorting by due date, and optionally filter to overdue items only.

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

- Time-of-day or timezone-aware scheduling (dates are calendar-day only)
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
| US-1 | As a user, I want to optionally set a due date when creating a todo so I can track when it should be done. | Must have |
| US-2 | As a user, I want to see the due date on each todo card so I know the deadline at a glance. | Must have |
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
  "dueDate": "2026-05-24"
}
```

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `dueDate` | `string \| null` | No | `null` | ISO 8601 calendar date `YYYY-MM-DD`; no time component |

### 7.2 Overdue definition

A todo is **overdue** when **all** of the following are true:

1. `completed === false`
2. `dueDate` is not `null`
3. `dueDate` is strictly before today's calendar date in the user's local timezone

Completed todos are never overdue. Todos due **today** are not overdue.

### 7.3 Sort behavior

| Sort mode | Label | Behavior |
|-----------|-------|----------|
| `newest` | Newest first | Default; preserve current ordering (by `id` descending or existing list order) |
| `dueDate` | Due date soonest first | Ascending by `dueDate`; todos with `dueDate: null` appear after all dated todos; stable tie-break by `id` |

**Recommendation:** Implement sort on the client initially to avoid API changes. Server-side `GET /todos?sort=dueDate` may be added in a follow-up if needed.

### 7.4 Filter extension

Add an **Overdue** filter alongside All / Active / Completed:

- Shows todos where overdue definition (§7.2) is true
- Hides completed todos and todos without a due date in the future or today

---

## 8. Functional requirements

### 8.1 Backend

| ID | Requirement |
|----|-------------|
| FR-B1 | `POST /todos` accepts optional `dueDate` in the request body. |
| FR-B2 | New todos default to `dueDate: null` when the field is omitted. |
| FR-B3 | `PUT /todos/:id` accepts `dueDate` updates, including setting the value to `null` to clear the date. |
| FR-B4 | `dueDate` must be `null` or match `YYYY-MM-DD` (regex: `^\d{4}-\d{2}-\d{2}$`). |
| FR-B5 | Invalid `dueDate` values return HTTP `400` with a JSON body such as `{ "error": "Invalid dueDate; expected YYYY-MM-DD or null" }`. |
| FR-B6 | Semantically invalid calendar dates (e.g. `2026-02-30`) return HTTP `400`. |
| FR-B7 | `GET /todos` and single-todo responses include `dueDate` on every todo object. |
| FR-B8 | Existing PUT partial-update behavior for `title`, `description`, and `completed` remains unchanged. |

### 8.2 Frontend — create flow (`TodoUi.jsx`)

| ID | Requirement |
|----|-------------|
| FR-F1 | Add an optional date input to the create form. |
| FR-F2 | User may submit without selecting a date; empty means no due date sent. |
| FR-F3 | On successful create, the new todo appears in the list with its due date if set. |
| FR-F4 | Create form clears the date field after successful submission. |

### 8.3 Frontend — list and edit (`AddTodo.jsx`)

| ID | Requirement |
|----|-------------|
| FR-F5 | Display formatted due date on each card when `dueDate` is set (e.g. "Due May 24, 2026"). |
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
| UX-4 | Date input uses native `<input type="date">` unless brainstorming selects MUI DatePicker (avoid new dependencies unless approved). |
| UX-5 | Sort and filter controls follow the existing button group pattern in `AddTodo.jsx`. |

---

## 10. API contract changes

### POST /todos

**Request**

```json
{
  "title": "Finish report",
  "description": "Q2 summary",
  "dueDate": "2026-05-30"
}
```

**Response `201`**

```json
{
  "id": 5,
  "title": "Finish report",
  "description": "Q2 summary",
  "completed": false,
  "dueDate": "2026-05-30"
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
  "error": "Invalid dueDate; expected YYYY-MM-DD or null"
}
```

---

## 11. Technical considerations

### Backend validation approach

1. Reject wrong format with regex.
2. Parse with `Date` or manual components; reject invalid calendar dates.
3. Store and return the original `YYYY-MM-DD` string (no timezone conversion on the server).

### MySQL compatibility (future)

When MySQL persistence is enabled, `dueDate` maps to a nullable `DATE` column. This PRD does not include migration DDL; the database spec should add `due_date DATE NULL` in a follow-up change.

### Dark mode

Overdue styling must remain readable when `App.jsx` dark theme is active. Prefer theme tokens (`error.main`, `text.secondary`) over hardcoded hex colors.

---

## 12. Acceptance criteria

### Must pass before release

- [ ] Create todo without due date → `dueDate` is `null`; behavior matches today
- [ ] Create todo with future due date → date displays on card
- [ ] Create todo with past due date → overdue styling appears immediately
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

| dueDate | completed | Today | Expected overdue |
|---------|-----------|-------|------------------|
| `null` | `false` | any | No |
| today | `false` | today | No |
| yesterday | `false` | today | Yes |
| yesterday | `true` | today | No |
| tomorrow | `false` | today | No |

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
| D2 | Date input component | Native `<input type="date">` vs MUI DatePicker | Native input (no new deps) |
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
