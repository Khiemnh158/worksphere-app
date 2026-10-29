# Phase 15 Task Due-Date Semantics Policy

## Checkpoint

- **Git Commit:** `c5143160cff31c4e02c6e84a278abef2aebba16b`
- **Branch:** `main`
- **Working Tree:** Clean (verified via `git status --short`)
- **Remote Alignment:** `HEAD == origin/main`

---

## Problem

During the Phase 15D audit and verification cycles, two critical discrepancies were identified in Task due date handling:
1. **`TASK_DUE_DATE_POLICY_UNGROUNDED`**: The mobile patch serialized calendar dates (e.g. `2026-10-31`) to UTC end-of-day Instant (`2026-10-31T23:59:59Z`). In a deployment where users operate in Vietnam local time (UTC+7), this Instant corresponds to `2026-11-01 06:59:59` the following morning, delaying overdue detection by 7 hours. Conversely, canonical API examples use `17:00:00Z`. Neither timestamp convention has explicit grounding in canonical Task documentation.
2. **`TASK_EDIT_DUE_DATE_ROUNDTRIP_DRIFT`**: `EditTaskScreen` parses incoming server timestamps (`Instant`) into date-only strings (`YYYY-MM-DD`). Upon saving an edit (even if the user only edited the title or description), the date was re-serialized to `23:59:59Z`, silently mutating any existing server Instant that had a different time component (such as `17:00:00Z` or `14:00:00Z`).

---

## Backend contract

Authoritative inspection of backend implementation reveals:
- **Transport Types:**
  - `CreateTaskRequest.dueDate`: `java.time.Instant` (optional, `@Nullable`).
  - `UpdateTaskRequest.dueDate`: `java.time.Instant` (optional, `@Nullable`).
  - `TaskSummaryResponse.dueDate` & `TaskDetailResponse.dueDate`: `java.time.Instant` (serialized to ISO-8601 UTC Instant strings by Jackson).
- **Domain Entity (`Task.java`):**
  - Storage: `private Instant dueDate;`.
  - Date range validation (`validateDateRange`):
    ```java
    LocalDate dueLocalDate = dueDate.atZone(ZoneOffset.UTC).toLocalDate();
    if (startDate.isAfter(dueLocalDate)) {
        throw new BusinessException(ErrorCode.TASK_DATE_RANGE_INVALID, "startDate cannot be after dueDate");
    }
    ```
    Backend explicitly converts `Instant` to `LocalDate` using `ZoneOffset.UTC` for comparison against `startDate` (`java.time.LocalDate`).
- **Deadline Scanner (`TaskDeadlineScanner.java`):**
  - Compares `dueDate.isBefore(now)` where `now = clock.instant()`.
  - Task is considered `TASK_OVERDUE` strictly when `Instant.now() > dueDate`.
  - Task is considered `TASK_DUE_SOON` when `now <= dueDate < now + 72 hours`.
- **Query Filter (`TaskApplicationService.java`):**
  - Evaluates `root.get("dueDate") >= dueFrom` and `<= dueTo` as raw database `TIMESTAMP WITH TIME ZONE` comparisons.

---

## Canonical UX

- **Canonical Documents:**
  - `docs/03_MOBILE_SCREEN_MAP.md` Section 8.3 (`Create Task Screen`) and 8.4 (`Edit Task Screen`) specify the form field as **"Thời hạn"** (due date).
  - `docs/02_USER_ROLES_AND_WORKFLOWS.md` specifies assigning and tracking deadlines at the day level.
  - `design/prototype/app.js` and `design/prototype/data/sample-data.js` implement deadline input as `<input type="date">` with format `YYYY-MM-DD` (e.g. `2026-10-15`, `2026-10-25`).
- **UX Finding:** The user-facing mobile UX is strictly **calendar-date only**. Users do not enter hours, minutes, or seconds. Therefore, mobile requires a deterministic contract for translating calendar dates to backend `Instant` values.

---

## Repository evidence

Comprehensive audit of all occurrences of `dueDate`, `17:00:00Z`, `23:59:59Z`, `ZoneOffset`, and `Clock`:
1. `docs/06_API_CONTRACT.md`:
   - Section 10.3 (Dashboard me): `"dueDate": "2026-10-18T17:00:00Z"`
   - Section 12.2 (Create task request): `"dueDate": "2026-10-05T17:00:00Z"`
   - Section 12.4 (Update task request): `"dueDate": "2026-10-06T17:00:00Z"`
   - Section 17 (Milestone/Task Completed): `"completedAt": "2026-10-12T17:00:00Z"`
2. `backend/src/test/java/com/worksphere/task/TaskTest.java`:
   - Line 86: `Instant dueDate = Instant.parse("2026-10-10T17:00:00Z");`
3. `backend/src/test/java/com/worksphere/task/TaskMockMvcTest.java`:
   - Uses `Instant.now().plus(5, ChronoUnit.DAYS)` and `Instant.parse("2026-11-01T10:00:00Z")`.
4. `backend/src/main/resources/db/migration/V005__create_task_tables.sql`:
   - `due_date TIMESTAMP WITH TIME ZONE NULL`.
5. `backend/src/main/java/com/worksphere/shared/config/DateTimeConfig.java`:
   - Declares `Clock clock()` returning `Clock.systemUTC()`.

---

## Timezone evidence

- **Configuration:** Neither `application.yml` nor `application-dev.yml` declares a system or business timezone property.
- **Service Request Precedent (D-037 / D-038):**
  - In `ServiceRequestApplicationService.java`: `private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");`
  - This was frozen in D-037 **strictly** for calculating calendar year (`:year`) in `SR-YYYY-NNNNNN` request number generation. It was not defined as an enterprise-wide or task-level timezone.
- **Canonical Design Principles:**
  - `docs/05_DATABASE_DESIGN.md` Section 18:
    - *"Database lưu thời gian theo UTC."*
    - *"Backend trả thời gian theo ISO-8601."*
    - *"Mobile chuyển đổi sang múi giờ thiết bị khi hiển thị."*
    - *"Không dùng thời gian của mobile làm thời gian chính thức cho nghiệp vụ quan trọng."*
  - `docs/06_API_CONTRACT.md` Section 2.3:
    - *"Thời điểm sử dụng ISO-8601 và UTC."*
    - *"Mobile chịu trách nhiệm chuyển thời gian UTC sang múi giờ thiết bị để hiển thị."*
- **Classification:** **`NO_TIMEZONE_POLICY`** (or at most `TIMEZONE_ONLY_INFERRED` from Vietnamese UI copy and D-037). There is no canonical documentation or system configuration establishing an official business timezone for Task deadline calculations.

---

## 17:00Z precedent

- `17:00:00Z` appears consistently across contract examples in `06_API_CONTRACT.md` and in unit tests (`TaskTest.java`).
- Context analysis:
  - If interpreted under UTC+7 (Vietnam): `17:00:00Z` + 7 hours = `24:00:00` (midnight at end of day).
  - Furthermore, `2026-10-05T17:00:00Z` at `ZoneOffset.UTC` has `toLocalDate()` equal to `2026-10-05`, preventing any calendar day shift in `Task.java`.
- However, neither `06_API_CONTRACT.md` nor any backend class includes comments, specifications, or rules defining `17:00:00Z` as an explicit deadline requirement.
- **Classification:** **`CONSISTENT_TEST_FIXTURE_PATTERN`**. It does not constitute an explicit canonical business policy.

---

## Options considered

### Option A: End of Business Day in Fixed Timezone (`Asia/Ho_Chi_Minh` UTC+7)
- Conversion: `YYYY-MM-DD` $\rightarrow$ `${YYYY-MM-DD}T17:00:00Z` (or `16:59:59Z`).
- **Pros:** Exactly matches `06_API_CONTRACT.md` examples and `TaskTest.java`. Evaluates to midnight local time in Vietnam. At `ZoneOffset.UTC`, `toLocalDate()` equals `YYYY-MM-DD`.
- **Cons:** Timezone `Asia/Ho_Chi_Minh` is not canonically configured for Tasks. If users or servers operate in other timezones, the deadline remains pinned to Vietnam midnight without explicit architectural mandate.

### Option B: Start of Next Calendar Day Local Boundary
- Conversion: `YYYY-MM-DD` $\rightarrow$ start of next local day converted to UTC.
- **Pros:** Mathematically clean boundary without fractional-second edge cases.
- **Cons:** If converted to UTC without UTC+7 offset (e.g. `YYYY-MM-DDT00:00:00Z` of next day), `toLocalDate()` in `Task.java` shifts forward by 1 day, causing date-range validation failures against `startDate` and displaying the wrong calendar day on mobile.

### Option C: UTC End-of-Day (`23:59:59Z`)
- Conversion: `YYYY-MM-DD` $\rightarrow$ `${YYYY-MM-DD}T23:59:59Z`.
- **Pros:** Pure UTC implementation. Independent of device or server timezone. At `ZoneOffset.UTC`, `toLocalDate()` strictly matches `YYYY-MM-DD`.
- **Cons:** In Vietnam (UTC+7), deadline expires at 06:59:59 AM the next morning. Inconsistent with `06_API_CONTRACT.md` examples (`17:00:00Z`).

### Option D: Explicit Time Selection in Mobile UI
- Conversion: User picks both date and time (e.g. `2026-10-31 17:00`).
- **Pros:** Eliminates ambiguity; Instant represents exact user intent.
- **Cons:** Violates canonical UX specifications (`03_MOBILE_SCREEN_MAP.md` and design prototype specify date only).

---

## Frozen semantics

Following Product Owner review and architecture decision **`D-064: Phase 15 Task Due-Date Semantics`**, the task due date policy is formally **FROZEN** under **Option A (Vietnam UTC+7 Midnight End-of-Day)**:

### 1. Business Timezone & Deadline Boundary (FROZEN)
- WorkSphere operates under the Vietnam business calendar (`Asia/Ho_Chi_Minh`, UTC+7).
- When a user inputs a calendar date `YYYY-MM-DD` on Mobile (where UI is calendar-only), the deadline represents the end of that calendar day in Vietnam time (`nextDay 00:00:00 +07:00`).
- This maps to UTC Instant: **`${YYYY-MM-DD}T17:00:00Z`**.
- This matches 100% of canonical contract examples in `06_API_CONTRACT.md` and `TaskTest.java`, and preserves `Task.java`'s `dueDate.atZone(ZoneOffset.UTC).toLocalDate() == YYYY-MM-DD`.

### 2. Edit Round-Trip Preservation Rule (FROZEN)
- **Rule:** **`PRESERVE_EXACT_SERVER_INSTANT_WHEN_DATE_UNCHANGED`**.
- **Behavior:** In `EditTaskScreen`, when authoritative `TaskDetail` is loaded from server, retain the raw `dueDate` Instant string in internal component state (`authoritativeDueDateRef` or initial state).
- When the user submits `EditTaskScreen`:
  - If the user did NOT change the calendar date in the text input field, the outgoing `UpdateTaskRequest.dueDate` **MUST preserve the exact original server Instant string**.
  - Silent normalization of an unchanged due date to a different time component is strictly prohibited.

### 3. Date Range Validation Rule (FROZEN)
- Client-side validation in `validateTaskDateRange(startDate, dueDate)` compares calendar dates only (`startDate` as `YYYY-MM-DD` vs `dueDate` parsed to `YYYY-MM-DD`).
- Same calendar date (`startDate === dueDate`) is **VALID** (consistent with `Task.java`: `!startDate.isAfter(dueLocalDate)`).
- `startDate > dueDate` is **INVALID** and surfaces `'Hạn hoàn thành không được trước ngày bắt đầu'`.

---

## Create behavior

- When creating a task with a date-only input (`YYYY-MM-DD`):
  - Serializes to canonical deadline Instant: **`${YYYY-MM-DD}T17:00:00Z`**.
- When input is blank or whitespace: `dueDate` is omitted (`undefined`).
- When input is an invalid calendar date (e.g. `2026-02-30`): Rejected client-side before submission.

---

## Edit unchanged behavior

- Enforces **`PRESERVE_EXACT_SERVER_INSTANT_WHEN_DATE_UNCHANGED`**.
- Scenario:
  - Server returns `dueDate: "2026-10-05T17:00:00Z"`.
  - User edits only task `title` or `description`.
  - Form displays `2026-10-05`.
  - Outgoing PUT payload transmits `dueDate: "2026-10-05T17:00:00Z"`.
  - Zero timestamp drift occurs.

---

## Edit changed behavior

- When user intentionally changes the date input (e.g. from `2026-10-05` to `2026-11-20`):
  - Serializes to canonical deadline Instant: **`${YYYY-MM-DD}T17:00:00Z`** (e.g. `2026-11-20T17:00:00Z`).

---

## Validation

- Single date input: Validates against `DATE_ONLY_REGEX` and `isValidCalendarDate` (no rollover).
- Date range: Compares string `YYYY-MM-DD` values directly; prevents inverted ranges.

---

## Overdue semantics

- `TaskDeadlineScanner` executes every 15 minutes (`PT15M`).
- Compares `dueDate.isBefore(now)`.
- With deadline set to `${YYYY-MM-DD}T17:00:00Z`, the task becomes overdue at midnight (`00:00:00 +07:00`) of the next calendar day in Vietnam time.

---

## Required mobile patch

1. Update `mobile/src/features/tasks/utils/taskDate.ts`:
   - Set `serializeTaskDueDate` to serialize calendar dates to `${trimmed}T17:00:00Z`.
2. Update `mobile/src/features/tasks/screens/EditTaskScreen.tsx`:
   - Capture `initialDueDate` from `taskApi.getTaskDetail(taskId)`.
   - On submit, if `parseTaskDueDateForInput(initialDueDate) === dueDate.trim()`, reuse `initialDueDate` directly; otherwise serialize new date.
3. Update tests in `taskDate.test.ts`, `CreateTaskScreen.test.tsx`, `EditTaskScreen.test.tsx` to assert `${YYYY-MM-DD}T17:00:00Z` and unchanged Instant preservation.

---

## Backend impact

- **Zero backend changes required.** Backend already accepts and validates any valid ISO-8601 `Instant`.

---

## 15D closure criteria

Phase 15D hardening closure and Phase 15E unblocking require:
1. Approved Decision D-064 (COMPLETED).
2. Mobile implementation of `PRESERVE_EXACT_SERVER_INSTANT_WHEN_DATE_UNCHANGED`.
3. Mobile implementation of Create / Edit changed deadline serialization (`T17:00:00Z`).
4. Passing targeted tests and full mobile regression.

---

## Conclusion

```
PHASE_15_DATE_POLICY_FROZEN_READY_FOR_PATCH
```
