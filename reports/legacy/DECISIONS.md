# WorkSphere Decisions

## D-001 Architecture

WorkSphere uses a Modular Monolith.

Do not split WorkSphere into microservices unless canonical documents are explicitly updated by a dedicated design task.

## D-002 Database

PostgreSQL is the production-equivalent database.

H2 may be used for fast tests but cannot replace PostgreSQL integration validation.

## D-003 Java

The project target is Java 21.

A newer local JDK does not change the project target.

CI and future runtime images should align with Java 21 unless canonical documents explicitly change this decision.

## D-004 Flyway

Flyway migrations V001 through V011 are versioned history.

Do not rewrite migration history.

If a migration defect is discovered after it has been shared, add a corrective migration or corrective commit according to project rules.

## D-005 Persistent Project Memory

Project memory is stored in:

- AGENTS.md
- reports/PROJECT_STATE.md
- reports/DECISIONS.md
- reports/HANDOFF.md
- Git history
- Build and test outputs

Model chat history is not a source of truth.

## D-006 Model Failover

FCM Smart Router may change models when a provider returns:

- HTTP 429
- HTTP 5xx
- Timeout
- Empty or invalid content

A replacement model must:

- Read persistent project memory.
- Verify Git state.
- Continue only within the current task scope.
- Never assume earlier tool calls succeeded without evidence.

## D-007 Storage

Heavy AI data uses:

- D:\AI

Docker disk data uses:

- D:\DockerData\DockerDesktopWSL

WorkSphere source uses:

- D:\WorkSphere

Large AI packages, cache, model data, and router data must not be intentionally stored on drive C.

## D-008 Model Trust

A large context window does not guarantee correctness.

A model must pass shell, Git, file-read, and no-write tests before receiving repository write permission.

Only validated work may be committed and pushed.

## D-009 Current Model Selection

FCM automatic routing is disabled until at least two authenticated
providers are available and verified.

Current operating mode:

- Use FCM dashboard to select a model manually.
- Use OpenCode for small, bounded tasks.
- Persistent project memory remains independent of the selected model.
- Antigravity remains the primary agent for major roadmap phases.
- Do not enable automatic failover solely from public health pings.

## D-010 Phase 5 Scope

- "Organization Module" is the business module name; there is no `Organization` entity, no `organizations` table, and no `organization_id`.
- WorkSphere serves a single organization internally (strictly single-tenant).
- Phase 5 includes Department, Team, Team Member, and User Management.
- Project entities, milestones, workflows, and tasks belong to Phase 6 and beyond, strictly excluded from Phase 5.

## D-011 Temporary Password Flow

- Admin creates User with status `PENDING` and a secure temporary random password hashed via BCrypt.
- Plaintext password is never returned in API responses and never logged.
- Activation email, activation token, and first-time password setup workflow are currently absent from canonical documentation (`TEMPORARY_PASSWORD_FLOW_GAP`).
- Do not invent custom activation endpoints or token flows without explicit canonical requirement or a dedicated approved task.
- Phase 6 must not modify this flow outside its Project Module scope.

## D-012 Team API Contract Gap

- Team and Team Member have database schema and domain/application layer implementations.
- No REST Controllers are created for Team or Team Member because endpoints are not defined in `06_API_CONTRACT.md`.
- Exposure of Team endpoints is deferred until canonical API extensions are defined.

## D-013 Project Manager Invariant

- Má»—i Project pháº£i luÃ´n cÃ³ Ã­t nháº¥t má»™t active PROJECT_MANAGER.
- KhÃ´ng Ä‘Æ°á»£c xÃ³a active Project Manager cuá»‘i cÃ¹ng.
- KhÃ´ng Ä‘Æ°á»£c Ä‘á»•i role cá»§a active Project Manager cuá»‘i cÃ¹ng sang role khÃ¡c.
- Giá»¯ nguyÃªn role PROJECT_MANAGER Ä‘Æ°á»£c phÃ©p.
- GiÃ¡ng cáº¥p khi cÃ²n Project Manager khÃ¡c Ä‘Æ°á»£c phÃ©p.

## D-014 Mobile Design Before Implementation

- KhÃ´ng triá»ƒn khai React Native screen trÆ°á»›c khi cÃ³ UI/UX baseline.
- UI/UX baseline pháº£i gá»“m:
  - User Flow
  - Screen Inventory
  - Wireframe
  - Design System
  - Component Inventory
  - UI State Matrix
  - Navigation Map
  - API-Screen Mapping
  - Accessibility Checklist
- Thiáº¿t káº¿ khÃ´ng Ä‘Æ°á»£c táº¡o chá»©c nÄƒng ngoÃ i canonical docs.
- File Figma chá»‰ Ä‘Æ°á»£c tuyÃªn bá»‘ tá»“n táº¡i náº¿u thá»±c sá»± Ä‘Ã£ táº¡o.

## D-015 Runtime Automation Authorization

- Agent Ä‘Æ°á»£c dÃ¹ng Docker, Maven, Gradle, ADB vÃ  emulator theo pháº¡m vi AGENTS.md.
- Agent chá»‰ thao tÃ¡c tÃ i nguyÃªn cá»§a WorkSphere.
- Jenkins vÃ  Docker volumes Ä‘Æ°á»£c báº£o vá»‡.
- Há»™p thoáº¡i nháº¡y cáº£m pháº£i chuyá»ƒn cho ngÆ°á»i dÃ¹ng.

## D-016 Visual Prototype Gate

- Äáº·c táº£ Markdown chÆ°a Ä‘Æ°á»£c coi lÃ  visual mockup.
- TrÆ°á»›c khi code React Native pháº£i cÃ³ visual prototype cho cÃ¡c mÃ n hÃ¬nh lÃµi.
- Prototype pháº£i Ä‘Æ°á»£c review trÆ°á»›c implementation.
- KhÃ´ng tuyÃªn bá»‘ cÃ³ Figma náº¿u chÆ°a táº¡o file Figma tháº­t.

## D-017 Visual Prototype Baseline

- Commit `b58d5d8` lÃ  baseline trá»±c quan cho mobile.
- Prototype HTML/CSS/JavaScript lÃ  tÃ i liá»‡u thiáº¿t káº¿ tÆ°Æ¡ng tÃ¡c, khÃ´ng pháº£i source production.
- React Native pháº£i bÃ¡m Screen ID, token, component vÃ  UI state tá»« baseline.
- Prototype khÃ´ng Ä‘Æ°á»£c dÃ¹ng lÃ m production web application.
- Má»i thay Ä‘á»•i UI lá»›n sau baseline pháº£i Ä‘Æ°á»£c review trÆ°á»›c khi Ä‘Æ°a vÃ o React Native.

## D-018 Review Screenshot Policy

- áº¢nh tá»± Ä‘á»™ng trong `design/prototype/review-output/` lÃ  artifact kiá»ƒm thá»­ local.
- KhÃ´ng commit máº·c Ä‘á»‹nh.
- Chá»‰ áº£nh Ä‘Æ°á»£c chá»n cho bÃ¡o cÃ¡o hoáº·c release evidence má»›i Ä‘Æ°á»£c sao chÃ©p vÃ o `reports/screenshots/`.
- áº¢nh chá»©a secret, token hoáº·c dá»¯ liá»‡u tháº­t bá»‹ cáº¥m commit.

## D-019 Tool Discovery and Installation

- TrÆ°á»›c khi cÃ i Ä‘áº·t má»›i hoáº·c tá»± code láº¡i, Agent pháº£i kiá»ƒm tra vÃ  Æ°u tiÃªn cÃ´ng cá»¥, framework hoáº·c package chÃ­nh thá»©c cÃ³ sáºµn.
- Chá»‰ cÃ i Ä‘áº·t cÃ´ng cá»¥ khi nhiá»‡m vá»¥ thá»±c sá»± cáº§n, cÃ³ nguá»“n chÃ­nh thá»©c, verified publisher, license tÆ°Æ¡ng thÃ­ch, Æ°u tiÃªn winget.
- Má»i cÃ´ng cá»¥, á»©ng dá»¥ng má»›i hoáº·c mÃ´i trÆ°á»ng thá»±c thi pháº£i Ä‘Æ°á»£c ghi nháº­n Ä‘áº§y Ä‘á»§ vÃ o `reports/ENVIRONMENT_TOOL_REGISTRY.md`.
- Dá»¯ liá»‡u lá»›n (SDK, images, cache, virtual devices, build artifacts) Æ°u tiÃªn cáº¥u hÃ¬nh lÆ°u trá»¯ táº¡i á»• D:.
- Khi gáº·p UAC, Ä‘Äƒng nháº­p tÃ i khoáº£n, thanh toÃ¡n, Ä‘iá»u khoáº£n phÃ¡p lÃ½ hoáº·c quyá»n há»‡ Ä‘iá»u hÃ nh nháº¡y cáº£m: Agent dá»«ng thao tÃ¡c vÃ  bÃ¡o `BLOCKED_FOR_USER_ACTION`.

## D-020 Automated Application Control and Evidence

- Agent Ä‘Æ°á»£c phÃ©p má»Ÿ, Ä‘Ã³ng vÃ  Ä‘iá»u khiá»ƒn cÃ¡c á»©ng dá»¥ng phá»¥c vá»¥ WorkSphere (CLI, Docker, Android Studio, Android Emulator, Browser prototype).
- Agent Ä‘Æ°á»£c phÃ©p sá»­ dá»¥ng CLI, ADB, browser automation, chá»¥p screenshot vÃ  video ngáº¯n phá»¥c vá»¥ kiá»ƒm thá»­ vÃ  bÃ¡o cÃ¡o.
- NghiÃªm cáº¥m thu tháº­p, ghi log hoáº·c chá»¥p áº£nh chá»©a thÃ´ng tin cÃ¡ nhÃ¢n, máº­t kháº©u, token, API key hoáº·c bÃ­ máº­t.
- áº¢nh chá»¥p táº¡m thá»i trong `design/prototype/review-output/` khÃ´ng Ä‘Æ°á»£c commit máº·c Ä‘á»‹nh; chá»‰ áº£nh Ä‘Ã£ duyá»‡t má»›i Ä‘Æ°á»£c Ä‘Æ°a vÃ o `reports/screenshots/`.

## D-021 Proactive Execution Scope and Autonomy

- Tool Discovery and Installation Policy nháº±m má»Ÿ rá»™ng kháº£ nÄƒng thá»±c thi vÃ  tÃ­nh tá»± chá»§ lÃ¢u dÃ i cá»§a Agent, khÃ´ng háº¡n cháº¿ cÃ¡c nÄƒng lá»±c sáºµn cÃ³.
- Trong má»i nhiá»‡m vá»¥ tiáº¿p theo, Agent Ä‘Æ°á»£c chá»§ Ä‘á»™ng: phÃ¡t hiá»‡n á»©ng dá»¥ng/service; tÃ¬m CLI/shortcut/data path; má»Ÿ service cáº§n thiáº¿t; cÃ i Ä‘áº·t cÃ´ng cá»¥ chÃ­nh thá»©c cÃ²n thiáº¿u khi cáº§n; cáº¥u hÃ¬nh tÃ­ch há»£p; Ä‘iá»u khiá»ƒn qua CLI/ADB/automation; cháº¡y build/test/emulator/container; thu tháº­p telemetry/logs/screenshots; dá»«ng tiáº¿n trÃ¬nh tá»± khá»Ÿi cháº¡y; vÃ  cáº­p nháº­t registry.
- KhÃ´ng cáº§n xin xÃ¡c nháº­n riÃªng cho cÃ¡c thao tÃ¡c khÃ´ng Ä‘áº·c quyá»n, cÃ³ thá»ƒ Ä‘áº£o ngÆ°á»£c vÃ  chá»‰ áº£nh hÆ°á»Ÿng mÃ´i trÆ°á»ng WorkSphere.
- Chá»‰ bÃ¡o `BLOCKED_FOR_USER_ACTION` khi thá»±c sá»± cÃ³ yÃªu cáº§u can thiá»‡p tá»« ngÆ°á»i dÃ¹ng (UAC, login, captcha, Ä‘iá»u khoáº£n EULA, payment, firewall, quyá»n Android nháº¡y cáº£m).
- Náº¿u á»©ng dá»¥ng khÃ´ng cÃ³ CLI nhÆ°ng cáº§n kiá»ƒm thá»­ giao diá»‡n: Ä‘Æ°á»£c phÃ©p dÃ¹ng UI/accessibility automation cÃ³ kiá»ƒm soÃ¡t vá»›i tiáº¿n trÃ¬nh má»¥c tiÃªu Ä‘Ã£ xÃ¡c minh, khÃ´ng click tá»a Ä‘á»™ mÃ¹, khÃ´ng truy cáº­p dá»¯ liá»‡u cÃ¡ nhÃ¢n.

## D-022 Active Task Assignment Uniqueness

- Má»—i cáº·p `task_id` + `assignee_id` chá»‰ cÃ³ tá»‘i Ä‘a má»™t báº£n ghi phÃ¢n cÃ´ng Ä‘ang hoáº¡t Ä‘á»™ng (`is_active = TRUE`).
- PostgreSQL partial unique index `uk_task_assignments_active` (migration `V012`) lÃ  hÃ ng rÃ o toÃ n váº¹n dá»¯ liá»‡u cuá»‘i cÃ¹ng á»Ÿ má»©c database engine.
- Kiá»ƒm tra `existsByTaskIdAndAssigneeIdAndActiveTrue` á»Ÿ táº§ng application service chá»‰ Ä‘Ã³ng vai trÃ² fail-fast.
- Báº£n ghi phÃ¢n cÃ´ng Ä‘Ã£ háº¿t hiá»‡u lá»±c (`is_active = FALSE`) khÃ´ng cáº£n trá»Ÿ viá»‡c tÃ¡i phÃ¢n cÃ´ng (reassign) thÃ nh viÃªn Ä‘Ã³ trong tÆ°Æ¡ng lai.
- TrÆ°á»›c khi deploy migration V012 lÃªn báº¥t ká»³ mÃ´i trÆ°á»ng nÃ o cÃ³ dá»¯ liá»‡u lá»‹ch sá»­, báº¯t buá»™c thá»±c hiá»‡n theo Ä‘Ãºng Runbook tiá»n kiá»ƒm táº¡i `reports/runbooks/V012_ACTIVE_TASK_ASSIGNMENT_UNIQUENESS.md`.
- Tuyá»‡t Ä‘á»‘i khÃ´ng tá»± Ä‘á»™ng xÃ³a hoáº·c deactivate dá»¯ liá»‡u trÃ¹ng láº·p trÃªn mÃ´i trÆ°á»ng production khi chÆ°a cÃ³ phÃª duyá»‡t chÃ­nh thá»©c tá»« ngÆ°á»i cÃ³ tháº©m quyá»n nghiá»‡p vá»¥.

## D-023 Task Comment Ownership and Scope

- Chá»‰ tÃ¡c giáº£ bÃ¬nh luáº­n (`author_id`) hoáº·c Quáº£n trá»‹ viÃªn há»‡ thá»‘ng chuáº©n má»±c (`ADMIN`) má»›i cÃ³ quyá»n chá»‰nh sá»­a hoáº·c xÃ³a bÃ¬nh luáº­n.
- Vai trÃ² `PROJECT_MANAGER` khÃ´ng tá»± Ä‘á»™ng cÃ³ quyá»n sá»­a hoáº·c xÃ³a bÃ¬nh luáº­n cá»§a ngÆ°á»i khÃ¡c náº¿u khÃ´ng pháº£i lÃ  tÃ¡c giáº£ vÃ  khÃ´ng mang quyá»n System Admin.
- BÃ¬nh luáº­n pháº£n há»“i (parent comment) báº¯t buá»™c pháº£i thuá»™c cÃ¹ng Task vÃ  chÆ°a bá»‹ xÃ³a má»m (`is_deleted = FALSE`).

## D-024 Task Hierarchy Cycle Detection Policy

- Chu trÃ¬nh phÃ¢n cáº¥p cÃ´ng viá»‡c Ä‘Æ°á»£c phÃ¡t hiá»‡n chÃ­nh xÃ¡c báº±ng táº­p há»£p Ä‘á»‹nh danh tá»• tiÃªn Ä‘Ã£ duyá»‡t (`Set<UUID> visited`).
- KhÃ´ng Ã¡p dá»¥ng giá»›i háº¡n nghiá»‡p vá»¥ tÃ¹y tiá»‡n 50 cáº¥p; chuá»—i phÃ¢n cáº¥p há»£p lá»‡ sÃ¢u hÆ¡n 50 cáº¥p khÃ´ng bá»‹ xem lÃ  chu trÃ¬nh lá»—i.
- CÃ´ng viá»‡c cha báº¯t buá»™c pháº£i tá»“n táº¡i, khÃ´ng bá»‹ xÃ³a má»m (`is_deleted = FALSE`) vÃ  pháº£i thuá»™c cÃ¹ng dá»± Ã¡n (`project_id`).

## D-025 Java 21 Validation Evidence and Test Matrix

- Dá»± Ã¡n WorkSphere giá»¯ nguyÃªn má»¥c tiÃªu biÃªn dá»‹ch bytecode chuáº©n lÃ  Java 21 (`<java.version>21</java.version>`, tÆ°Æ¡ng Ä‘Æ°Æ¡ng `javac -release 21`).
- MÃ´i trÆ°á»ng Windows host hiá»‡n sá»­ dá»¥ng JDK 27 Ä‘á»ƒ thá»±c thi full regression integration suite (100/100 tests PASS vá»›i Testcontainers PostgreSQL).
- Image Docker chÃ­nh thá»©c `eclipse-temurin:21-jdk` Ä‘Ã³ng vai trÃ² mÃ´i trÆ°á»ng Ä‘á»‘i chuáº©n Java 21 cÃ³ thá»ƒ tÃ¡i láº­p Ä‘á»™c láº­p (Compile PASS, Checkstyle 0 violations, Unit tests 16/16 PASS, H2 context 1/1 PASS).
- KhÃ´ng tuyÃªn bá»‘ full Java 21 integration PASS náº¿u Testcontainers chÆ°a cháº¡y trong mÃ´i trÆ°á»ng Java 21 (do Docker socket cÃ³ chá»§ Ä‘Ã­ch khÃ´ng Ä‘Æ°á»£c mount vÃ o container táº¡m Ä‘á»ƒ báº£o vá»‡ an toÃ n há»‡ thá»‘ng).
- Jenkins pipeline hoáº·c mÃ´i trÆ°á»ng CI/CD chuyÃªn dá»¥ng vá»›i Docker socket an toÃ n lÃ  kÃªnh mong muá»‘n Ä‘á»ƒ thá»±c thi toÃ n bá»™ integration test matrix trÃªn Java 21.

## D-026 Web Runtime and Browser Automation Authorization

- Má»Ÿ rá»™ng nÄƒng lá»±c thá»±c thi cho Agent khi WorkSphere cÃ³ giao diá»‡n web, prototype web, trang quáº£n trá»‹, tÃ i liá»‡u web, Jenkins UI hoáº·c cáº§n kiá»ƒm thá»­ qua trÃ¬nh duyá»‡t. Quyá»n nÃ y cÃ³ hiá»‡u lá»±c lÃ¢u dÃ i cho má»i nhiá»‡m vá»¥ WorkSphere tiáº¿p theo.
- Agent Ä‘Æ°á»£c chá»§ Ä‘á»™ng: phÃ¡t hiá»‡n trÃ¬nh duyá»‡t Ä‘Ã£ cÃ i; xÃ¡c Ä‘á»‹nh executable path vÃ  version; má»Ÿ trÃ¬nh duyá»‡t khi task cáº§n; dÃ¹ng headless browser (`--headless=new`); dÃ¹ng profile táº¡m riÃªng cho WorkSphere; cháº¡y local HTTP server chá»‰ bind localhost (`127.0.0.1`); Ä‘iá»u hÆ°á»›ng, nháº­p dá»¯ liá»‡u test, báº¥m nÃºt, kiá»ƒm tra DOM; thu tháº­p console log, network status vÃ  HTTP response; chá»¥p screenshot; quay video kiá»ƒm thá»­ ngáº¯n; kiá»ƒm tra responsive viewport; kiá»ƒm tra accessibility; kiá»ƒm thá»­ website/prototype WorkSphere; kiá»ƒm tra Jenkins UI; vÃ  dá»«ng browser/server do Agent tá»± khá»Ÿi cháº¡y.
- Agent khÃ´ng cáº§n xin phÃ©p riÃªng cho thao tÃ¡c khÃ´ng Ä‘áº·c quyá»n, cÃ³ thá»ƒ Ä‘áº£o ngÆ°á»£c vÃ  chá»‰ áº£nh hÆ°á»Ÿng mÃ´i trÆ°á»ng WorkSphere.

## D-027 Browser Tool Hierarchy, Storage Isolation, and Security

- Thá»© tá»± Æ°u tiÃªn cÃ´ng cá»¥ trÆ°á»›c khi cÃ i má»›i:
  1. Microsoft Edge Ä‘Ã£ cÃ i trÃªn Windows host.
  2. Kháº£ nÄƒng headless cÃ³ sáºµn cá»§a Edge (`msedge.exe --headless=new`).
  3. Browser automation Ä‘ang cÃ³ trong Antigravity.
  4. Microsoft Edge WebDriver chÃ­nh thá»©c tá»« Microsoft phÃ¹ há»£p phiÃªn báº£n Edge (lÆ°u ngoÃ i repository táº¡i `D:\AI\Tools\EdgeWebDriver\<version>`).
  5. Selenium hoáº·c Playwright chá»‰ khi task thá»±c sá»± cáº§n. KhÃ´ng cÃ i nhiá»u framework trÃ¹ng chá»©c nÄƒng.
- PhÃ¢n bá»• lÆ°u trá»¯ vÃ  cÃ¡ch ly tuyá»‡t Ä‘á»‘i ngoÃ i repository `D:\WorkSphere`:
  - `D:\AI\Tools\EdgeWebDriver\<version>`
  - `D:\AI\Profiles\Edge\WorkSphere` (profile test riÃªng biá»‡t, cáº¥m truy cáº­p profile Edge cÃ¡ nhÃ¢n cá»§a ngÆ°á»i dÃ¹ng)
  - `D:\AI\Cache\Edge`
  - `D:\AI\Temp\Edge`
- An toÃ n dá»¯ liá»‡u vÃ  báº±ng chá»©ng kiá»ƒm thá»­:
  - áº¢nh táº¡m: `design/prototype/review-output/` (khÃ´ng commit máº·c Ä‘á»‹nh).
  - áº¢nh bÃ¡o cÃ¡o: `reports/screenshots/` (chá»‰ commit khi Ä‘Ã£ kiá»ƒm tra khÃ´ng chá»©a secret, token, máº­t kháº©u, Authorization header, API key, hay dá»¯ liá»‡u cÃ¡ nhÃ¢n tháº­t).
  - NghiÃªm cáº¥m commit: browser installer, browser binary, WebDriver executable (`msedgedriver.exe`), browser profile, cookie, cache, downloads táº¡m, hoáº·c file HAR chá»©a token.
- Máº¡ng vÃ  Web Frontend tÆ°Æ¡ng lai:
  - Local server chá»‰ bind `127.0.0.1`. Cáº¥m bind `0.0.0.0`, cáº¥m má»Ÿ port public ra Internet, cáº¥m táº¯t firewall.
  - KhÃ´ng tá»± táº¡o Web Frontend náº¿u Roadmap khÃ´ng yÃªu cáº§u; tuÃ¢n thá»§ nghiÃªm ngáº·t license khi tÃ¡i sá»­ dá»¥ng mÃ£ nguá»“n.

## D-028 Phase 8 Local Storage Baseline

- MÃ´i trÆ°á»ng Development vÃ  Test sá»­ dá»¥ng nhÃ  cung cáº¥p lÆ°u trá»¯ cá»¥c bá»™ (`LocalFileSystemStorageService`).
- ThÆ° má»¥c gá»‘c lÆ°u trá»¯ Ä‘Æ°á»£c cáº¥u hÃ¬nh qua biáº¿n mÃ´i trÆ°á»ng `WORKSPHERE_STORAGE_PATH` (hoáº·c thuá»™c tÃ­nh `worksphere.storage.path`), máº·c Ä‘á»‹nh `D:/WorkSphereData/uploads` trÃªn Windows vÃ  cÃ³ thá»ƒ ghi Ä‘Ã¨ linh hoáº¡t trÃªn Linux/container.
- ÄÆ°á»ng dáº«n váº­t lÃ½ tuyá»‡t Ä‘á»‘i cá»§a file trÃªn filesystem mÃ¡y chá»§ tuyá»‡t Ä‘á»‘i khÃ´ng xuáº¥t hiá»‡n trong API response, headers, body hoáº·c log tráº£ vá» cho client.
- Äá»‹nh danh lÆ°u trá»¯ (`storagePath`) lÃ  relative server-generated key cÃ³ Ä‘á»‹nh dáº¡ng `<purpose>/<yyyy>/<MM>/<fileId>.<extension>`, Ä‘Æ°á»£c sinh ngáº«u nhiÃªn báº±ng UUID trÃªn mÃ¡y chá»§ vÃ  chá»‰ quáº£n lÃ½ ná»™i bá»™.
- TÃªn tá»‡p gá»‘c tá»« phÃ­a client (`originalFilename`) chá»‰ Ä‘Æ°á»£c lÆ°u dÆ°á»›i dáº¡ng metadata vÃ  phá»¥c vá»¥ viá»‡c xÃ¢y dá»±ng header `Content-Disposition` tuÃ¢n thá»§ chuáº©n RFC 5987 (UTF-8).
- NhÃ  cung cáº¥p lÆ°u trá»¯ cho mÃ´i trÆ°á»ng Production (Amazon S3, MinIO, Azure Blob Storage) tiáº¿p tá»¥c Ä‘Æ°á»£c hoÃ£n quyáº¿t Ä‘á»‹nh cho Ä‘áº¿n cÃ¡c giai Ä‘oáº¡n triá»ƒn khai háº¡ táº§ng Ä‘Ã¡m mÃ¢y.

## D-029 File Type and Archive Security

- Tuyá»‡t Ä‘á»‘i khÃ´ng tin cáº­y header `Content-Type` hoáº·c pháº§n má»Ÿ rá»™ng (`extension`) do phÃ­a client gá»­i lÃªn.
- CÃ¡c Ä‘á»‹nh dáº¡ng tá»‡p áº£nh vÃ  PDF (JPEG, PNG, WEBP, PDF) báº¯t buá»™c pháº£i Ä‘Æ°á»£c xÃ¡c thá»±c báº±ng magic bytes / signature nhá»‹ phÃ¢n thá»±c táº¿ cá»§a tá»‡p.
- CÃ¡c Ä‘á»‹nh dáº¡ng tÃ i liá»‡u Office OpenXML (DOCX, XLSX) báº¯t buá»™c pháº£i Ä‘Æ°á»£c xÃ¡c thá»±c cáº¥u trÃºc ná»™i dung ZIP bÃªn trong luá»“ng bá»™ nhá»› mÃ  khÃ´ng Ä‘Æ°á»£c giáº£i nÃ©n ra há»‡ thá»‘ng tá»‡p Ä‘Ä©a.
- Kiá»ƒm tra an toÃ n tá»‡p nÃ©n (ZIP safety) báº¯t buá»™c pháº£i thá»±c thi cÃ¡c giá»›i háº¡n tÃ i nguyÃªn nghiÃªm ngáº·t:
  - Sá»‘ lÆ°á»£ng entry tá»‘i Ä‘a: `MAX_ZIP_ENTRIES = 200`.
  - Dung lÆ°á»£ng giáº£i nÃ©n tá»‘i Ä‘a cho má»—i entry: `MAX_ENTRY_UNCOMPRESSED_SIZE = 50 MB`.
  - Tá»•ng dung lÆ°á»£ng giáº£i nÃ©n tÃ­ch lÅ©y tá»‘i Ä‘a: `MAX_TOTAL_UNCOMPRESSED_SIZE = 100 MB`.
  - Tá»· lá»‡ nÃ©n tá»‘i Ä‘a: `MAX_COMPRESSION_RATIO = 100.0` (kiá»ƒm tra cáº£ tá»· lá»‡ khai bÃ¡o trong metadata header vÃ  tá»· lá»‡ thá»±c táº¿ theo dÃµi luá»“ng thá»i gian thá»±c qua `CountingInputStream`).
  - NghiÃªm cáº¥m má»i dáº¡ng path traversal (`..`), dáº¥u gáº¡ch chÃ©o ngÆ°á»£c (`\`), Ä‘Æ°á»ng dáº«n tuyá»‡t Ä‘á»‘i (`/`), hoáº·c kÃ½ hiá»‡u á»• Ä‘Ä©a (`C:`) trong tÃªn entry cá»§a tá»‡p nÃ©n.

## D-030 File Access Follows Business Linkage

- Quyá»n táº£i xuá»‘ng vÃ  truy cáº­p tá»‡p tuÃ¢n thá»§ cháº·t cháº½ liÃªn káº¿t nghiá»‡p vá»¥ thá»±c táº¿, khÃ´ng cho phÃ©p truy cáº­p chá»‰ báº±ng viá»‡c Ä‘oÃ¡n Ä‘á»‹nh danh `fileId`:
  - Tá»‡p chÆ°a liÃªn káº¿t (`unlinked`): chá»‰ ngÆ°á»i táº£i lÃªn ban Ä‘áº§u (`uploaded_by`) hoáº·c Quáº£n trá»‹ viÃªn há»‡ thá»‘ng (`ADMIN`) má»›i Ä‘Æ°á»£c phÃ©p truy cáº­p.
  - Tá»‡p Ä‘Ã£ gáº¯n káº¿t vá»›i cÃ´ng viá»‡c (`task_attachments`): quyá»n táº£i xuá»‘ng káº¿ thá»«a tráº¡ng thÃ¡i thÃ nh viÃªn hoáº¡t Ä‘á»™ng (`active`) cá»§a dá»± Ã¡n chá»©a cÃ´ng viá»‡c Ä‘Ã³. ThÃ nh viÃªn khÃ´ng thuá»™c dá»± Ã¡n hoáº·c thÃ nh viÃªn Ä‘Ã£ bá»‹ há»§y kÃ­ch hoáº¡t (`INACTIVE`) bá»‹ tá»« chá»‘i truy cáº­p (HTTP 403 `FILE_ACCESS_DENIED`).
  - Tá»‡p Ä‘Ã£ gáº¯n káº¿t vá»›i yÃªu cáº§u dá»‹ch vá»¥ (`service_attachments`): quyá»n táº£i xuá»‘ng thuá»™c vá» ngÆ°á»i táº¡o yÃªu cáº§u, ká»¹ thuáº­t viÃªn Ä‘Æ°á»£c phÃ¢n cÃ´ng, hoáº·c Quáº£n trá»‹ viÃªn.
- Tá»‡p Ä‘ang Ä‘Æ°á»£c liÃªn káº¿t vá»›i cÃ´ng viá»‡c hoáº·c yÃªu cáº§u dá»‹ch vá»¥ tuyá»‡t Ä‘á»‘i khÃ´ng Ä‘Æ°á»£c phÃ©p xÃ³a thÃ´ng qua File API (HTTP 422 `FILE_ALREADY_LINKED`), nháº±m Ä‘áº£m báº£o tÃ­nh toÃ n váº¹n cá»§a lá»‹ch sá»­ nghiá»‡p vá»¥.

## D-031 Task Attachment Transaction

- Danh sÃ¡ch Ä‘á»‹nh danh tá»‡p Ä‘Ã­nh kÃ¨m (`attachmentFileIds`) Ä‘Æ°á»£c xá»­ lÃ½ vÃ  gáº¯n káº¿t nguyÃªn tá»­ trong cÃ¹ng transaction lÆ°u trá»¯ bÃ¬nh luáº­n cÃ´ng viá»‡c (`TaskComment`).
- Táº¥t cáº£ cÃ¡c tá»‡p Ä‘Ã­nh kÃ¨m pháº£i Ä‘Æ°á»£c kiá»ƒm tra há»£p lá»‡ trÆ°á»›c khi thá»±c hiá»‡n ghi dá»¯ liá»‡u: pháº£i tá»“n táº¡i, cÃ³ tráº¡ng thÃ¡i `ACTIVE`, má»¥c Ä‘Ã­ch `TASK_ATTACHMENT`, vÃ  ngÆ°á»i thá»±c hiá»‡n pháº£i lÃ  ngÆ°á»i táº£i lÃªn tá»‡p (hoáº·c Quáº£n trá»‹ viÃªn há»‡ thá»‘ng).
- Náº¿u báº¥t ká»³ má»™t tá»‡p Ä‘Ã­nh kÃ¨m nÃ o khÃ´ng há»£p lá»‡, toÃ n bá»™ transaction cá»§a bÃ¬nh luáº­n vÃ  Ä‘Ã­nh kÃ¨m pháº£i bá»‹ rollback, khÃ´ng táº¡o tráº¡ng thÃ¡i dá»¯ liá»‡u dá»Ÿ dang.
- Sá»‘ lÆ°á»£ng tá»‡p Ä‘Ã­nh kÃ¨m (`attachmentCount`) hiá»ƒn thá»‹ trÃªn Task Detail vÃ  Task List Ä‘Æ°á»£c tÃ­nh toÃ¡n thÃ´ng qua truy váº¥n gom nhÃ³m theo máº» (`countByTaskIdIn`), loáº¡i bá» hoÃ n toÃ n nguy cÆ¡ N+1 queries.

## D-032 Filesystem Security Validation

- Há»‡ thá»‘ng tá»‡p lÆ°u trá»¯ cá»¥c bá»™ pháº£i chá»§ Ä‘á»™ng ngÄƒn cháº·n viá»‡c thoÃ¡t khá»i thÆ° má»¥c gá»‘c thÃ´ng qua symbolic link hoáº·c NTFS junction/reparse point báº±ng cÃ¡ch kiá»ƒm tra toÃ n bá»™ cÃ¢y thÆ° má»¥c tá»• tiÃªn vá»›i `LinkOption.NOFOLLOW_LINKS` vÃ  Ä‘á»‘i chiáº¿u vá»›i Ä‘Æ°á»ng dáº«n thá»±c `rootLocation.toRealPath()`.
- NÄƒng lá»±c phÃ²ng vá»‡ symlink escape Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c minh thÃ nh cÃ´ng trÃªn há»‡ thá»‘ng tá»‡p Linux thá»±c táº¿ thÃ´ng qua Docker container Java 21 (`TESTED_ON_LINUX_CONTAINER`), chá»©ng minh cáº£ ba thao tÃ¡c `store`, `load`, vÃ  `delete` Ä‘i qua symlink Ä‘á»u bá»‹ tá»« chá»‘i vÃ  tá»‡p ngoÃ i thÆ° má»¥c lÆ°u trá»¯ Ä‘Æ°á»£c báº£o vá»‡ tuyá»‡t Ä‘á»‘i.
- Thao tÃ¡c di chuyá»ƒn tá»‡p Ä‘Ã­ch cuá»‘i cÃ¹ng cáº¥m sá»­ dá»¥ng `StandardCopyOption.REPLACE_EXISTING`, kiá»ƒm tra sá»± tá»“n táº¡i cá»§a tá»‡p Ä‘Ã­ch trÆ°á»›c khi di chuyá»ƒn Ä‘á»ƒ chá»‘ng ghi Ä‘Ã¨ dá»¯ liá»‡u tá»‡p lÆ°u trá»¯.
- TrÃªn mÃ´i trÆ°á»ng production, thÆ° má»¥c lÆ°u trá»¯ pháº£i Ä‘Æ°á»£c báº£o vá»‡ báº±ng phÃ¢n quyá»n ngÆ°á»i dÃ¹ng cáº¥p há»‡ Ä‘iá»u hÃ nh; há»‡ thá»‘ng thá»«a nháº­n technical debt vá» máº·t lÃ½ thuyáº¿t ráº±ng Java NIO portable API khÃ´ng thá»ƒ loáº¡i bá» tuyá»‡t Ä‘á»‘i TOCTOU trÆ°á»›c ngÆ°á»i dÃ¹ng Ä‘Ã£ cÃ³ quyá»n can thiá»‡p trá»±c tiáº¿p filesystem mÃ¡y chá»§.

## D-033 IDE Extension Discovery, Installation and Automation Policy

- Má»Ÿ rá»™ng nÄƒng lá»±c thá»±c thi cá»§a Agent trong Antigravity IDE, khÃ´ng giá»›i háº¡n cÃ¡c quyá»n Ä‘ang cÃ³, hiá»‡u lá»±c lÃ¢u dÃ i cho má»i nhiá»‡m vá»¥ tiáº¿p theo.
- Agent Ä‘Æ°á»£c chá»§ Ä‘á»™ng: phÃ¡t hiá»‡n extension Ä‘Ã£ cÃ i; kiá»ƒm tra enabled/disabled, version, publisher, location; sá»­ dá»¥ng command, view, task, debugger, language server, API cá»§a extension; enable extension khi cáº§n; disable táº¡m extension xung Ä‘á»™t; cÃ i extension cÃ²n thiáº¿u tá»« nguá»“n chÃ­nh thá»©c; nÃ¢ng cáº¥p extension; reload window khi cáº§n; cáº­p nháº­t reports/ENVIRONMENT_TOOL_REGISTRY.md.
- NguyÃªn táº¯c Æ°u tiÃªn:
  1. TÃ­nh nÄƒng cÃ³ sáºµn trong Antigravity.
  2. Extension Ä‘Ã£ cÃ i nhÆ°ng chÆ°a enable.
  3. Kháº£ nÄƒng hoÃ n thÃ nh nhiá»‡m vá»¥ cá»§a extension hiá»‡n cÃ³.
  4. Chá»‰ cÃ i má»›i khi khÃ´ng cÃ³ giáº£i phÃ¡p tÆ°Æ¡ng Ä‘Æ°Æ¡ng, tá»« publisher chÃ­nh thá»©c/uy tÃ­n, tÆ°Æ¡ng thÃ­ch license/báº£o máº­t.
  5. TrÃ¡nh cÃ i extension trÃ¹ng láº·p chá»©c nÄƒng. GitLens Ä‘Æ°á»£c Æ°u tiÃªn hÆ¡n Git History khi Ä‘Ã£ bao quÃ¡t Ä‘á»§ lá»‹ch sá»­/blame/diff. Microsoft Edge Tools Æ°u tiÃªn cho web/prototype debug. Docker extension bá»• trá»£ Docker CLI nhÆ°ng khÃ´ng thay tháº¿ lá»‡nh CLI báº¯t buá»™c. Markdownlint dÃ¹ng phÃ¡t hiá»‡n lá»—i cÃº phÃ¡p Markdown nhÆ°ng khÃ´ng tá»± sá»­a ná»™i dung canonical ngoÃ i pháº¡m vi task.
- KhÃ´ng cáº§n xin phÃ©p riÃªng cho thao tÃ¡c khÃ´ng Ä‘áº·c quyá»n, cÃ³ thá»ƒ Ä‘áº£o ngÆ°á»£c vÃ  chá»‰ áº£nh hÆ°á»Ÿng mÃ´i trÆ°á»ng WorkSphere.
- Chá»‰ bÃ¡o `BLOCKED_FOR_USER_ACTION` khi gáº·p: Ä‘Äƒng nháº­p Marketplace/Microsoft/GitHub/Google; xÃ¡c nháº­n publisher khÃ´ng tin cáº­y; EULA/license thÆ°Æ¡ng máº¡i; Windows UAC/Admin; hoáº·c extension Ä‘Ã²i gá»­i source WorkSphere ra ngoÃ i.

## D-034 Database Extension and Development Safety Policy

- WorkSphere sá»­ dá»¥ng PostgreSQL lÃ  database canonical vÃ  máº·c Ä‘á»‹nh. Agent Æ°u tiÃªn: PostgreSQL CLI/psql, Testcontainers PostgreSQL, SQLTools vá»›i PostgreSQL driver phÃ¹ há»£p.
- SQL Server (mssql) Ä‘Ã£ cÃ i vÃ  Ä‘Æ°á»£c phÃ©p sá»­ dá»¥ng khi má»™t nhiá»‡m vá»¥ WorkSphere cá»¥ thá»ƒ chá»©ng minh cáº§n thiáº¿t. "KhÃ´ng Æ°u tiÃªn" khÃ´ng Ä‘á»“ng nghÄ©a vá»›i "cáº¥m sá»­ dá»¥ng".
- Tuyá»‡t Ä‘á»‘i khÃ´ng tá»± chuyá»ƒn schema, Flyway migration hoáº·c runtime database sang SQL Server; khÃ´ng sá»­a migration PostgreSQL chá»‰ Ä‘á»ƒ tÆ°Æ¡ng thÃ­ch mssql.
- Tuyá»‡t Ä‘á»‘i khÃ´ng lÆ°u database password/credentials vÃ o repository, workspace settings Ä‘Æ°á»£c Git theo dÃµi, screenshot, raw logs hay extension connection export.
- Workspace settings (`.vscode/settings.json`, `.vscode/extensions.json`, `.vscode/launch.json`, `.vscode/tasks.json`): chá»‰ táº¡o/sá»­a khi Ä‘Æ°á»£c phÃ©p, cáº¥m chá»©a machine-specific path hoáº·c secret.
- Cáº¥m commit: extension binaries, VSIX, cache, token, profile, cookie, settings cÃ¡ nhÃ¢n, credentials.

## D-035 Service Attachment Response Projection (IMPLEMENTATION_RESPONSE_PROJECTION)

- Canonical `06_API_CONTRACT.md` Section 13.4 chá»‰ Ä‘á»‹nh "Tá»‡p Ä‘Ã­nh kÃ¨m" trong response chi tiáº¿t yÃªu cáº§u dá»‹ch vá»¥ mÃ  khÃ´ng Ä‘á»‹nh nghÄ©a cáº¥u trÃºc JSON schema chi tiáº¿t.
- Chuáº©n hÃ³a cáº¥u trÃºc chiáº¿u triá»ƒn khai (nhÃ£n: `IMPLEMENTATION_RESPONSE_PROJECTION`, khÃ´ng gá»i lÃ  canonical schema) `ServiceAttachmentResponse` gá»“m 7 trÆ°á»ng:
  - `fileId` (UUID): ID tá»‡p lÆ°u trá»¯ trong `stored_files`.
  - `originalName` (String): TÃªn tá»‡p gá»‘c tá»« phÃ­a client.
  - `mimeType` (String): Äá»‹nh dáº¡ng MIME Ä‘Ã£ xÃ¡c thá»±c.
  - `sizeBytes` (Long): Dung lÆ°á»£ng tá»‡p tÃ­nh báº±ng byte (thá»‘ng nháº¥t tuyá»‡t Ä‘á»‘i theo naming convention thá»±c táº¿ cá»§a `FileUploadResponse` vÃ  `StoredFile`, khÃ´ng dÃ¹ng `fileSize`).
  - `downloadUrl` (String): ÄÆ°á»ng dáº«n táº£i tá»‡p `/api/v1/files/{fileId}/download`.
  - `uploadedBy` (UUID): ID ngÆ°á»i táº£i tá»‡p lÃªn.
  - `createdAt` (Instant): Thá»i Ä‘iá»ƒm Ä‘Ã­nh kÃ¨m tá»‡p vÃ o yÃªu cáº§u dá»‹ch vá»¥ (láº¥y tá»« trÆ°á»ng `service_attachments.created_at`, phÃ¢n biá»‡t rÃµ rÃ ng vá»›i `StoredFile.createdAt` lÃ  thá»i Ä‘iá»ƒm tá»‡p váº­t lÃ½ Ä‘Æ°á»£c táº£i lÃªn há»‡ thá»‘ng).
- Cáº¥u trÃºc nÃ y khá»›p 100% vá»›i naming convention thá»±c táº¿ cá»§a `FileUploadResponse` vÃ  `StoredFile` tá»« Phase 8.
- ÄÃ¢y lÃ  implementation response projection nhÃºng trong `ServiceRequestDetailResponse.attachments`, khÃ´ng má»Ÿ thÃªm endpoint REST má»›i, khÃ´ng lÃ m thay Ä‘á»•i há»£p Ä‘á»“ng canonical.

## D-036 Service Request Single Active Assignment and Database Invariants

- **Cardinality**: Má»—i Service Request táº¡i má»™t thá»i Ä‘iá»ƒm chá»‰ cÃ³ tá»‘i Ä‘a **Má»˜T** ká»¹ thuáº­t viÃªn/ngÆ°á»i xá»­ lÃ½ Ä‘ang hoáº¡t Ä‘á»™ng (`active cardinality = 0..1`), cÄƒn cá»© `02_USER_ROLES_AND_WORKFLOWS.md` Section 6.3, `05_DATABASE_DESIGN.md` Section 9.3, vÃ  `06_API_CONTRACT.md` Section 13.4/13.6 ("NgÆ°á»i xá»­ lÃ½" - sá»‘ Ã­t; payload phÃ¢n cÃ´ng chá»‰ chá»©a `assigneeId` Ä‘Æ¡n).
- **HÃ ng rÃ o Database & Khoáº£ng trá»‘ng Schema**:
  - Viá»‡c chá»‰ dá»±a vÃ o kiá»ƒm tra á»Ÿ táº§ng Application Service khÃ´ng thá»ƒ báº£o vá»‡ há»‡ thá»‘ng trÆ°á»›c hai transaction phÃ¢n cÃ´ng Ä‘á»“ng thá»i (race condition).
  - Ghi nháº­n: `SERVICE_ASSIGNMENT_CONCURRENCY_SCHEMA_GAP`.
  - Database PostgreSQL báº¯t buá»™c pháº£i lÃ  hÃ ng rÃ o toÃ n váº¹n cuá»‘i cÃ¹ng thÃ´ng qua partial unique index:
    ```sql
    CREATE UNIQUE INDEX uk_service_assignments_one_active
    ON service_assignments(request_id)
    WHERE is_active = TRUE;
    ```
  - Tuyá»‡t Ä‘á»‘i khÃ´ng dÃ¹ng `(request_id, assignee_id) WHERE is_active = TRUE` vÃ¬ index theo cáº·p váº«n cho phÃ©p hai ká»¹ thuáº­t viÃªn khÃ¡c nhau (User A vÃ  User B) cÃ¹ng á»Ÿ tráº¡ng thÃ¡i active trÃªn cÃ¹ng má»™t request.
- **Káº¿ hoáº¡ch Migration Phase 9**:
  - Táº¡o migration `V013__add_service_request_assignment_invariants.sql` khi báº¯t Ä‘áº§u triá»ƒn khai Phase 9 (khÃ´ng táº¡o trong Ä‘á»£t decision nÃ y).
  - Tuyá»‡t Ä‘á»‘i khÃ´ng sá»­a `V001`-`V012`.
  - KhÃ´ng Ã¢m tháº§m xÃ³a hoáº·c deactivate dá»¯ liá»‡u cÅ©; báº¯t buá»™c cháº¡y preflight query kiá»ƒm tra vi pháº¡m theo Runbook `reports/runbooks/V013_SERVICE_ASSIGNMENT_UNIQUENESS_PLAN.md`.
- **Giao thá»©c KhÃ³a vÃ  Reassignment Transaction**:
  1. **Row coordination lock**: KhÃ³a báº£n ghi `ServiceRequest` báº±ng `ServiceRequestRepository.findByIdForUpdate(UUID id)` vá»›i `@Lock(LockModeType.PESSIMISTIC_WRITE)` vÃ  timeout 5000ms (`jakarta.persistence.lock.timeout` = 5000) hoáº·c native `SELECT ... FOR UPDATE`. KhÃ´ng dá»±a vÃ o khÃ³a row `service_assignments` vÃ¬ báº£n ghi assignment cÃ³ thá»ƒ chÆ°a tá»“n táº¡i khi yÃªu cáº§u má»›i Ä‘Æ°á»£c táº¡o.
  2. **Thá»© tá»± giao dá»‹ch (Transaction Ordering)**: LuÃ´n khÃ³a `ServiceRequest` trÆ°á»›c, sau Ä‘Ã³ má»›i truy váº¥n / ghi `service_assignments` Ä‘á»ƒ loáº¡i bá» nguy cÆ¡ deadlock chÃ©o báº£ng.
  3. **NguyÃªn táº¯c giá»¯ lock**: Tuyá»‡t Ä‘á»‘i khÃ´ng giá»¯ lock trong cÃ¡c thao tÃ¡c File I/O, gá»­i email, push notification hay gá»i network bÃªn ngoÃ i. CÃ¡c tÃ¡c vá»¥ nÃ y pháº£i thá»±c hiá»‡n báº¥t Ä‘á»“ng bá»™ sau khi transaction Ä‘Ã£ commit.
  4. **Kiá»ƒm tra quyá»n actor**: XÃ¡c thá»±c actor cÃ³ quyá»n `SERVICE_REQUEST_ASSIGN`.
  5. **XÃ¡c thá»±c assignee má»›i**: Kiá»ƒm tra user tá»“n táº¡i, Ä‘ang hoáº¡t Ä‘á»™ng (`ACTIVE`), khÃ´ng bá»‹ xÃ³a má»m.
  6. **TÃ¬m active assignment hiá»‡n táº¡i**: `findActiveByRequestId(requestId)`.
  7. **Idempotency**: Náº¿u `assigneeId` má»›i trÃ¹ng vá»›i `assigneeId` hiá»‡n táº¡i Ä‘ang active, tráº£ vá» káº¿t quáº£ hiá»‡n táº¡i mÃ  khÃ´ng táº¡o row trÃ¹ng láº·p.
  8. **Cáº­p nháº­t & ChÃ¨n má»›i**:
     - Náº¿u khÃ¡c `assigneeId`: Set `old.is_active = FALSE`, `old.unassigned_at = server Clock time`.
     - Thá»±c hiá»‡n flush (`saveAndFlush`) Ä‘á»ƒ giáº£i phÃ³ng slot active trong partial index.
     - Táº¡o báº£n ghi má»›i: `id = UUID.randomUUID()`, `requestId`, `assigneeId = newAssigneeId`, `assignedBy = principal.userId()`, `assignedAt = server Clock time`, `isActive = TRUE`.
  9. Cam káº¿t toÃ n bá»™ trong cÃ¹ng `@Transactional`. `assigned_by` láº¥y tá»« Security Principal, khÃ´ng tin cáº­y dá»¯ liá»‡u client gá»­i lÃªn.
  10. Trong mÃ´i trÆ°á»ng Ä‘á»“ng thá»i, chá»‰ má»™t transaction thÃ nh cÃ´ng; transaction kia bá»‹ cháº·n bá»Ÿi partial unique index.
- **Error Mapping & Khoáº£ng trá»‘ng mÃ£ lá»—i**:
  - Khi partial unique index `uk_service_assignments_one_active` bá»‹ vi pháº¡m: Duyá»‡t qua `SQLException` cause chain, báº¯t buá»™c SQLState pháº£i lÃ  `23505`, vÃ  tÃªn constraint pháº£i khá»›p chÃ­nh xÃ¡c `uk_service_assignments_one_active`. KhÃ´ng sá»­ dá»¥ng `message.contains("service_assignments")` lÃ m fallback rá»™ng. KhÃ´ng map cÃ¡c lá»—i Foreign Key (23503) hay Not Null (23502) thÃ nh xung Ä‘á»™t phÃ¢n cÃ´ng. ToÃ n bá»™ transaction pháº£i rollback.
  - **Äá» xuáº¥t thiáº¿t káº¿ mÃ£ lá»—i**: `SERVICE_ASSIGNMENT_CONFLICT` (HTTP 409 Conflict, Message: "YÃªu cáº§u dá»‹ch vá»¥ Ä‘ang Ä‘Æ°á»£c phÃ¢n cÃ´ng Ä‘á»“ng thá»i hoáº·c tráº¡ng thÃ¡i phÃ¢n cÃ´ng Ä‘Ã£ thay Ä‘á»•i. Vui lÃ²ng táº£i láº¡i dá»¯ liá»‡u vÃ  thá»­ láº¡i.").
    - KhÃ¡c biá»‡t vá»›i validation error (400 `VALIDATION_ERROR`): Äá»‹nh dáº¡ng UUID vÃ  thÃ´ng tin assignee há»£p lá»‡ vá» máº·t cÃº phÃ¡p.
    - KhÃ¡c biá»‡t vá»›i optimistic lock (409 `OPTIMISTIC_LOCK_CONFLICT`): Bá»‹ kÃ­ch hoáº¡t bá»Ÿi partial unique index trÃªn `service_assignments`, khÃ´ng pháº£i do lá»‡ch `@Version` trÃªn `service_requests`.
    - KhÃ¡c biá»‡t vá»›i assignee inactive/not found: Tráº£ vá» `USER_NOT_FOUND` hoáº·c `USER_INACTIVE`.
  - **Quy táº¯c Governance & Káº¿t quáº£ vÃ¡ Canonical**: MÃ£ lá»—i `SERVICE_ASSIGNMENT_CONFLICT` (HTTP 409 Conflict, Message: "YÃªu cáº§u dá»‹ch vá»¥ Ä‘ang Ä‘Æ°á»£c phÃ¢n cÃ´ng Ä‘á»“ng thá»i hoáº·c tráº¡ng thÃ¡i phÃ¢n cÃ´ng Ä‘Ã£ thay Ä‘á»•i. Vui lÃ²ng táº£i láº¡i dá»¯ liá»‡u vÃ  thá»­ láº¡i.") Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t chÃ­nh thá»©c vÃ o [06_API_CONTRACT.md](file:///D:/WorkSphere/docs/06_API_CONTRACT.md) Section 13.6 vÃ  20.6. `SERVICE_ASSIGNMENT_ERROR_CODE_GAP` Ä‘Ã£ Ä‘Æ°á»£c giáº£i quyáº¿t triá»‡t Ä‘á»ƒ.

## D-037 Request Number Concurrency, Two-Key Advisory Lock, and Non-Gapless Sequence

- Format canonical lÃ  `SR-YYYY-NNNNNN` (vÃ­ dá»¥: `SR-2026-000001`).
- Ãp dá»¥ng phÆ°Æ¡ng Ã¡n **PostgreSQL Two-Key Transactional Advisory Lock**:
  ```sql
  SELECT pg_advisory_xact_lock(1301, :year);
  ```
  1. `1301` lÃ  integer constant Ä‘áº¡i diá»‡n cho module Service Request numbering, loáº¡i bá» hoÃ n toÃ n nguy cÆ¡ Ä‘á»¥ng Ä‘á»™ chuá»—i bÄƒm (hash collision) cá»§a 64-bit `hashtext`.
  2. `:year` láº¥y tá»« `java.time.Clock` Ä‘Æ°á»£c inject káº¿t há»£p business ZoneId (`ZoneId.of("Asia/Ho_Chi_Minh")`), khÃ´ng láº¥y year tá»« client.
  3. Truy váº¥n sequence sau khÃ³a trong cÃ¹ng transaction:
     ```sql
     SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 9) AS INTEGER)), 0) + 1
     FROM service_requests
     WHERE request_number LIKE 'SR-' || :year || '-%';
     ```
  4. ÄÃ£ kiá»ƒm chá»©ng thá»±c táº¿ trÃªn PostgreSQL 15: `SUBSTRING('SR-2026-000001' FROM 9)` tráº£ vá» chuá»—i `000001` vÃ  `CAST(... AS INTEGER)` tráº£ vá» `1`.
  5. KhÃ³a giao dá»‹ch tá»± Ä‘á»™ng giáº£i phÃ³ng khi commit hoáº·c rollback.
  6. RÃ ng buá»™c `uk_service_requests_request_number` (táº¡o tá»« `V010`) lÃ  hÃ ng rÃ o duy nháº¥t cuá»‘i cÃ¹ng á»Ÿ má»©c database.
  7. Kiá»ƒm thá»­ Ä‘á»“ng thá»i (concurrent create test) báº¯t buá»™c cháº¡y Ä‘a luá»“ng thá»±c táº¿ vá»›i cÃ¡c transaction vÃ  EntityManager Ä‘á»™c láº­p, khÃ´ng dÃ¹ng chung context luá»“ng.
  8. Kiá»ƒm thá»­ ká»‹ch báº£n chuyá»ƒn giao nÄƒm (year rollover) vÃ  kiá»ƒm thá»­ transaction rollback.
  9. **TÃ­nh cháº¥t Non-Gapless vÃ  TÃ¡i sá»­ dá»¥ng sá»‘**:
     - MAX + 1 trong cÃ¹ng transactional advisory lock thÆ°á»ng cÃ³ thá»ƒ tÃ¡i sá»­ dá»¥ng sá»‘ sau rollback vÃ¬ row chÆ°a commit ra khá»i transaction.
     - Há»‡ thá»‘ng khÃ´ng tuyÃªn bá»‘ chuá»—i sá»‘ lÃ  "gapless tuyá»‡t Ä‘á»‘i" vÃ  khÃ´ng coi rollback luÃ´n lÃ m máº¥t sá»‘ thá»© tá»±.
  10. Náº¿u advisory lock query gáº·p database timeout: Sá»­ dá»¥ng infrastructure error mapping hiá»‡n cÃ³, khÃ´ng phÃ¡t minh mÃ£ lá»—i nghiá»‡p vá»¥ má»›i.

## D-038 Service Category Hierarchy and Cycle Prevention

- `parentId` trá» tá»›i danh má»¥c cha trong `service_categories`.
- Äiá»u kiá»‡n há»£p lá»‡ khi gÃ¡n `parentId`: Danh má»¥c cha pháº£i tá»“n táº¡i, Ä‘ang hoáº¡t Ä‘á»™ng (`is_active = TRUE`), chÆ°a bá»‹ xÃ³a má»m (`is_deleted = FALSE`), vÃ  khÃ´ng Ä‘Æ°á»£c lÃ  chÃ­nh nÃ³ (`parentId != id`).
- NgÄƒn ngá»«a chu trÃ¬nh (cycle detection): Duyá»‡t chuá»—i tá»• tiÃªn báº±ng `Set<UUID> visited`. Náº¿u gáº·p ID cá»§a chÃ­nh danh má»¥c Ä‘ang cáº­p nháº­t thÃ¬ tá»« chá»‘i ngay. KhÃ´ng Ã¡p Ä‘áº·t giá»›i háº¡n depth tÃ¹y tiá»‡n.

## D-039 File Delete Memory Inaccuracy Correction

- XÃ¡c nháº­n chÃ­nh thá»©c ráº±ng mÃ£ nguá»“n `FileController.java` vÃ  test suite `FileMockMvcTest.java` hiá»‡n thá»±c endpoint `DELETE /api/v1/files/{fileId}` tráº£ vá» **HTTP 200 OK** kÃ¨m body `ApiResponse<Void>` (chá»©a `success: true`).
- ÄÃ­nh chÃ­nh cÃ¡c ghi chÃº trong bÃ¡o cÃ¡o bá»™ nhá»› trÆ°á»›c Ä‘Ã¢y tá»«ng ghi nháº§m lÃ  `204 No Content`. KhÃ´ng sá»­a `FileController` hay `PHASE_08_REPORT.md`.

## D-040 Service Category Canonical Error Codes

- XÃ¡c minh Ä‘á»‘i chiáº¿u vá»›i [06_API_CONTRACT.md](file:///D:/WorkSphere/docs/06_API_CONTRACT.md) Section 20.6:
  1. `SERVICE_CATEGORY_NOT_FOUND` (HTTP 404): CÃ³ trong canonical contract (YES). DÃ¹ng cho `GET/PUT/PATCH /admin/service-categories/{id}` vÃ  `POST /service-requests` khi categoryId khÃ´ng tá»“n táº¡i.
  2. `SERVICE_CATEGORY_CODE_ALREADY_EXISTS` (HTTP 409): CÃ³ trong canonical contract (YES). Thay tháº¿ cho tÃªn ad-hoc `SERVICE_CATEGORY_CODE_DUPLICATE`.
  3. `SERVICE_CATEGORY_PARENT_INVALID` (HTTP 400): CÃ³ trong canonical contract (YES). DÃ¹ng khi danh má»¥c cha khÃ´ng tá»“n táº¡i hoáº·c khÃ´ng há»£p lá»‡, thay tháº¿ tÃªn ad-hoc `PARENT_CATEGORY_NOT_FOUND`.
  4. `SERVICE_CATEGORY_CYCLE_DETECTED` (HTTP 400): CÃ³ trong canonical contract (YES). DÃ¹ng khi phÃ¡t hiá»‡n chu trÃ¬nh danh má»¥c, thay tháº¿ tÃªn ad-hoc `CATEGORY_CYCLE_DETECTED`.
  5. `SERVICE_CATEGORY_ALREADY_INACTIVE` (HTTP 400): CÃ³ trong canonical contract (YES). DÃ¹ng khi deactivate danh má»¥c Ä‘Ã£ ngÆ°ng hoáº¡t Ä‘á»™ng.
  6. `SERVICE_CATEGORY_ALREADY_ACTIVE` (HTTP 400): CÃ³ trong canonical contract (YES). DÃ¹ng khi activate danh má»¥c Ä‘ang hoáº¡t Ä‘á»™ng.
  7. `SERVICE_CATEGORY_IN_USE` (HTTP 400): CÃ³ trong canonical contract (YES). DÃ¹ng khi thao tÃ¡c vi pháº¡m rÃ ng buá»™c danh má»¥c Ä‘ang Ä‘Æ°á»£c sá»­ dá»¥ng.
- **Káº¿t luáº­n**: Táº¥t cáº£ cÃ¡c mÃ£ lá»—i cáº§n thiáº¿t cho Service Category Ä‘á»u Ä‘Ã£ cÃ³ sáºµn trong canonical contract dÆ°á»›i tÃªn chuáº©n `SERVICE_CATEGORY_*`. KhÃ´ng tá»“n táº¡i `SERVICE_CATEGORY_ERROR_CODE_GAP` náº¿u implementation tuÃ¢n thá»§ Ä‘Ãºng tÃªn canonical.

## D-041 Authorization Role-Permission Audit, Migration Decoupling, and Blockers

- **Káº¿t quáº£ kiá»ƒm toÃ¡n cÆ¡ sá»Ÿ dá»¯ liá»‡u vÃ  mÃ£ nguá»“n**:
  - `ROLE_PERMISSION_SEED_GAP_CONFIRMED`: Báº£n di trÃº `V011__seed_roles_and_permissions.sql` chá»‰ seed báº£ng `roles` (4 dÃ²ng) vÃ  `permissions` (29 dÃ²ng); báº£ng `role_permissions` cÃ³ **0 dÃ²ng**.
  - `TEST_AUTHORITY_FIXTURE_MASKS_SEED_GAP`: CÃ¡c test suite integration/MockMvc hiá»‡n táº¡i (`AdminUserMockMvcTest`, `DepartmentMockMvcTest`, `ProjectMockMvcTest`, `TaskMockMvcTest`, `TaskAttachmentMockMvcTest`) Ä‘á»u tá»± Ä‘á»™ng cháº¡y lá»‡nh `INSERT INTO role_permissions` trong `@BeforeEach`, che giáº¥u khoáº£ng trá»‘ng dá»¯ liá»‡u seed cá»§a mÃ´i trÆ°á»ng production.
  - `ROLE_PERMISSION_CANONICAL_MATRIX_GAP`: ÄÃ£ Ä‘Æ°á»£c giáº£i quyáº¿t báº±ng viá»‡c thiáº¿t láº­p báº£ng ma tráº­n chÃ­nh thá»©c trong `02_USER_ROLES_AND_WORKFLOWS.md` Section 2.6.
  - `SERVICE_AUTHORIZATION_MAPPING_GAP`: ÄÃ£ giáº£i quyáº¿t báº±ng viá»‡c cáº¥p `SERVICE_REQUEST_ASSIGN` chÃ­nh thá»©c cho `ADMIN` trong MVP.
- **Quy táº¯c phÃ¢n quyá»n vÃ  Admin Bypass**:
  - Endpoint báº£o vá»‡ bá»Ÿi `@PreAuthorize("hasAuthority('...')")`. Khi `role_permissions` trá»‘ng, `authorities` chá»‰ cÃ³ `ROLE_<ROLE_CODE>`, khÃ´ng cÃ³ permission nÃ o.
  - Há»‡ thá»‘ng khÃ´ng cÃ³ cÆ¡ cháº¿ bypass cho Admin; do Ä‘Ã³ trÃªn production, má»i user (ká»ƒ cáº£ Admin) sáº½ bá»‹ HTTP 403 Forbidden náº¿u khÃ´ng cÃ³ dá»¯ liá»‡u trong `role_permissions`.
  - Vai trÃ² `TEAM_LEADER` chá»‰ quáº£n lÃ½ cÃ´ng viá»‡c dá»± Ã¡n/nhÃ³m (`TASK_ASSIGN`), khÃ´ng cÃ³ tháº©m quyá»n phÃ¢n cÃ´ng yÃªu cáº§u dá»‹ch vá»¥ (`SERVICE_REQUEST_ASSIGN`). Tuyá»‡t Ä‘á»‘i khÃ´ng suy diá»…n cáº¥p quyá»n chá»‰ vÃ¬ tÃªn chá»©c danh.
- **Káº¿ hoáº¡ch Migration Phase 9**:
  - TÃ¡ch biá»‡t hai báº£n migration (PhÆ°Æ¡ng Ã¡n B):
    1. `V013__add_service_request_assignment_invariants.sql`: Chá»‰ táº¡o partial unique index `uk_service_assignments_one_active` trong domain Service Request.
    2. `V014__seed_role_permissions.sql`: Seed dá»¯ liá»‡u liÃªn káº¿t vai trÃ² - quyá»n háº¡n sau khi tÃ i liá»‡u canonical hoÃ n táº¥t phÃª duyá»‡t ma tráº­n phÃ¢n quyá»n chÃ­nh thá»©c.
  - Sá»­ dá»¥ng cÃº phÃ¡p idempotent `INSERT INTO role_permissions ... ON CONFLICT (role_id, permission_id) DO NOTHING`.

## D-042 Canonical Role-Permission Matrix Resolution and Foundation Authorization Remediation

- **Ma tráº­n phÃ¢n quyá»n Canonical chÃ­nh thá»©c**:
  - ÄÃ£ bá»• sung Section 2.6 vÃ o [02_USER_ROLES_AND_WORKFLOWS.md](file:///D:/WorkSphere/docs/02_USER_ROLES_AND_WORKFLOWS.md).
  - PhÃ¢n bá»• 29 permissions cho 4 System Roles:
    - `ADMIN`: 29 permissions (toÃ n bá»™ quyá»n há»‡ thá»‘ng).
    - `PROJECT_MANAGER`: 19 permissions (cÃ¡c quyá»n tá»± phá»¥c vá»¥, quáº£n lÃ½ dá»± Ã¡n phá»¥ trÃ¡ch vÃ  quáº£n lÃ½ cÃ´ng viá»‡c).
    - `TEAM_LEADER`: 14 permissions (káº¿ thá»«a tá»± phá»¥c vá»¥ cá»§a nhÃ¢n viÃªn, bá»• sung `TASK_CREATE`, `TASK_ASSIGN`, `TASK_UPDATE_STATUS`).
    - `EMPLOYEE`: 12 permissions (chá»‰ gá»“m cÃ¡c quyá»n tá»± phá»¥c vá»¥ cÃ¡ nhÃ¢n, cáº­p nháº­t cÃ´ng viá»‡c Ä‘Æ°á»£c giao vÃ  cÃ¡c yÃªu cáº§u dá»‹ch vá»¥ cá»§a chÃ­nh mÃ¬nh).
  - Báº£ng quyá»n háº¡n há»‡ thá»‘ng chá»‰ Ä‘Ã³ng vai trÃ² lÃ  "cá»•ng kiá»ƒm tra toÃ n cá»¥c" (`hasAuthority(...)`); cÃ¡c Application Service báº¯t buá»™c tiáº¿p tá»¥c kiá»ƒm tra cÃ¡c rÃ ng buá»™c quan há»‡ nghiá»‡p vá»¥ cá»¥c bá»™ (`project membership`, `requester`, `active assignee`, `resource ownership`).
- **Hiá»‡n thá»±c di trÃº CSDL**:
  - `V013__add_service_request_assignment_invariants.sql`: Táº¡o thÃ nh cÃ´ng partial unique index `uk_service_assignments_one_active` trÃªn `service_assignments(request_id) WHERE is_active = TRUE`.
  - `V014__seed_role_permissions.sql`: Seed 74 báº£n ghi liÃªn káº¿t quyá»n háº¡n chÃ­nh thá»©c vÃ o `role_permissions` vá»›i cÆ¡ cháº¿ idempotent `ON CONFLICT (role_id, permission_id) DO NOTHING`.
- **Kiá»ƒm thá»­ xÃ¡c thá»±c sáº¡ch (Clean-Migration Auth Test)**:
  - Bá»• sung `RolePermissionSeedIntegrationTest.java` cháº¡y trÃªn PostgreSQL Testcontainers sáº¡ch.
  - Kiá»ƒm thá»­ Ä‘Äƒng nháº­p tháº­t qua `/api/v1/auth/login`, nháº­n JWT tháº­t vÃ  gá»­i request tá»›i cÃ¡c endpoint báº£o vá»‡ báº±ng `@PreAuthorize`.
  - Tuyá»‡t Ä‘á»‘i khÃ´ng cÃ³ báº¥t ká»³ cÃ¢u lá»‡nh chÃ¨n fixture thá»§ cÃ´ng nÃ o vÃ o `role_permissions` trong test nÃ y. ToÃ n bá»™ quyá»n háº¡n Ä‘Æ°á»£c náº¡p 100% tá»« migration `V014`.
  - Kiá»ƒm tra Ä‘á»™c láº­p quyá»n `SERVICE_REQUEST_ASSIGN`: Admin Ä‘Æ°á»£c phÃ©p, Team Leader / PM / Employee bá»‹ tá»« chá»‘i vá»›i HTTP 403 Forbidden.
  - ToÃ n bá»™ 177/177 bÃ i kiá»ƒm thá»­ cá»§a repository vÃ  0 lá»—i Checkstyle Ä‘á»u PASS vá»›i exit code 0.

## D-043 Project Member Access Remediation, Canonical Matrix Hardening, and V015 Migration

- **Bá»‘i cáº£nh**:
  - Kiá»ƒm toÃ¡n Ä‘á»™c láº­p phÃ¡t hiá»‡n `PROJECT_READ_PERMISSION_MATRIX_RISK`: `ProjectController` báº£o vá»‡ endpoint `GET /projects/{projectId}`, `GET /projects/{projectId}/members`, `GET /projects/{projectId}/milestones` báº±ng `@PreAuthorize("hasAuthority('PROJECT_READ')")`.
  - Trong ma tráº­n V014 trÆ°á»›c Ä‘Ã¢y, `PROJECT_READ` chá»‰ Ä‘Æ°á»£c cáº¥p cho `ADMIN` vÃ  `PROJECT_MANAGER`. Do Ä‘Ã³, nhÃ¢n viÃªn (`EMPLOYEE`) vÃ  trÆ°á»Ÿng nhÃ³m (`TEAM_LEADER`) dÃ¹ lÃ  thÃ nh viÃªn dá»± Ã¡n Ä‘ang hoáº¡t Ä‘á»™ng (`active project member`) cÅ©ng bá»‹ cháº·n bá»Ÿi cá»•ng báº£o vá»‡ Spring Security vá»›i HTTP 403 Forbidden trÆ°á»›c khi request Ä‘áº¿n Ä‘Æ°á»£c táº§ng nghiá»‡p vá»¥.
  - Kiá»ƒm toÃ¡n cÅ©ng phÃ¡t hiá»‡n `ROLE_PERMISSION_SEED_SILENT_OMISSION_RISK` do cÃ¢u lá»‡nh `INSERT ... SELECT WHERE p.code IN (...)` cÃ³ thá»ƒ im láº·ng bá» sÃ³t dÃ²ng náº¿u cÃ³ lá»—i chÃ­nh táº£, vÃ  `ROLE_PERMISSION_MATRIX_EVIDENCE_GAP` do lá»‡ch sá»‘ section tham chiáº¿u trong cá»™t rationale cá»§a tÃ i liá»‡u canonical.
- **Quyáº¿t Ä‘á»‹nh Ä‘iá»u chá»‰nh Ma tráº­n Canonical**:
  - `PROJECT_READ` Ä‘Æ°á»£c chÃ­nh thá»©c cáº¥p (`GRANTED`) cho toÃ n bá»™ 4 System Roles (`ADMIN`, `PROJECT_MANAGER`, `TEAM_LEADER`, `EMPLOYEE`).
  - Äiá»u kiá»‡n quan há»‡ nghiá»‡p vá»¥ báº¯t buá»™c (`Business relation required`): ThÃ nh viÃªn dá»± Ã¡n Ä‘ang hoáº¡t Ä‘á»™ng (`Active Project Member`) hoáº·c pháº¡m vi quáº£n trá»‹ canonical cá»§a `ADMIN`.
  - Quyá»n `PROJECT_READ` toÃ n cá»¥c Ä‘Ã³ng vai trÃ² cá»•ng xÃ¡c thá»±c; táº§ng Application Service/Repository báº¯t buá»™c tiáº¿p tá»¥c kiá»ƒm tra quyá»n thÃ nh viÃªn vÃ  phÃ¢n quyá»n dá»¯ liá»‡u.
  - Hiá»‡u chá»‰nh toÃ n bá»™ cÃ¡c tham chiáº¿u sá»‘ section bá»‹ lá»‡ch trong cá»™t rationale cá»§a `docs/02_USER_ROLES_AND_WORKFLOWS.md` Section 2.6 (trá» Ä‘Ãºng Section 11 cho Project, Section 12 cho Task, Section 17 cho Admin/User/Department, Section 18 cho Audit).
- **Di trÃº CSDL V015 (Báº¥t biáº¿n V014)**:
  - Giá»¯ nguyÃªn V001â€“V014 Ä‘á»ƒ báº£o toÃ n checksum Flyway.
  - Táº¡o má»›i `V015__correct_project_read_permissions_and_validate_role_matrix.sql`:
    1. Cáº¥p bá»• sung `PROJECT_READ` cho `TEAM_LEADER` vÃ  `EMPLOYEE`.
    2. Bá»• sung `DO $$ ... END $$;` block thá»±c hiá»‡n strict validation guard, fail-fast náº¿u sai sá»‘ lÆ°á»£ng mapping:
       - roles = 4, permissions = 29.
       - ADMIN = 29, PROJECT_MANAGER = 19, TEAM_LEADER = 15, EMPLOYEE = 13.
       - Tá»•ng mapping = 76.
       - `PROJECT_READ` cÃ³ Ä‘á»§ trÃªn cáº£ 4 vai trÃ².
       - `SERVICE_REQUEST_ASSIGN` vÃ  `SERVICE_CATEGORY_MANAGE` chá»‰ duy nháº¥t thuá»™c vá» `ADMIN`.
- **Kiá»ƒm thá»­ vÃ  xÃ¡c minh**:
  - Cáº­p nháº­t `RolePermissionSeedIntegrationTest.java` vá»›i ká»‹ch báº£n kiá»ƒm tra exact set comparison (`EXPECTED EXCEPT ACTUAL = empty` vÃ  `ACTUAL EXCEPT EXPECTED = empty`).
  - Bá»• sung ká»‹ch báº£n kiá»ƒm thá»­ tÃ­ch há»£p truy cáº­p chi tiáº¿t dá»± Ã¡n (`GET /api/v1/projects/{projectId}`) cho `EMPLOYEE` vÃ  `TEAM_LEADER` lÃ  active project member, xÃ¡c nháº­n tráº£ vá» HTTP 200 OK thÃ nh cÃ´ng báº±ng JWT tháº­t.
  - Cáº­p nháº­t `ProjectMockMvcTest.java` Ä‘á»ƒ kiá»ƒm thá»­ kiá»ƒm tra quyá»n truy cáº­p dá»± Ã¡n báº±ng token khÃ´ng cÃ³ quyá»n (`unprivilegedToken`) thay cho `employeeToken`.

## D-044 Project Read Member-Scoped Access Control and Query-Level Enforcement

- **Bá»‘i cáº£nh & PhÃ¡t hiá»‡n Kiá»ƒm toÃ¡n**:
  - Kiá»ƒm toÃ¡n mÃ£ nguá»“n phÃ¡t hiá»‡n dá»¯ liá»‡u dá»± Ã¡n bá»‹ rÃ² rá»‰ (data leak):
    - `GET /api/v1/projects`: TrÆ°á»›c Ä‘Ã¢y khÃ´ng truyá»n thÃ´ng tin ngÆ°á»i dÃ¹ng xÃ¡c thá»±c xuá»‘ng Application Service/Repository; cÃ¢u lá»‡nh query tráº£ vá» toÃ n bá»™ dá»± Ã¡n trong cÆ¡ sá»Ÿ dá»¯ liá»‡u mÃ  khÃ´ng lá»c theo quan há»‡ thÃ nh viÃªn.
    - `GET /api/v1/projects/{projectId}`, `GET /api/v1/projects/{projectId}/members`, `GET /api/v1/projects/{projectId}/milestones`: KhÃ´ng kiá»ƒm tra xem ngÆ°á»i gá»i cÃ³ pháº£i lÃ  active project member hoáº·c Admin khÃ´ng; ngÆ°á»i dÃ¹ng unrelated hoáº·c inactive member chá»‰ cáº§n cÃ³ global `PROJECT_READ` lÃ  Ä‘á»c Ä‘Æ°á»£c toÃ n bá»™ chi tiáº¿t, thÃ nh viÃªn vÃ  má»‘c tiáº¿n Ä‘á»™ cá»§a dá»± Ã¡n.
- **Quy táº¯c PhÃ¢n quyá»n Äá»c Dá»± Ã¡n theo Canonical**:
  - `ADMIN`: CÃ³ pháº¡m vi quáº£n trá»‹ toÃ n há»‡ thá»‘ng theo canonical; Ä‘Æ°á»£c quyá»n xem toÃ n bá»™ dá»± Ã¡n, danh sÃ¡ch thÃ nh viÃªn vÃ  má»‘c tiáº¿n Ä‘á»™ mÃ  khÃ´ng yÃªu cáº§u pháº£i lÃ  thÃ nh viÃªn trong báº£ng `project_members`.
  - `EMPLOYEE`, `TEAM_LEADER`, `PROJECT_MANAGER`: Báº¯t buá»™c pháº£i lÃ  thÃ nh viÃªn Ä‘ang hoáº¡t Ä‘á»™ng (`is_active = TRUE`) trong `project_members` cá»§a dá»± Ã¡n Ä‘Ã³ má»›i Ä‘Æ°á»£c truy cáº­p (`GET /projects/{projectId}`, `GET /projects/{projectId}/members`, `GET /projects/{projectId}/milestones`). Náº¿u khÃ´ng pháº£i active member, tráº£ vá» HTTP 403 Forbidden (`FORBIDDEN`).
  - PhÃ¢n vÃ¹ng truy váº¥n danh sÃ¡ch (`GET /api/v1/projects`):
    - Thá»±c thi hoÃ n toÃ n táº¡i táº§ng CSDL thÃ´ng qua cÃ¢u lá»‡nh SQL JPQL:
      `AND (:memberUserId IS NULL OR EXISTS (SELECT 1 FROM ProjectMember pm WHERE pm.projectId = p.id AND pm.userId = :memberUserId AND pm.active = true))`
    - Tuyá»‡t Ä‘á»‘i khÃ´ng táº£i toÃ n bá»™ vÃ o Java rá»“i lá»c in-memory sau phÃ¢n trang.
    - Cáº£ truy váº¥n dá»¯ liá»‡u vÃ  truy váº¥n Ä‘áº¿m (`countQuery`) Ä‘á»u Ã¡p dá»¥ng cÃ¹ng Ä‘iá»u kiá»‡n scope, Ä‘áº£m báº£o metadata phÃ¢n trang (`totalElements`, `totalPages`) hoÃ n toÃ n chÃ­nh xÃ¡c.
    - CÃ¡c tham sá»‘ tÃ¬m kiáº¿m (`search`), bá»™ lá»c (`status`, `priority`, `managerId`, `departmentId`) vÃ  sáº¯p xáº¿p (`sort`) Ä‘Æ°á»£c káº¿t há»£p báº±ng `AND`, Ä‘áº£m báº£o khÃ´ng bao giá» bá»‹ máº¥t pháº¡m vi (scope loss).
- **Hiá»‡n thá»±c & Kiá»ƒm thá»­**:
  - Cáº­p nháº­t `ProjectRepository.java`, `ProjectApplicationService.java`, `ProjectMemberApplicationService.java`, `MilestoneApplicationService.java`, `ProjectController.java`.
  - ThÃªm 5 ká»‹ch báº£n kiá»ƒm thá»­ tÃ­ch há»£p toÃ n diá»‡n trong `RolePermissionSeedIntegrationTest.java` (Test 9, 10, 11, 12, 13) sá»­ dá»¥ng login tháº­t vÃ  JWT tháº­t tá»« V015 trÃªn PostgreSQL Testcontainers sáº¡ch:
    - Test 9: Active Employee & Team Leader Ä‘á»c thÃ nh cÃ´ng detail, members, milestones vÃ  list (HTTP 200).
    - Test 10: Unrelated Employee bá»‹ tá»« chá»‘i 403 Forbidden trÃªn detail, members, milestones; dá»± Ã¡n khÃ´ng xuáº¥t hiá»‡n trong list (`totalItems = 0`).
    - Test 11: Inactive Member (`is_active = false`) bá»‹ tá»« chá»‘i 403 Forbidden trÃªn detail, members, milestones; dá»± Ã¡n khÃ´ng xuáº¥t hiá»‡n trong list.
    - Test 12: Multi-project database scoping (A=active, B=unrelated, C=inactive) chá»‰ tráº£ vá» Project A vá»›i totalElements=1; search vÃ  sort báº£o toÃ n scope.
    - Test 13: Admin truy cáº­p toÃ n cá»¥c; Project Manager chá»‰ truy cáº­p Ä‘Æ°á»£c dá»± Ã¡n mÃ¬nh tham gia, bá»‹ tá»« chá»‘i 403 á»Ÿ dá»± Ã¡n khÃ´ng liÃªn quan.
  - ToÃ n bá»™ suite 183/183 PASS vÃ  0 lá»—i Checkstyle.

## D-045 Service Request Module Implementation (Phase 9)

- **Bối cảnh**:
  - Triển khai Phase 9 - Service Request Module theo các tài liệu canonical và quyết định D-035 đến D-044.
  - CSDL đã có đầy đủ schema từ V007, V010, V013 và authorization foundation từ V014, V015 (không cần tạo V016).
- **Quyết định Thiết kế & Hiện thực**:
  1. **Service Category**:
     - Hỗ trợ phân cấp cây danh mục với độ sâu tùy ý (> 50 cấp được kiểm chứng hợp lệ mà không bị giới hạn đệ quy tùy tiện).
     - Thuật toán phát hiện chu trình (cycle detection) bằng `Set<UUID> visited` trong một lượt duyệt từ node cha lên gốc (`SERVICE_CATEGORY_CYCLE_DETECTED`, 400).
     - Chuẩn hóa mã định danh (`code`) theo regex `^[A-Z0-9_]{2,50}$` và đảm bảo duy nhất (`SERVICE_CATEGORY_CODE_ALREADY_EXISTS`, 409).
     - Ràng buộc cha phải tồn tại, đang hoạt động (`is_active = true`) và chưa bị xoá mềm (`SERVICE_CATEGORY_PARENT_INVALID`, 400).
     - Chặn vô hiệu hóa danh mục đang được sử dụng bởi các service request chưa kết thúc (`SERVICE_CATEGORY_IN_USE`, 400).
     - Điều khiển đồng thời bằng optimistic locking (`@Version`).
  2. **Service Request Number Allocation**:
     - Định dạng canonical: `SR-YYYY-NNNNNN` (ví dụ `SR-2026-000001`).
     - Xác định năm nghiệp vụ (`:year`) từ `java.time.Clock` được inject kết hợp business zone `Asia/Ho_Chi_Minh`, không lấy từ client.
     - Sử dụng PostgreSQL two-key transactional advisory lock: `SELECT pg_advisory_xact_lock(1301, :year)` với module key `1301`.
     - Phân bổ số thứ tự bằng Year-scoped MAX + 1:
       `SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 9) AS INTEGER)), 0) + 1 FROM service_requests WHERE request_number LIKE 'SR-' || :year || '-%'`
     - Tự động reset chuỗi số về `000001` khi bước sang năm dương lịch mới.
     - Ràng buộc duy nhất `uk_service_requests_request_number` (tạo từ V010) là hàng rào bảo vệ cuối cùng ở tầng database.
     - Cơ chế sinh số là year-scoped transactional allocation, tuyệt đối không mô tả là PostgreSQL sequence.
     - Chuỗi phân bổ số không đảm bảo gapless tuyệt đối (allocation series is not guaranteed gapless).
     - Kiểm thử đồng thời: 8 concurrent workers x 5 rounds trên PostgreSQL Testcontainers xác nhận 100% số sinh ra là duy nhất và không có trùng lặp.
  3. **Service Assignment Concurrency & Invariants**:
     - Bất biến cardinality: Mỗi Service Request tại một thời điểm chỉ có tối đa một kỹ thuật viên hoạt động (`active cardinality = 0..1`).
     - Sử dụng bản ghi `ServiceRequest` làm row coordination lock thông qua `PESSIMISTIC_WRITE` (`@Lock(LockModeType.PESSIMISTIC_WRITE)`).
     - Phân công lại cùng người xử lý đang active là thao tác idempotent (HTTP 200 OK, không tạo bản ghi trùng lặp).
     - Tái phân công cho người khác: Đóng bản ghi cũ (`is_active = FALSE`, `unassigned_at = Clock.instant()`), thực hiện flush (`saveAndFlush`) trước khi chèn bản ghi mới trong cùng transaction.
     - Hàng rào database cuối cùng: Partial unique index `uk_service_assignments_one_active` trên `service_assignments(request_id) WHERE is_active = TRUE` (migration `V013`).
     - Bắt chính xác lỗi vi phạm qua SQLException SQLState `23505` và tên constraint `uk_service_assignments_one_active`, map sang `SERVICE_ASSIGNMENT_CONFLICT` (HTTP 409 Conflict).
     - Kiểm thử đồng thời có kiểm soát: 2 concurrent workers x 5 rounds xác nhận hai request có thể cùng trả về 200 nếu PESSIMISTIC_WRITE row lock tuần tự hóa thành công hoặc một request trả 409 SERVICE_ASSIGNMENT_CONFLICT khi xảy ra conflict; không có HTTP 500; CSDL luôn bảo toàn đúng duy nhất 1 active assignment.
  4. **Status Workflow & History Transaction Atomicity**:
     - 7 trạng thái canonical: `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_FOR_USER`, `RESOLVED`, `CLOSED`, `CANCELLED`.
     - Chuyển sang `RESOLVED` bắt buộc có ghi chú/giải pháp (`comment`).
     - Trạng thái kết thúc: `CLOSED` (ghi nhận `closed_at`), `CANCELLED` (ghi nhận `cancelled_at`).
     - Mọi bước chuyển trạng thái hợp lệ đều ghi nhận lịch sử vào `service_status_histories` trong cùng database transaction (`@Transactional`).
     - Client không được phép cung cấp `changedBy` hoặc `changedAt`; các trường này bắt buộc lấy từ Security Principal và injected `Clock`.
     - Kiểm thử rollback trên PostgreSQL: Bằng trigger giả lập lỗi tạm thời trên `service_status_histories`, toàn bộ transaction bị rollback, `ServiceRequest` giữ nguyên trạng thái, version, timestamps và số lượng bản ghi lịch sử không thay đổi.
  5. **Reject Resolution Endpoint**:
     - Endpoint chuyên biệt: `POST /api/v1/service-requests/{requestId}/reject-resolution`.
     - Ràng buộc quyền sở hữu: Chỉ người tạo yêu cầu (`requester`) mới được gọi; người khác bị chặn HTTP 403 Forbidden.
     - Chỉ cho phép khi yêu cầu đang ở `RESOLVED`, chuyển về `IN_PROGRESS`, giữ nguyên người xử lý đang hoạt động và ghi lý do vào lịch sử.
  6. **Comments & Internal Notes Visibility**:
     - Phân loại rõ bình luận công khai và ghi chú nội bộ (`is_internal = true`).
     - Người tạo yêu cầu (`requester`) chỉ xem và tạo bình luận công khai, bị cấm tuyệt đối tạo hoặc xem ghi chú nội bộ.
     - Kỹ thuật viên đang hoạt động (`active assignee`) và Quản trị viên (`ADMIN`) có quyền xem và tạo ghi chú nội bộ.
     - Kỹ thuật viên trước đó đã bị thu hồi phân công (`previous assignee`) bị tước toàn bộ quyền truy cập (HTTP 403 Forbidden).
     - Lọc phạm vi hiển thị thực hiện hoàn toàn tại tầng CSDL (query-level filtering) trước khi tính toán phân trang và metadata `totalElements`/`totalPages`.
  7. **Service Attachment Semantics & File Integration**:
     - Bảng `service_attachments` quản lý liên kết ở cấp Service Request (`request_id`, không có `comment_id` trong schema).
     - Khi gửi `attachmentFileIds` trong bình luận, hệ thống tạo liên kết tệp ở cấp Service Request; bình luận không sở hữu tệp đính kèm.
     - Tái sử dụng File Module Phase 8: Tệp phải được tải lên trước với mục đích `SERVICE_ATTACHMENT` và trạng thái `ACTIVE`.
     - Kiểm tra quyền sở hữu tệp (người tải lên hoặc Admin) và cấm tái sử dụng chéo giữa các service request khác nhau.
     - Download authorization thừa kế quyền truy cập service request (requester, active assignee, admin); người không liên quan bị 403 Forbidden.
     - Chiếu response theo chuẩn D-035: không để lộ thông tin đường dẫn lưu trữ nội bộ và không ngụ ý quyền sở hữu tệp thuộc về bình luận.
  8. **Service Rating**:
     - Chỉ người tạo yêu cầu (`requester`) được đánh giá khi yêu cầu đã ở trạng thái `CLOSED`.
     - Điểm số từ 1 đến 5 sao; tối đa 1 đánh giá cho mỗi yêu cầu.
     - Hàng rào CSDL: Unique constraint `service_ratings.request_id` ngăn chặn đánh giá trùng lặp.
     - Đánh giá đồng thời bị chặn và map chính xác sang `SERVICE_RATING_ALREADY_EXISTS` (HTTP 409 Conflict), kiểm chứng qua 2 workers x 5 rounds.
  9. **Query-Level Scoping**:
     - Sử dụng Spring Data JPA `Specification<ServiceRequest>` để lọc hoàn toàn tại câu lệnh SQL trong database (Admin xem tất cả; người khác chỉ xem yêu cầu do mình tạo hoặc được phân công).
     - Metadata phân trang và đếm dòng bảo toàn scope tuyệt đối.
  10. **Deferred Side Effects**:
      - Ghi nhận `NOTIFICATION_SIDE_EFFECT_DEFERRED` vào nhật ký hệ thống; không tạo module notification hoặc phụ thuộc giả lập.

## D-046 Pre-Implementation Decisions: Asset Module (Phase 10)

- **Bối cảnh & Trạng thái Gap**:
  - Khảo sát và kiểm toán phạm vi Phase 10 (Asset Module) theo `docs/08_DEVELOPMENT_ROADMAP.md` Section 14, `docs/05_DATABASE_DESIGN.md` Section 10 và `docs/06_API_CONTRACT.md` Section 14.
  - Trạng thái xử lý các khoảng trống thiết kế trước implementation:
    - `API_CONTRACT_GAP`: **RESOLVED BY CANONICAL PATCH** (đã cập nhật `docs/06_API_CONTRACT.md` Section 14.0.6, 14.4, 14.5, 14.6, 14.7, 14.9, 20.7 với đầy đủ DTO tạo/sửa tài sản, Repair History API, và các mã lỗi liên quan).
    - `ASSET_CODE_POLICY_GAP`: **RESOLVED BY D-046** (chuẩn hóa quy tắc mã tài sản và tính duy nhất toàn cục).
    - `ASSET_SERVICE_REQUEST_INTEGRATION_GAP`: **RESOLVED BY D-046** (chuẩn hóa chính sách liên kết tham chiếu giữa Service Request và Asset).
    - `SCHEMA_GAP`: **DESIGN RESOLVED; IMPLEMENTATION PENDING V016** (đã thiết kế DDL và runbook tiền kiểm tại `reports/runbooks/V016_ASSET_INVARIANTS_AND_INDEXES_PLAN.md`; bản di trú `V016` chưa được tạo trong migration source).
- **Quyết định Thiết kế & Chuẩn hóa**:
  1. **Chính sách mã tài sản (`assetCode`)**:
     - Do client nhập trên giao diện tạo tài sản (`Create Asset Screen`), backend không tự động sinh sequence.
     - Chuẩn hóa: Tự động loại bỏ khoảng trắng đầu/cuối (trim) và chuyển thành chữ in hoa (uppercase).
     - Định dạng hợp lệ: Regex `^[A-Z0-9][A-Z0-9_-]{1,49}$` (độ dài từ 2 đến 50 ký tự, bắt đầu bằng chữ hoa hoặc chữ số, cho phép dấu gạch ngang và gạch dưới).
     - Bất biến: Mã tài sản là bất biến vĩnh viễn sau khi tạo; endpoint `PUT /assets/{assetId}` không cho phép sửa đổi `assetCode`.
     - Tính duy nhất: Bảo vệ bởi Unique Index `uk_assets_asset_code`. Tính duy nhất áp dụng toàn cục trên toàn bộ bảng `assets` (kể cả bản ghi đã xóa mềm `is_deleted = true`) nhằm đảm bảo tính toàn vẹn của lịch sử và audit trail thiết bị phần cứng.
     - Xử lý trùng lặp: Trả về HTTP 409 `ASSET_CODE_ALREADY_EXISTS`.
  2. **Chính sách mã loại tài sản (`category.code`) & Category In-Use**:
     - Do quản trị viên nhập, trim và chuẩn hóa chữ in hoa.
     - Định dạng hợp lệ: Regex `^[A-Z0-9_]{2,50}$`.
     - Bất biến: Không cho phép đổi `code` khi cập nhật qua `PUT /admin/asset-categories/{categoryId}`.
     - Tính duy nhất: Duy nhất toàn cục vĩnh viễn (`uk_asset_categories_code`), kể cả loại tài sản đã ngừng hoạt động hoặc xóa mềm.
     - Xử lý trùng lặp: Trả về HTTP 409 `ASSET_CATEGORY_CODE_ALREADY_EXISTS`.
     - **Chính sách In-Use**: Không cho phép dừng hoạt động (`deactivate`) nếu tồn tại bất kỳ tài sản nào chưa bị xóa mềm (`is_deleted = false`) đang tham chiếu đến loại tài sản này (`ASSET_CATEGORY_IN_USE`, HTTP 400). Tài sản ở trạng thái `RETIRED` vẫn là dữ liệu chưa xóa mềm và vẫn được tính là đang sử dụng (in-use).
     - Loại tài sản inactive vẫn được hiển thị đầy đủ trong lịch sử và chi tiết tài sản đã tạo trước đó, nhưng không được phép chọn để tạo hoặc cập nhật tài sản mới (`ASSET_CATEGORY_ALREADY_INACTIVE`, HTTP 400).
  3. **Khởi tạo và Cập nhật tài sản (Asset DTO & Initial Status)**:
     - Tạo mới (`POST /assets`): Bắt buộc `assetCode`, `categoryId`, `name`. Các trường kỹ thuật / mua sắm / bảo hành là tùy chọn. Trạng thái khởi tạo của tài sản mới luôn luôn mặc định là `AVAILABLE`. Tuyệt đối không cho phép client tạo trực tiếp tài sản ở trạng thái `ASSIGNED` (việc phân công bắt buộc phải thực hiện qua endpoint phân công độc lập để bảo đảm transaction và lịch sử bàn giao).
     - Cập nhật (`PUT /assets/{assetId}`): Cho phép cập nhật thông tin mô tả, linh kiện, bảo hành, vị trí và trạng thái kho (`AVAILABLE`, `MAINTENANCE`, `BROKEN`, `RETIRED`). Không cho phép đổi `assetCode` và không cho phép thay đổi người nhận tài sản qua endpoint này. Bắt buộc kiểm tra Optimistic Locking bằng `version`.
  4. **Ma trận chuyển đổi trạng thái tài sản (Asset Status Transition Matrix)**:
     - Đúng 5 trạng thái canonical: `AVAILABLE`, `ASSIGNED`, `MAINTENANCE`, `BROKEN`, `RETIRED`.
     - `AVAILABLE -> ASSIGNED`: Chỉ duy nhất qua endpoint cấp phát `POST /assets/{id}/assignments`.
     - `ASSIGNED -> AVAILABLE / MAINTENANCE / BROKEN / RETIRED`: Chỉ duy nhất qua endpoint trả tài sản `PUT /assets/{id}/assignments/{aid}/return`.
     - `AVAILABLE <-> MAINTENANCE`, `AVAILABLE <-> BROKEN`, `BROKEN -> MAINTENANCE`: Thực hiện qua `PUT /assets/{id}` khi tài sản lưu kho và không có phân công hoạt động.
     - `RETIRED`: Trạng thái kết thúc (terminal state). Mọi thao tác chuyển khỏi `RETIRED` đều bị nghiêm cấm (`ASSET_RETIRED`, HTTP 400).
     - Chuyển đổi trạng thái không thuộc ma trận trả về HTTP 400 `ASSET_STATUS_TRANSITION_INVALID`.
  5. **Bất biến phân công và ngữ nghĩa tương tranh (Asset Assignment Concurrency Semantics)**:
     - Mỗi tài sản chỉ có tối đa duy nhất 1 phân công hoạt động (`status = 'ACTIVE'`). Đối tượng nhận là người dùng (`assigned_to`).
     - Giao thức khóa: Khóa hàng `Asset` bằng `PESSIMISTIC_WRITE` (`findByIdForUpdate`) trước khi tạo hoặc đóng phân công.
     - Quy trình chuyển giao: Không hỗ trợ reassign trực tiếp đè lên người khác. Bắt buộc phải thực hiện trả tài sản cũ (`return`), đưa tài sản về trạng thái kho phù hợp, sau đó mới tạo phân công mới.
     - Tuần tự hóa và kiểm tra nghiệp vụ: Hai request đồng thời có thể được tuần tự hóa bởi row lock; request đến sau thấy tài sản đã chuyển khỏi `AVAILABLE` hoặc đã có phân công hoạt động và bị từ chối với HTTP 400 `ASSET_NOT_AVAILABLE` hoặc `ASSET_ALREADY_ASSIGNED`.
     - Hàng rào database cuối cùng: Partial Unique Index `uk_asset_assignments_one_active` trên `asset_assignments(asset_id) WHERE status = 'ACTIVE'` (tạo qua migration `V016`).
     - Bắt lỗi vi phạm SQLState `23505` với constraint `uk_asset_assignments_one_active` và map sang `ASSET_ASSIGNMENT_CONFLICT` (HTTP 409 Conflict).
     - Tuyệt đối không có HTTP 500. Sau mọi tương tranh, cơ sở dữ liệu luôn bảo đảm đúng duy nhất 1 phân công ở trạng thái `ACTIVE`.
     - Không ép buộc kịch bản kiểm thử đồng thời Phase 10 phải luôn trả về đúng 1 success (200) + 1 conflict (409) (kết quả có thể là serialized 200 + 400 hoặc 200 + 409).
  6. **Quản lý lịch sử sửa chữa (Repair History API - Option B: ADMIN_MANAGED)**:
     - Bản ghi lịch sử sửa chữa là **AUDIT RECORD** dùng để ghi nhận sự kiện sửa chữa, bảo dưỡng, kiểm định hoặc nâng cấp thiết bị; không phải workflow điều phối hay state machine quản lý tiến độ.
     - `POST /assets/{assetId}/repair-histories`: Quản trị viên (`ASSET_MANAGE`) ghi nhận lịch sử bảo dưỡng, kiểm định, sửa chữa hoặc nâng cấp thiết bị (chi phí >= 0, `completed_at >= started_at`).
     - `GET /assets/{assetId}/repair-histories`: Xem danh sách lịch sử sửa chữa của tài sản (Admin xem toàn bộ; Non-admin chỉ xem nếu tài sản đang được cấp cho mình).
     - `serviceRequestId` không bắt buộc; dùng để tham chiếu đến yêu cầu dịch vụ liên quan nếu có.
     - `completedAt` không bắt buộc; nếu có phải lớn hơn hoặc bằng `startedAt`.
     - Phase 10 không quản lý lifecycle "đang sửa → hoàn thành" của ticket sửa chữa (hoãn sang phase sau nếu cần).
     - Không tự động tạo bản ghi từ Service Request.
     - Tính bất biến: Bản ghi lịch sử sửa chữa là audit trail, không hỗ trợ sửa (PUT) hoặc xóa (DELETE) trong MVP.
  7. **Chính sách tích hợp Service Request (Service Request Integration Policy)**:
     - Việc tạo Service Request có gắn `assetId` là quan hệ tham chiếu phục vụ báo hỏng thiết bị, không tự ý thay đổi `Asset.status` và không tự động sinh `AssetRepairHistory`.
     - Người tạo yêu cầu thông thường chỉ được phép chọn tài sản đang được cấp phát cho chính mình (`status = 'ACTIVE'`).
     - Quản trị viên có thể chọn bất kỳ tài sản hợp lệ nào trong hệ thống.
     - Khi yêu cầu dịch vụ được xử lý xong, quản trị viên có thể tạo bản ghi trong `AssetRepairHistory` và tham chiếu đến `serviceRequestId` đó.
  8. **Phân quyền đọc và phân vùng dữ liệu cấp CSDL (Asset Read Scoping)**:
     - Quản trị viên (`ADMIN`): Xem toàn bộ tài sản trong hệ thống.
     - Người dùng thông thường (`PROJECT_MANAGER`, `TEAM_LEADER`, `EMPLOYEE`): Có quyền `ASSET_READ` nhưng bị giới hạn nghiêm ngặt ở phạm vi tài sản đang được cấp phát cho bản thân (`assigned_to = currentUserId` và `status = 'ACTIVE'`).
     - Lọc dữ liệu `GET /assets` và `GET /assets/my-assets` thực thi 100% tại câu lệnh SQL JPQL thông qua Spring Data JPA Specification kết hợp `EXISTS (SELECT 1 FROM AssetAssignment aa WHERE aa.assetId = a.id AND aa.assignedTo = :userId AND aa.status = 'ACTIVE')`. Truy vấn đếm (`countQuery`) đồng bộ điều kiện, đảm bảo metadata phân trang chính xác tuyệt đối.
     - Truy cập trái phép tài sản của người khác trên `GET /assets/{assetId}` bị chặn với HTTP 403 Forbidden (`ASSET_ACCESS_DENIED`).
  9. **Kế hoạch di trú CSDL V016 (V016 Migration Plan & Preflight)**:
     - SCHEMA_GAP: DESIGN RESOLVED; IMPLEMENTATION PENDING V016.
     - Không sửa đổi các bản di trú V001–V015 để bảo toàn checksum Flyway.
     - Bản di trú `V016__add_asset_assignment_and_category_invariants.sql` sẽ bổ sung:
       1. Partial Unique Index: `uk_asset_assignments_one_active` trên `asset_assignments(asset_id) WHERE status = 'ACTIVE'`.
       2. Unique Index: `uk_asset_categories_code` trên `asset_categories(code)`.
       3. Query Indexes: `idx_asset_assignments_assigned_to` và `idx_asset_assignments_asset_id`.
     - Bắt buộc thực thi Runbook tiền kiểm `reports/runbooks/V016_ASSET_INVARIANTS_AND_INDEXES_PLAN.md` trước khi deploy. Nếu tiền kiểm phát hiện trùng lặp dữ liệu, lập tức dừng triển khai (NO-GO) và báo cáo Business Owner.
     - Không tạo file migration V016 trong nhiệm vụ chốt thiết kế hiện tại.
  10. **Chuẩn hóa mã lỗi nghiệp vụ tài sản**:
      - `ASSET_ASSIGNMENT_CONFLICT` (HTTP 409): Xung đột tương tranh vi phạm invariant phân công duy nhất tại CSDL.
      - `ASSET_NOT_AVAILABLE` (HTTP 400): Thao tác cấp phát trên tài sản không ở trạng thái AVAILABLE.
      - `ASSET_ALREADY_ASSIGNED` (HTTP 400): Thao tác cấp phát khi tài sản đã có active assignment theo kiểm tra nghiệp vụ.
      - `ASSET_STATUS_TRANSITION_INVALID` (HTTP 400): Chuyển đổi trạng thái tài sản không thuộc ma trận chuyển đổi hợp lệ.
      - `ASSET_ASSIGNMENT_NOT_ACTIVE` (HTTP 400): Thao tác trả tài sản trên phân công đã kết thúc.
      - `ASSET_ACCESS_DENIED` (HTTP 403): Người dùng thông thường truy cập tài sản không được cấp cho mình.
      - `ASSET_REPAIR_HISTORY_NOT_FOUND` (HTTP 404): Không tìm thấy lịch sử sửa chữa.
      - `ASSET_CATEGORY_IN_USE` (HTTP 400): Dừng hoạt động danh mục đang được tham chiếu bởi tài sản chưa xóa mềm.
      - `ASSET_CATEGORY_ALREADY_INACTIVE` (HTTP 400): Thao tác trên loại tài sản đã dừng hoạt động.

## D-047: Chốt hardening giao dịch tài sản, tương tranh, phân quyền và trạng thái phân công (Phase 10 Hardening)

- **Ngày quyết định**: 2026-10-16.
- **Phạm vi**: Backend Module Quản lý Tài sản (Asset Management) - Hardening sau kiểm toán Phase 10.
- **Tình trạng**: APPROVED / IMPLEMENTED.
- **Bối cảnh**: Sau khi hoàn thành triển khai Phase 10, kiểm toán độc lập đã chỉ ra các điểm cần thắt chặt về kiểm thử tương tranh (concurrency assertions), bằng chứng rollback giao dịch hoàn trả tài sản trên PostgreSQL (return rollback failure-injection), tính nhất quán trong phân quyền yêu cầu dịch vụ liên kết (related service requests authorization), trích xuất constraint metadata từ PostgreSQL driver và làm rõ ngữ nghĩa của các trạng thái phân công `LOST` / `DAMAGED`.
- **Nội dung quyết định**:
  1. **Quy chuẩn kiểm thử tương tranh phân công tài sản (Assignment Concurrency Assertions)**:
     - Kịch bản kiểm thử 2 workers đồng thời qua 5 rounds với `CyclicBarrier` trên PostgreSQL Testcontainers.
     - Worker chiến thắng: Bắt buộc nhận HTTP `201 Created`.
     - Worker đối kháng: Chỉ chấp nhận mã lỗi nghiệp vụ chuẩn canonical: HTTP `400` với code `ASSET_NOT_AVAILABLE` hoặc `ASSET_ALREADY_ASSIGNED`, hoặc HTTP `409` với code `ASSET_ASSIGNMENT_CONFLICT`. Tuyệt đối không chấp nhận lỗi generic hoặc 500.
     - Xác minh toàn vẹn CSDL sau mỗi vòng: Trạng thái tài sản chuyển `ASSIGNED`, duy nhất 1 bản ghi `ACTIVE` assignment, người nhận (`assignedTo`) thuộc về một trong hai ứng viên tham gia tương tranh, `assignedBy` đúng quản trị viên.
  2. **Bằng chứng rollback giao dịch hoàn trả (Return Rollback Failure-Injection Evidence)**:
     - Triển khai test failure-injection trên PostgreSQL Testcontainers: Sử dụng trigger `BEFORE UPDATE ON assets` kích hoạt lỗi mô phỏng riêng cho ID tài sản đang hoàn trả, xảy ra sau khi entity `AssetAssignment` đã được lưu/flush nhưng trước khi commit transaction.
     - Khẳng định tính nguyên tử ACID: Toàn bộ giao dịch bị hủy bỏ hoàn toàn; sau khi fail, tài sản vẫn giữ nguyên `status = 'ASSIGNED'`, version không đổi; bản ghi phân công vẫn giữ nguyên `status = 'ACTIVE'`, version không đổi, `returned_at` và `return_condition` vẫn là null.
  3. **Đồng bộ phân quyền yêu cầu dịch vụ liên kết trong chi tiết tài sản (Related Service Request Authorization Consistency)**:
     - Thống nhất phân quyền với Phase 9: Người dùng non-admin khi xem chi tiết tài sản (`GET /api/v1/assets/{id}`) chỉ được xem các yêu cầu dịch vụ liên quan nếu:
       - Bản thân là người tạo (`requester_id = principal.userId`), HOẶC
       - Bản thân là người đang được phân công xử lý hoạt động (`EXISTS (SELECT 1 FROM service_assignments sa WHERE sa.request_id = sr.id AND sa.assignee_id = principal.userId AND sa.is_active = true)`).
     - Quản trị viên (`ADMIN`) xem được toàn bộ yêu cầu dịch vụ chưa xóa mềm liên quan đến tài sản.
     - Các yêu cầu dịch vụ đã bị xóa mềm (`is_deleted = true`) tuyệt đối không được trả về trong projection.
  4. **Trích xuất tên ràng buộc CSDL qua PostgreSQL Driver (PostgreSQL Constraint Extraction)**:
     - Phương thức bắt lỗi `DataIntegrityViolationException` ưu tiên trích xuất tên constraint thực tế từ driver qua `PSQLException.getServerErrorMessage().getConstraint()`.
     - Tránh phụ thuộc hoàn toàn vào chuỗi thông báo lỗi bản địa hóa (localized error message) khi chuyển đổi thành `ASSET_ASSIGNMENT_CONFLICT` (409) hoặc các mã lỗi unique index.
  5. **Quy ước trạng thái phân công dự trữ (Reserved Assignment Status Semantics)**:
     - Các giá trị enum `LOST` và `DAMAGED` trong `AssetAssignmentStatus` là các giá trị dự trữ schema (schema-reserved values) phục vụ luồng xử lý thất thoát tài sản ở các phase sau.
     - Trong Phase 10 MVP, API hoàn trả (`PUT /api/v1/assets/{id}/assignments/{assignmentId}/return`) luôn thiết lập trạng thái phân công là `RETURNED` và nhận trạng thái đích của tài sản qua `resultingAssetStatus` (`AVAILABLE`, `MAINTENANCE`, `BROKEN`, `RETIRED`).
     - Độ lệch giữa mô tả văn bản và request payload được ghi nhận chính thức dưới dạng `ASSET_ASSIGNMENT_STATUS_CONTRACT_GAP` để đồng bộ ở phase nâng cao.
  6. **Định danh danh sách loại tài sản hoạt động (Authenticated Active Categories List)**:
     - Endpoint `GET /api/v1/asset-categories` nằm trong phạm vi bắt buộc xác thực (`.anyRequest().authenticated()`), trả về 401 Unauthorized nếu không có token. Do đó được định danh chuẩn xác là "Authenticated active-category list", không dùng từ "public".

## D-048: Chốt chuẩn hóa hợp đồng phân công tài sản và hoàn tất kiểm toán cuối Phase 10 (Phase 10 Final Contract Alignment & Audit)

- **Ngày quyết định**: 2026-10-16.
- **Phạm vi**: Backend Module Quản lý Tài sản (Asset Management) - Kiểm toán cuối và chốt canonical contract.
- **Tình trạng**: APPROVED / IMPLEMENTED.
- **Bối cảnh**: Sau hardening Phase 10, cần chốt chính thức phạm vi vòng đời phân công tài sản trên tài liệu canonical docs/06_API_CONTRACT.md, đối chiếu mã lỗi trùng số serial, xác minh endpoint thu hồi chuẩn PUT, nullability chi phí sửa chữa, và bảo mật an toàn response khi xảy ra lỗi hạ tầng.
- **Nội dung quyết định**:
  1. **Chuẩn hóa vòng đời phân công tài sản trên Canonical Contract**:
     - Cập nhật mục 14.7 của docs/06_API_CONTRACT.md:
       - Vòng đời phân công được hỗ trợ trong Phase 10: ACTIVE -> RETURNED.
       - Giá trị dự trữ schema, không mở qua API Phase 10: LOST, DAMAGED.
       - Hoãn quy trình xử lý thất thoát/hư hỏng phân công sang phase tiếp theo theo mã: ASSET_ASSIGNMENT_LOST_DAMAGED_WORKFLOW_DEFERRED.
       - Sau canonical patch, nội dung này không còn là contract gap chưa giải quyết mà là tính năng được thiết kế hoãn lại rõ ràng.
  2. **Chuẩn hóa mã lỗi trùng số serial tài sản**:
     - Thống nhất duy nhất mã canonical: ASSET_SERIAL_ALREADY_EXISTS (HTTP 409 Conflict).
     - Không cho phép tồn tại biến thể khác (SERIAL_NUMBER_ALREADY_EXISTS).
  3. **Xác minh chuẩn endpoint thu hồi và an toàn response lỗi**:
     - Endpoint hoàn trả canonical là: PUT /api/v1/assets/{assetId}/assignments/{assignmentId}/return.
     - Failure-injection test gọi đúng phương thức PUT và xác minh an toàn response: Khi gặp lỗi hạ tầng mô phỏng, backend trả về HTTP 500 với payload chuẩn (INTERNAL_ERROR), tuyệt đối không làm lộ SQL, stack trace, tên trigger function, hay chuỗi lỗi nội bộ PostgreSQL.
  4. **Ánh xạ chi phí sửa chữa (Repair Cost Mapping)**:
     - Cột asset_repair_histories.cost là NUMERIC(18,2) NULL (không bắt buộc / nullable).
     - DTO CreateAssetRepairHistoryRequest chỉ ràng buộc @DecimalMin(value = '0.0') mà không bắt buộc @NotNull.
     - Bổ sung test kiểm thử trực tiếp việc tạo lịch sử bảo dưỡng không truyền chi phí (cost = null) thành công.
  5. **Xác minh tên Index V016**:
     - Các chỉ mục thực tế của V016: uk_asset_assignments_one_active, uk_asset_categories_code, idx_asset_assignments_assigned_to, idx_asset_assignments_asset_id.
     - Test V016MigrationTest.testV016IndexesExist kiểm tra chính xác 100% các tên index này trên PostgreSQL pg_indexes.
  6. **Cơ chế trích xuất tên ràng buộc CSDL qua Reflection (Technical Note)**:
     - Ghi nhận `POSTGRES_CONSTRAINT_METADATA_REFLECTION_LOW`: Dependency `org.postgresql:postgresql` nằm ở phạm vi runtime scope trong `pom.xml`. Triển khai sử dụng reflection có kiểm soát để đọc `getServerErrorMessage().getConstraint()` với fallback an toàn về message; không fallback rộng theo tên bảng; không phải blocker.

## D-049: Chốt kiến trúc, ma trận sự kiện Notification, Dashboard Projection và Kế hoạch di trú V017 (Phase 11 Pre-Implementation Policies)

- **Ngày quyết định**: 2026-10-16.
- **Phạm vi**: Backend Module Notification và Reporting/Dashboard (Phase 11) - Khảo sát và chốt chính sách canonical trước triển khai.
- **Tình trạng**: APPROVED / CANONICAL ALIGNED.
- **Bối cảnh**: Kiểm toán sơ bộ Phase 11 phát hiện các khoảng trống: `DASHBOARD_AGGREGATED_API_GAP`, `NOTIFICATION_EVENT_MATRIX_GAP`, `NOTIFICATION_IDEMPOTENCY_GAP`, `NOTIFICATION_RETENTION_POLICY_GAP`, `DASHBOARD_METRIC_SCOPE_GAP`, `DASHBOARD_TIME_POLICY_GAP`. Cần chốt dứt điểm các quyết định kiến trúc trước khi bắt đầu viết code Phase 11.
- **Nội dung quyết định**:
  1. **Mô hình phân phối thông báo (Delivery Model)**:
     - Chốt mô hình: `DATABASE IN-APP NOTIFICATION CENTER ONLY`.
     - Không triển khai Push Notification thực tế (FCM/APNs), Email delivery, WebSocket/SSE hay message broker (Kafka/RabbitMQ) trong MVP.
     - `notification_preferences`: `inAppEnabled` được thực thi trực tiếp khi tạo thông báo; `pushEnabled` và `emailEnabled` được lưu trữ qua API nhưng không tạo delivery side-effect trong Phase 11.
  2. **Mô hình giao dịch (Transaction Model)**:
     - Bản ghi thông báo được tạo trong cùng transaction với sự kiện nghiệp vụ gốc.
     - Nếu ghi thông báo thất bại, toàn bộ transaction nghiệp vụ sẽ rollback để bảo đảm tính toàn vẹn.
     - Không sử dụng AFTER_COMMIT listener khi chưa có outbox/retry.
  3. **Ma trận sự kiện và người nhận (Event & Recipient Matrix)**:
     - Giữ nguyên 8 canonical notification types: `PROJECT_MEMBER_ADDED`, `TASK_ASSIGNED`, `TASK_STATUS_CHANGED`, `TASK_DUE_SOON`, `TASK_OVERDUE`, `SERVICE_REQUEST_UPDATED`, `ASSET_ASSIGNED`, `COMMENT_ADDED`.
     - Áp dụng nguyên tắc loại trừ actor (actor exclusion) khi actor trùng với recipient để tránh tự gửi thông báo cho chính mình.
     - `COMMENT_ADDED` áp dụng cho bình luận công khai trên Task và Service Request; không áp dụng cho ghi chú nội bộ (internal notes) của Service Request.
     - Giải quyết triệt để: `NOTIFICATION_EVENT_MATRIX_GAP`.
  4. **Bất biến lũy đẳng và Kế hoạch di trú V017 (Idempotency & V017 Plan)**:
     - Bổ sung trường `event_key VARCHAR(255) NOT NULL` vào bảng `notifications`.
     - Thiết lập Unique Index: `uk_notifications_recipient_event` trên `notifications(recipient_id, event_key)`.
     - Định dạng eventKey chuẩn hóa theo mẫu: `{EVENT_TYPE}:{entityId}:{context}:{version}`.
     - Ghi nhận trùng `(recipient_id, event_key)` được xử lý là thành công lũy đẳng (idempotent success), không ghi đúp và không ném lỗi nghiệp vụ.
     - Bổ sung composite index `idx_notifications_recipient_created_at` trên `(recipient_id, created_at DESC)` phục vụ phân trang và truy vấn Top-N.
     - Lập runbook tiền kiểm và di trú an toàn `reports/runbooks/V017_NOTIFICATION_IDEMPOTENCY_PLAN.md`.
     - Giải quyết triệt để: `NOTIFICATION_IDEMPOTENCY_GAP` và `SCHEMA_GAP`.
  5. **Chính sách lưu trữ thông báo (Retention Policy)**:
     - Không tự động xóa, không cung cấp endpoint archive, không chạy cleanup scheduler trong Phase 11.
     - Thông báo đã đọc được lưu trữ nguyên vẹn: `NOTIFICATION_RETENTION_CLEANUP_DEFERRED`.
  6. **Phân quyền và bảo mật thông báo**:
     - Người dùng chỉ được truy cập và cập nhật thông báo của chính mình (`recipient_id = principal.userId`).
     - Đánh dấu đã đọc (`PUT /notifications/{id}/read`): Nếu thông báo không tồn tại hoặc thuộc người khác, trả về HTTP 404 `NOTIFICATION_NOT_FOUND` (không dùng 403 để tránh lộ thông tin).
     - Xem chi tiết thông báo được thực hiện bằng điều hướng sâu (deep link) phía mobile; không mở endpoint riêng `GET /notifications/{id}`.
  7. **Tùy chọn thông báo (Notification Preferences)**:
     - `GET /notification-preferences`: Trả về danh sách cấu hình cho đủ 8 canonical types. Nếu chưa có trong DB, trả về mặc định: `inAppEnabled=true`, `pushEnabled=true`, `emailEnabled=false`.
     - `PUT /notification-preferences`: Upsert danh sách; validate type canonical (`NOTIFICATION_TYPE_INVALID`) và chặn trùng type trong payload (`NOTIFICATION_PREFERENCE_DUPLICATE_TYPE`).
  8. **Phạm vi Dashboard cá nhân (Personal Dashboard Scope)**:
     - Endpoint `GET /dashboard/me` luôn là Dashboard cá nhân cho mọi vai trò (kể cả `ADMIN`).
     - Task metrics: Chỉ đếm task đang được phân công trực tiếp cho principal (`assignee_id = principal.userId` và `is_deleted = false`).
     - Service Request metrics: Hợp của `requester_id = principal.userId` hoặc `assigned_to = principal.userId` (không đếm trùng).
     - Project metrics: Chỉ đếm dự án có active membership của principal.
     - Notification metrics: Chỉ đếm thông báo có `recipient_id = principal.userId`.
     - Giải quyết triệt để: `DASHBOARD_METRIC_SCOPE_GAP`.
  9. **Chính sách thời gian Dashboard (Dashboard Time Policy)**:
     - Inject bean `java.time.Clock`, sử dụng `Instant` UTC.
     - `overdue`: `due_date < now` và chưa kết thúc (`status NOT IN ('COMPLETED', 'CANCELLED')`).
     - `dueSoon`: `now <= due_date < now + 72 hours` và chưa kết thúc.
     - `overdue` và `dueSoon` loại trừ lẫn nhau, không đếm trùng.
     - Giải quyết triệt để: `DASHBOARD_TIME_POLICY_GAP`.
  10. **Schema Projection cho Dashboard (Dashboard Projections)**:
      - `upcomingTasks`: Top 5 task sắp đến hạn của principal, sắp xếp `dueDate ASC, id ASC`. Item schema gồm: `id, projectId, projectName, title, status, priority, dueDate`.
      - `recentNotifications`: Top 5 thông báo mới nhất của principal, sắp xếp `createdAt DESC, id DESC`. Item schema gồm: `id, type, title, message, referenceType, referenceId, read, createdAt`.
      - Trả về `[]` khi rỗng.
      - Giải quyết triệt để: `DASHBOARD_AGGREGATED_API_GAP`.
  11. **Hoãn Dashboard dự án (Project Dashboard Deferral)**:
      - `GET /projects/{projectId}/dashboard` được giữ lại dưới dạng placeholder contract: `PROJECT_DASHBOARD_PROJECTION_DEFERRED`.
      - Hoãn triển khai chi tiết sang giai đoạn mở rộng; không tạo stub hay fake payload trong Phase 11; không phải là blocker cho Personal Dashboard.
  12. **Chuẩn hóa mã lỗi mới**:
      - `NOTIFICATION_NOT_FOUND` (HTTP 404)
      - `NOTIFICATION_TYPE_INVALID` (HTTP 400)
      - `NOTIFICATION_PREFERENCE_DUPLICATE_TYPE` (HTTP 400)

## D-050: Làm cứng các quyết định kiến trúc, quy tắc phân vùng CSDL và ma trận sự kiện Notification/Dashboard trước triển khai Phase 11 (Phase 11 Pre-Implementation Hardening)

- **Ngày quyết định**: 2026-10-16.
- **Phạm vi**: Backend Module Notification và Reporting/Dashboard (Phase 11) - Kiểm toán và làm cứng các quyết định kiến trúc trước khi triển khai mã nguồn.
- **Tình trạng**: APPROVED / CANONICAL HARDENED.
- **Bối cảnh**: Sau khi chốt các chính sách sơ bộ tại D-049, đợt kiểm toán làm cứng đối chiếu trực tiếp mã nguồn controller và CSDL thực tế nhằm loại trừ tuyệt đối các giả định sai về endpoint, tên cột, cơ chế xử lý ngoại lệ và điều phối scheduler.
- **Nội dung quyết định**:
  1. **Đồng bộ hóa 100% Endpoint thực tế trong Event Matrix**:
     - Phân công Task: `POST /api/v1/tasks/{taskId}/assignments` (hoặc `POST /api/v1/tasks` khi tạo task kèm assignee). Không dùng `PUT /tasks/{id}/assign`.
     - Phân công Service Request: `POST /api/v1/service-requests/{requestId}/assignments`. Không dùng `PUT /service-requests/{id}/assign`.
     - Bình luận Task: `POST /api/v1/tasks/{taskId}/comments`.
     - Bình luận Service Request: `POST /api/v1/service-requests/{requestId}/comments`.
     - Cập nhật trạng thái Task: `PUT /api/v1/tasks/{taskId}/status`.
     - Cập nhật trạng thái Service Request: `PUT /api/v1/service-requests/{requestId}/status`.
  2. **Chuẩn hóa định dạng eventKey dựa trên bản ghi bất biến (Event Key Stability)**:
     - `TASK_ASSIGNED:{taskId}:{assignmentId}`
     - `TASK_STATUS_CHANGED:{taskId}:{statusHistoryId}` (sử dụng ID bản ghi từ bảng `task_status_histories`)
     - `TASK_DUE_SOON:{taskId}:{dueAtEpochMilli}` (sử dụng epoch milliseconds của `due_date`)
     - `TASK_OVERDUE:{taskId}:{dueAtEpochMilli}` (sử dụng epoch milliseconds của `due_date`)
     - `SERVICE_REQUEST_UPDATED:{requestId}:ASSIGNED:{assignmentId}`
     - `SERVICE_REQUEST_UPDATED:{requestId}:{statusHistoryId}` (sử dụng ID bản ghi từ bảng `service_status_histories`)
     - `ASSET_ASSIGNED:{assetId}:{assignmentId}`
     - `COMMENT_ADDED:{referenceType}:{commentId}`
     - `PROJECT_MEMBER_ADDED:{projectId}:{memberId}`
     - Mọi eventKey đều có độ dài $\le 255$ ký tự.
  3. **Cơ chế chèn CSDL lũy đẳng an toàn (Idempotent Native Insert Semantics)**:
     - Nghiêm cấm dùng việc bắt ngoại lệ vi phạm unique constraint (`PSQLException: 23505`) làm control flow trong transaction nghiệp vụ.
     - Sử dụng native SQL: `INSERT INTO notifications (...) VALUES (...) ON CONFLICT (recipient_id, event_key) DO NOTHING;`.
     - Repository method trả về affected rows: `1` (thành công), `0` (duplicate success - không ném lỗi và không rollback nghiệp vụ gốc).
  4. **Quy tắc khi tùy chọn thông báo bị tắt (Preference-Disabled Semantics)**:
     - Nếu `inAppEnabled = false` tại thời điểm phát sinh sự kiện, không tạo row trong `notifications`. Sự kiện được coi là đã xử lý xong; không giữ hàng đợi pending và không backfill khi bật lại tùy chọn.
  5. **Chính sách điều phối Scheduler định kỳ (Scheduler Policy)**:
     - Quét `TASK_DUE_SOON` và `TASK_OVERDUE`.
     - Cấu hình: scan delay `worksphere.notification.task-deadline-scan-delay` (default: `PT15M`), batch size `worksphere.notification.task-deadline-batch-size` (default: `100`).
     - Sắp xếp ổn định: `ORDER BY t.due_date ASC, t.id ASC`.
     - Điều phối đa instance: Sử dụng PostgreSQL transaction advisory lock với module key riêng biệt `1101` (`SELECT pg_try_advisory_xact_lock(1101, 1)`). Nếu không lấy được khóa, instance bỏ qua vòng quét.
     - Profile kiểm thử: Tắt scheduler tự động; integration test gọi trực tiếp scanner với mock `Clock`.
  6. **Thuật toán xác định người nhận khi đổi trạng thái Task**:
     - Danh sách gồm: Active assignee (`task_assignments.is_active = TRUE`), Task reporter (`tasks.reporter_id`), và các thành viên dự án đang hoạt động (`project_members.is_active = TRUE`) có `project_role IN ('PROJECT_MANAGER', 'TEAM_LEADER')`.
     - Deduplicate tập UUID; loại trừ actor (`principal.userId()`); kiểm tra `inAppEnabled` trước khi chèn thông báo.
  7. **Phân vùng truy vấn Dashboard chuẩn xác theo CSDL thực tế**:
     - Task Scope: `EXISTS (SELECT 1 FROM task_assignments ta WHERE ta.task_id = t.id AND ta.assignee_id = :principalId AND ta.is_active = TRUE)` và `t.is_deleted = false`. Task summary và `upcomingTasks` dùng chung scope này.
     - Service Request Scope: `sr.requester_id = :principalId OR EXISTS (SELECT 1 FROM service_assignments sa WHERE sa.request_id = sr.id AND sa.assignee_id = :principalId AND sa.is_active = TRUE)` và `sr.is_deleted = false`. Sử dụng `COUNT(DISTINCT sr.id)` tránh đếm trùng.
     - Project Scope: `pm.user_id = :principalId AND pm.is_active = TRUE` trên các dự án không soft-deleted. ADMIN tại `/dashboard/me` không bypass membership.
  8. **Quy trình di trú V017**:
     - Được định danh chính xác là: `CONTROLLED DETERMINISTIC DATA BACKFILL`.
     - Sử dụng deterministic legacy key: `LEGACY_MIGRATION:{notificationId}` bảo đảm zero collision.
     - Giữ nguyên toàn bộ 3 index hiện hữu (`idx_notifications_recipient_id`, `idx_notifications_recipient_read`, `idx_notifications_created_at`). Bổ sung `uk_notifications_recipient_event` và `idx_notifications_recipient_created_at`.

## D-051: Làm cứng Deadline Scanner Keyset Pagination, Bằng chứng Transaction Rollback và Event Coverage (Phase 11 Hardening)

- **Ngày quyết định**: 2026-10-17.
- **Phạm vi**: Backend Module Notification và Personal Dashboard (Phase 11) - Hardening sau kiểm toán.
- **Tình trạng**: APPROVED / IMPLEMENTED.
- **Nội dung quyết định**:
  1. **Keyset pagination cho TaskDeadlineScanner**: Triển khai phân trang keyset dựa trên con trỏ `(lastDueDate, lastTaskId)` sắp xếp `dueDate ASC, id ASC` trong cùng phạm vi transaction advisory lock `(1101, 1)`. Loại bỏ triệt để nguy cơ starvation khi số lượng task vượt quá `batchSize` (100).
  2. **Chuẩn hóa boundary due-soon**: Sử dụng so sánh cận trên nghiêm ngặt `dueDate.isBefore(threshold)` cho `now <= dueDate < now + 72 hours`, loại trừ `dueDate == now + 72h`.
  3. **Bằng chứng rollback giao dịch nguồn khi chèn Notification thất bại**: Kiểm thử PostgreSQL failure injection bằng trigger chứng minh tính nguyên tử ACID: khi chèn notification gặp lỗi CSDL, giao dịch thay đổi trạng thái Task hoặc cấp phát Asset được rollback hoàn toàn; không có dữ liệu nghiệp vụ nào bị commit dang dở.
  4. **Xác minh không rollback khi chèn trùng lặp**: Khẳng định `affectedRows = 0` từ `ON CONFLICT DO NOTHING` là thành công lũy đẳng, không gây rollback giao dịch nguồn.
  5. **Bao phủ kiểm thử sự kiện bình luận công khai Service Request**: Kiểm thử đầy đủ các kịch bản actor (requester, assignee, admin), loại trừ actor, ghi chú nội bộ không thông báo, và tắt tùy chọn `inAppEnabled` không backfill.
  6. **Kiểm thử bảo toàn dữ liệu và rollback di trú V017**: Xác minh tính nguyên tử transactional DDL/DML của V017 trên PostgreSQL Testcontainers; preflight failure rollback bảo toàn trọn vẹn dữ liệu và cấu trúc trước V017.
  7. **Hardening Test Cleanup Listener**: Kiểm tra sự tồn tại của bảng `notifications` và `notification_preferences` qua `to_regclass` trên PostgreSQL hoặc metadata JDBC trên non-Postgres; chỉ xóa đúng 2 bảng này; không làm thay đổi vòng đời của các test slice khác.

## D-052: Đóng Memory Checkpoint Hoàn Thành Phase 11 - Notification và Personal Dashboard

- **Ngày quyết định**: 2026-10-17.
- **Phạm vi**: Toàn bộ hệ thống Backend WorkSphere, Migration V017, Notification Center và Personal Dashboard API (Phase 11).
- **Tình trạng**: APPROVED / CLOSED.
- **Nội dung quyết định**:
  1. **Trạng thái Phase 11**: Khẳng định Phase 11 đạt trạng thái `COMPLETED, AUDITED, HARDENED, IDEMPOTENCY, AUTHORIZATION, SCHEDULER CONCURRENCY AND TRANSACTION ROLLBACK VALIDATED`.
  2. **Hạ tầng Di trú V017**: Di trú `V017__add_notification_idempotency_and_query_indexes.sql` là controlled deterministic data backfill (`LEGACY_MIGRATION:{notificationId}`). Thêm cột `event_key NOT NULL`, unique index `uk_notifications_recipient_event (recipient_id, event_key)`, composite index `idx_notifications_recipient_created_at (recipient_id, created_at DESC)`. Giữ nguyên 3 index hiện hữu và 100% dữ liệu legacy. Đã chứng minh tính toàn vẹn và ngữ nghĩa transactional DDL/DML rollback trên PostgreSQL Testcontainers.
  3. **Mô hình Phân phối Thông báo**: Xác định chính thức là `DATABASE IN-APP NOTIFICATION CENTER ONLY`. Không có Push (FCM/APNs), Email delivery, WebSocket/SSE, Message Broker (Kafka/RabbitMQ) hay Redis. Tùy chọn `inAppEnabled` được thực thi nghiêm ngặt; `pushEnabled`/`emailEnabled` chỉ lưu trữ cấu hình người dùng, không tạo side-effect bên ngoài. Tắt inApp bỏ qua việc chèn thông báo an toàn, không tạo pending event, không backfill sau đó.
  4. **Tính Lũy Đẳng và An Toàn Giao Dịch Nguồn**: Sử dụng native insert `ON CONFLICT (recipient_id, event_key) DO NOTHING`. Khi trùng lặp (`affectedRows = 0`), phương thức trả về thành công lũy đẳng, không ném exception và không đánh dấu giao dịch nguồn bị rollback-only. Giao dịch nghiệp vụ nguồn vẫn commit thành công. Lỗi CSDL thực sự khác vẫn rollback giao dịch nguồn. Đã chứng minh tính nguyên tử ACID bằng failure injection trên Task status change và Asset assignment.
  5. **Bộ Lập Lịch Quét Hạn Task (TaskDeadlineScanner)**: Sử dụng PostgreSQL transaction advisory lock `(1101, 1)` với cơ chế skip an toàn khi tranh chấp khóa. Bao trùm toàn bộ chu kỳ quét trong một `@Transactional` duy nhất. Áp dụng phân trang keyset `(lastDueDate, lastTaskId)` sắp xếp `dueDate ASC, id ASC`, loại trừ triệt để nguy cơ starvation khi vượt quá `batchSize` (100). Chuẩn hóa ranh giới nghiêm ngặt: `now <= dueDate < now + 72 hours` với `dueDate.isBefore(threshold)` cho `TASK_DUE_SOON` và `dueDate < now` cho `TASK_OVERDUE`.
  6. **Personal Dashboard API**: Endpoint duy nhất `GET /api/v1/dashboard/me` phục vụ cho mọi vai trò (kể cả ADMIN vẫn tuân thủ phạm vi cá nhân). Tổng hợp Task, Service Request (`COUNT(DISTINCT sr.id)`), Project membership, top 5 upcoming tasks (`dueSoon`) và top 5 recent notifications. Dùng chung một mốc thời gian `Clock.instant()` duy nhất trong mỗi request. Không triển khai endpoint hay stub cho Project Dashboard.
  7. **Hạ Tầng Kiểm Thử & Kiểm Định**: Toàn bộ 298/298 test hệ thống PASS (BUILD SUCCESS). Targeted Phase 11 suite đạt 38/38 PASS qua 2 lần chạy liên tiếp không flakiness. Checkstyle đạt 0 violations. Listener `NotificationTestCleanupListener` kiểm tra sự tồn tại của bảng trước khi xóa và chỉ xóa `notifications`, `notification_preferences`.
  8. **Giai đoạn Tiếp theo trong Roadmap**: Chuyển giao sang `Giai đoạn 12: Khởi tạo ứng dụng mobile` (docs/08_DEVELOPMENT_ROADMAP.md Mục 16, P0, React Native và TypeScript). Không tự ý triển khai Phase 12 nếu task chưa yêu cầu.

## D-053: Đóng Memory Checkpoint Hoàn Thành Phase 12 - Mobile Foundation

- **Ngày quyết định**: 2026-10-18.
- **Phạm vi**: Ứng dụng di động WorkSphere (`mobile/`), Toolchain React Native, Theme, Điều hướng, 10 Shared Components, Nền tảng Mạng & Lưu trữ dữ liệu (Phase 12).
- **Tình trạng**: APPROVED / CLOSED.
- **Nội dung quyết định**:
  1. **Trạng thái Phase 12**: Khẳng định Phase 12 đạt trạng thái chính thức `COMPLETED, AUDITED, HARDENED, RECONCILED AND VALIDATED`.
  2. **Đường cơ sở Toolchain & Scaffold**: React Native 0.88.0, React 19.3.0, TypeScript 6.0.3, Node.js 24.19.0 (ghim tại `mobile/.node-version`), npm 11.17.0 (chính sách `allow-scripts=opencode-ai`), Gradle 9.4.1, JBR 25 (Java 25.0.3-b152), compileSdk 37, targetSdk 36, minSdk 24, buildTools 37.0.0, NDK 27.1.12297006. New Architecture bật (`newArchEnabled=true`), Hermes JS engine bật (`hermesEnabled=true`), Edge-to-Edge bật. Quản lý phụ thuộc độc quyền bằng npm với `package-lock.json` v3 (không dùng Yarn/pnpm/Expo).
  3. **Kiến trúc Mã nguồn Di động**: Cấu trúc feature-based phân lớp rõ ràng (`src/app/`, `src/features/`, `src/shared/`, `src/assets/`). Quy tắc ranh giới nghiêm ngặt: `src/shared` độc lập 100% với `features` (0 import ngược); `App.tsx` mỏng (9 dòng, ủy quyền vào `AppRoot`); barrel files không rò rỉ mã kiểm thử; các tiện ích test đặt tại `__tests__/test-utils/` ngoài `src/`; không tạo thư mục utils dùng chung bừa bãi; không trùng lặp các lớp trừu tượng theme, navigation, api hay storage.
  4. **Hệ thống Theme & Điều hướng (Navigation)**:
     - Theme tokens chuẩn hóa toàn diện (colors, spacing scale, typography scale, radii, elevation shadows), ThemeProvider và hook `useAppTheme`. Ngưỡng chạm tối thiểu 48dp (`minTouchTarget`) được bảo vệ nghiêm ngặt. Phông chữ Inter asset chính thức được hoãn (`FONT_INTER_ASSET_BUNDLING_DEFERRED`), thuộc tính `fontFamily` được omit để React Native tự động sử dụng system font mặc định của hệ điều hành.
     - Điều hướng typed phân tầng: RootNavigator điều phối theo trạng thái phiên (`INITIALIZING`, `UNAUTHENTICATED`, `AUTHENTICATED`); AuthNavigator gồm 3 màn hình khung (Login `SCR-AUTH-02`, Forgot Password `SCR-AUTH-03`, Reset Password `SCR-AUTH-04`); MainTabNavigator gồm 5 tab chuẩn xác (Dashboard `SCR-MAIN-01`, Projects `SCR-PRJ-01`, Tasks `SCR-TSK-01`, Service Requests `SCR-SRV-01`, More `SCR-MAIN-03`). Ranh giới Auth được giữ nguyên: chưa có logic xác thực thật, không gọi API, không giả lập user/session token.
  5. **10 Shared Components Chuẩn Hóa**:
     - `AppButton`: Variants `'primary' | 'secondary' | 'outline' | 'danger' | 'text'`; touch target minHeight 48dp bắt buộc, không bị override giảm xuống; accessibility đầy đủ.
     - `AppTextInput`: Form control chuẩn với label, helper text, error text và trạng thái disabled.
     - `PasswordInput`: Dựa trên AppTextInput kèm nút bật/tắt hiển thị mật khẩu và touch target riêng.
     - `LoadingIndicator`: Hiển thị tiến trình dạng inline và fullscreen với vai trò progressbar.
     - `EmptyState`: Trạng thái rỗng với tiêu đề, mô tả và nút hành động tùy chọn.
     - `ErrorState`: Trạng thái lỗi chuẩn hóa với tiêu đề, mô tả, nút thử lại và nhãn trace ID chuẩn xác `Mã tham chiếu: ${traceId}`.
     - `StatusBadge`: Ánh xạ trực quan trạng thái liên miền, không phải DTO enum backend.
     - `PriorityBadge`: Đúng 4 mức độ ưu tiên chuẩn hóa: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` (không có URGENT).
     - `ConfirmationDialog`: Tên xuất bản duy nhất `ConfirmationDialog` (không export alias `ConfirmDialog`), vai trò alert, modal scrim mờ.
     - `SearchBar`: Ô tìm kiếm với biểu tượng 🔍 được ẩn khỏi cây accessibility (`accessibilityElementsHidden`, `importantForAccessibility="no"`). Nền tảng accessibility tuân thủ các thuộc tính gốc React Native.
  6. **Hợp đồng Dữ liệu API (Envelope & Pagination)**:
     - Hợp đồng `ApiResponse<T>` phẳng, khớp 100% `ApiResponse.java` backend: `success` (boolean), `data` (T | null), `code` (string | null), `message` (string | null), `fieldErrors` (Record<string, string> | null), `timestamp` (string), `traceId` (string | null). Không có cấu trúc lồng `error`.
     - Hợp đồng `PagedData<T>` khớp 100% `PagedData.java` backend: `items` (T[]), `page` (number), `size` (number), `totalItems` (number), `totalPages` (number), `hasNext` (boolean), `hasPrevious` (boolean). Trường đếm tổng số phần tử là `totalItems` (không dùng `totalElements`).
  7. **An Ninh Mạng & Phân Tầng Lưu Trữ (Network & Storage)**:
     - Axios client với giải quyết URL động theo request (mặc định môi trường dev `http://10.0.2.2:8080/api/v1`), timeout 15.000 ms, Bearer request interceptor lấy token từ bộ nhớ, không gửi header khi thiếu token. 401 callback hook cho Phase 13, không tự retry/refresh/navigate từ tầng shared API. Lỗi được chuẩn hóa an toàn qua `normalizeApiError`, che giấu toàn bộ chi tiết nhạy cảm (SQL, stack trace, kết nối mạng thô).
     - Lưu lượng Cleartext HTTP: Chỉ kích hoạt trong bản build Debug cho đúng 3 host `10.0.2.2`, `localhost`, `127.0.0.1` qua `network_security_config.xml`. Bản build Release cấm hoàn toàn cleartext (`usesCleartextTraffic=false`).
     - Access Token: Lưu trữ độc quyền trong bộ nhớ RAM (`AccessTokenStore`), không ghi đĩa, không ghi Keychain, không giải mã JWT, không ghi log.
     - Refresh Token: Lưu trữ độc quyền bằng `react-native-keychain` với service `worksphere.auth.refresh_token` và account `refresh_token_account`.
     - LocalStorage: Sử dụng `@react-native-async-storage/async-storage` với danh sách khóa cho phép nghiêm ngặt (`@worksphere/theme_preference`, `@worksphere/onboarding_completed`). Loại trừ triệt để blacklist chuỗi con; khóa ngoài allowlist lập tức ném lỗi tại runtime; thao tác đọc JSON bắt buộc có parser callback xác thực. Nghiêm cấm lưu token, mật khẩu hay thông tin phiên trong AsyncStorage.
  8. **Bằng Chứng Kiểm Thử, Biên Dịch và Vận Hành**:
     - Unit tests: 20/20 test suites, 106/106 tests PASS (0 failures, 0 skipped, 0 snapshots). Lint đạt 0 errors, 0 warnings. Typecheck đạt 0 errors.
     - Tái lập sạch: `npm ci` PASS với lockfile nguyên vẹn và cờ `allow-scripts=opencode-ai`.
     - Biên dịch Android sạch: `.\gradlew.bat clean; .\gradlew.bat assembleDebug --no-daemon` hoàn tất với `BUILD SUCCESSFUL in 5m 6s` (203 actionable tasks: 174 executed, 29 up-to-date). Các native modules (:react-native-keychain, :react-native-async-storage, :react-native-screens, :react-native-safe-area-context, :app) biên dịch và liên kết thành công. APK phát sinh `app-debug.apk` (157,662,829 bytes, SHA256 `B496062B...`) và được Git bỏ qua an toàn.
     - Khảo sát thực tế giả lập (Emulator Smoke): Cài đặt APK và chạy thành công trên `emulator-5554` (Android 15, API 35). Metro bundler kết nối và biên dịch gói JS thành công; ứng dụng hiển thị màn hình Login shell (`SCR-AUTH-02`); điều hướng tương tác sang Forgot Password (`SCR-AUTH-03`) và quay về Login thành công; không xảy ra fatal crash hay redbox; daemon Metro dừng sạch và giải phóng cổng 8081.
     - CI: Cấu hình `mobile-ci` trong `.github/workflows/ci.yml` được thẩm định chính xác; phiên chạy từ xa (Remote CI) ghi nhận trạng thái `NOT VERIFIED` do môi trường hiện tại không có GitHub CLI.
  9. **Danh Mục Hạng Mục Hoãn (Deferred Items)**:
     - `PRODUCTION_ENVIRONMENT_WIRING_DEFERRED` (Cấu hình môi trường đa bản phát hành hoãn đến Phase 15).
     - `KEYCHAIN_NATIVE_OPERATION_SMOKE_DEFERRED` (Kiểm thử CRUD phần cứng Keychain thực tế trên thiết bị hoãn đến luồng Auth Phase 13).
     - `ASYNC_STORAGE_NATIVE_OPERATION_SMOKE_DEFERRED` (Kiểm thử CRUD ghi đĩa AsyncStorage thực tế trên thiết bị hoãn đến luồng Auth Phase 13).
     - `AXIOS_MULTIPART_CONTENT_TYPE_OVERRIDE_REQUIRED` (Ghi đè thủ công header Content-Type khi upload tệp nhị phân hoãn đến Phase 14+).
     - `FONT_INTER_ASSET_BUNDLING_DEFERRED` (Tích hợp tệp font chữ Inter hoãn đến đợt trau chuốt UI).
     - `MOBILE_ICON_PACKAGE_DEFERRED` (Tích hợp thư viện vector icon hoãn đến Phase 13/14).
     - `FORM_AND_VALIDATION_LIBRARIES_DEFERRED` (Thư viện form và validation React Hook Form/Zod hoãn đến biểu mẫu thật Phase 13).
     - `IOS_BUILD_ON_MACOS_DEFERRED` (Biên dịch iOS hoãn đến khi có máy chủ macOS).
     - `ANDROID_NATIVE_CI_BUILD_DEFERRED` (Biên dịch Android native trên GitHub Actions runner hoãn lại).
     - `PHASE_13_AUTH_FLOWS_DEFERRED` (Toàn bộ luồng đăng nhập, refresh token, phục hồi phiên và đăng xuất thuộc quyền sở hữu của Phase 13).
  10. **Chuyển Giao Roadmap Tiếp Theo**: Đóng hoàn tất Phase 12. Giai đoạn tiếp theo được phép triển khai là `Giai đoạn 13: Mobile Authentication` (`docs/08_DEVELOPMENT_ROADMAP.md` Mục 17, P0). Nghiêm cấm bắt đầu Phase 13 trong nhiệm vụ đóng checkpoint này.

## D-054: Pre-Phase 13 Runtime Readiness - Production Environment Wiring và Native Storage Smoke

- **Ngày quyết định**: 2026-10-18.
- **Phạm vi**: Ứng dụng di động WorkSphere (`mobile/`), Cấu hình API Base URL native & JS, Kiểm chứng CRUD phần cứng Keystore/Keychain và ổ đĩa AsyncStorage trên thiết bị giả lập trước Phase 13.
- **Tình trạng**: APPROVED / RESOLVED.
- **Nội dung quyết định**:
  1. **Cơ chế Cấu hình Môi trường API Base URL (Environment Wiring)**:
     - Lựa chọn giải pháp Native Module Bridge tối giản (`EnvironmentConfigModule`) kết hợp Android Gradle `BuildConfig` và iOS `Info.plist` (`WORKSPHERE_API_BASE_URL`).
     - Tránh phát sinh trôi dạt mã nguồn (không sinh file code tạm thời trong build task); giữ khả năng tương thích tuyệt đối với Jest và Metro.
     - Kiểm soát chặt chẽ cấu hình phát hành (Release Build): Gradle bắt buộc thuộc tính `-PWORKSPHERE_API_BASE_URL=https://<domain>/api/v1` khi thực hiện các tác vụ release. Nếu thiếu hoặc sử dụng HTTP cleartext, quá trình cấu hình Gradle lập tức dừng lại với thông báo lỗi rõ ràng và an toàn (`GradleException`).
     - Bản build Debug: Mặc định an toàn vào URL giả lập chuẩn `http://10.0.2.2:8080/api/v1` khi thuộc tính không được truyền; cho phép ghi đè URL cục bộ qua Gradle property cho thiết bị thật khi cần.
     - Chuẩn hóa URL: Loại bỏ triệt để dấu gạch chéo dư thừa trong path; đảm bảo kết thúc đúng một hậu tố duy nhất `/api/v1`.
     - Bảo vệ không hạ cấp (Downgrade Protection): TypeScript chặn hoàn toàn hành vi hạ cấp môi trường từ production sang non-production tại runtime qua `setEnvironmentConfig`.
  2. **Kiểm chứng CRUD Native Storage trên Giả lập Thực tế (Emulator Smoke)**:
     - Đã chứng minh thực tế trên Android Emulator (`emulator-5554`, Android 15, API 35) qua chu trình CRUD hoàn chỉnh:
       - **Keychain (`react-native-keychain`)**: `clear -> initial null -> set synthetic token -> get & compare equality in memory -> clear -> post-clear null`. Toàn bộ token giả lập được xóa sạch trong khối `finally`; tuyệt đối không in giá trị token ra log, màn hình, hay lưu vào báo cáo.
       - **AsyncStorage (`@react-native-async-storage/async-storage`)**: `remove -> initial null -> set 'system' -> get & compare equality -> remove -> post-remove null` trên khóa allowlisted `@worksphere/theme_preference`. Toàn bộ dữ liệu được dọn dẹp sạch sẽ trong khối `finally`.
  3. **Dọn dẹp Khung Kiểm Thử Tạm Thời (Harness Cleanup)**:
     - Khung kiểm thử tạm thời trong `App.tsx` đã được hoàn nguyên 100% về mã nguồn gốc; không tạo màn hình ẩn hay dev menu trong mã nguồn phát hành.
     - Xác nhận `git grep` không còn bất kỳ chuỗi token giả lập nào (`worksphere-phase13-smoke-refresh-token`) trong mã nguồn mobile.
  4. **Giải Quyết Hạng Mục Hoãn (Resolved Deferred Items)**:
     - Chuyển 3 hạng mục hoãn sang trạng thái RESOLVED:
       - `PRODUCTION_ENVIRONMENT_WIRING_RESOLVED`
       - `KEYCHAIN_NATIVE_OPERATION_SMOKE_RESOLVED`
       - `ASYNC_STORAGE_NATIVE_OPERATION_SMOKE_RESOLVED`
  5. **Chuyển giao cho Phase 13**:
     - Hoàn tất mọi điều kiện tiên quyết về runtime và lưu trữ native cho Phase 13 Mobile Authentication.
     - Bước tiếp theo: Thực hiện kiểm toán hợp đồng và chuẩn bị triển khai Phase 13 Authentication. Không bắt đầu code Phase 13 trong nhiệm vụ này.

## D-055: iOS Environment Bridge Target Membership và Chính Sách Tài Khoản Kiểm Thử An Toàn

- **Ngày quyết định**: 2026-10-18.
- **Phạm vi**: Ứng dụng di động WorkSphere (`mobile/ios/`, `mobile/`), Xcode project cấu hình native bridge, Quy chuẩn bảo mật thông tin xác thực tài khoản kiểm thử cho Phase 13 Mobile Authentication.
- **Tình trạng**: APPROVED / RESOLVED.
- **Nội dung quyết định**:
  1. **Đăng ký Target Membership cho iOS Environment Bridge (`EnvironmentConfigModule`)**:
     - Bổ sung đầy đủ định danh Xcode 24 ký tự hex duy nhất trong `mobile/ios/WorkSphereMobile.xcodeproj/project.pbxproj`:
       - `PBXBuildFile`: `761780F22CA45674006654F2` (`EnvironmentConfigModule.m in Sources`).
       - `PBXFileReference`: `761780F02CA45674006654F0` (`EnvironmentConfigModule.h`, type `sourcecode.c.h`) và `761780F12CA45674006654F1` (`EnvironmentConfigModule.m`, type `sourcecode.c.objc`).
       - `PBXGroup`: Thêm cả 2 tệp vào nhóm `WorkSphereMobile`.
       - `PBXSourcesBuildPhase`: Thêm `EnvironmentConfigModule.m in Sources` đúng 1 lần duy nhất; loại trừ tệp header `.h` khỏi Compile Sources.
     - Khắc phục triệt để `IOS_ENVIRONMENT_BRIDGE_TARGET_GAP`.
  2. **Duy trì Hoãn Biên Dịch iOS trên macOS**:
     - Tiếp tục duy trì `IOS_BUILD_ON_MACOS_DEFERRED`. Không xác nhận PASS biên dịch native iOS trên hệ điều hành Windows host.
  3. **Chính Sách Tài Khoản Kiểm Thử An Toàn (Safe Test-Account Policy)**:
     - Chuẩn hóa giao ước định danh biến môi trường bên ngoài Git:
       - `WORKSPHERE_E2E_LOGIN`: Tên người dùng hoặc email tài khoản kiểm thử local.
       - `WORKSPHERE_E2E_PASSWORD`: Mật khẩu tài khoản kiểm thử local.
       - `WORKSPHERE_E2E_BASE_URL` (tùy chọn): Địa chỉ backend override cho thiết bị thật hoặc host khác.
     - Giá trị của các biến môi trường bắt buộc nằm ngoài Git; nghiêm cấm ghi vào repository, file `.env` commit, logcat, terminal echo, báo cáo hay ảnh chụp màn hình.
     - Tuyệt đối không hardcode mật khẩu mặc định hoặc mật khẩu ví dụ vào mã nguồn mobile hoặc backend.
     - Sử dụng tài khoản kiểm thử cục bộ chuyên dụng với quyền hạn tối thiểu (least privilege).
     - Kiểm thử E2E trên emulator bắt buộc xử lý an toàn (safe skip hoặc prompt), không gây crash khi thiếu biến môi trường.
     - Môi trường CI (nếu tích hợp sau này) bắt buộc nạp bí mật qua GitHub Actions Secrets.
  4. **Quyết Định Khởi Tạo Dữ Liệu Kiểm Thử (`AUTH_TEST_ACCOUNT_PROVISIONING_REQUIRED`)**:
     - Xác nhận hiện trạng: Không có tài khoản người dùng nào được seed sẵn trong CSDL dev `worksphere-dev-pg` hay các Flyway migrations V001..V017.
     - Ghi nhận yêu cầu vận hành: Kiểm thử E2E đăng nhập thật trên backend live bị chặn cho đến khi cơ chế khởi tạo tài khoản dev an toàn được kích hoạt (chỉ áp dụng profile dev/local, tắt trên production, mật khẩu inject từ biến môi trường, không in log mật khẩu).
  5. **Ranh Giới Thực Thi Phase 13**:
     - Khẳng định Phase 13 Mobile Authentication chưa bắt đầu triển khai code (chưa triển khai Login, Refresh, Session Restore, Logout hay Profile).

## D-056: Cơ Chế Khởi Tạo Tài Khoản Kiểm Thử E2E Dev-Only An Toàn (E2eUserProvisioner)

- **Ngày quyết định**: 2026-10-18.
- **Phạm vi**: Backend `backend/src/main/java/com/worksphere/identity/dev/E2eUserProvisioner.java`, `backend/src/main/resources/application-dev.yml`, Quy chuẩn khởi tạo tài khoản dev/local phục vụ kiểm thử E2E Phase 13 Mobile Authentication.
- **Tình trạng**: APPROVED / IMPLEMENTED.
- **Nội dung quyết định**:
  1. **Phương Án Khởi Tạo (Provisioning Approach)**:
     - Lựa chọn Phương án B: Dev-only Spring Boot runner (`E2eUserProvisioner` implements `CommandLineRunner`).
     - Runner chạy trên profile `dev` (`@Profile("dev")`) và yêu cầu cờ tường minh `worksphere.dev.e2e-user.enabled=true` (`@ConditionalOnProperty`). Mặc định là `false` (disabled) và không kích hoạt khi thiếu thuộc tính.
     - Trên môi trường production (`prod` profile) hoặc khi không bật cờ, bean hoàn toàn không được khởi tạo, không truy cập CSDL và không tạo tài khoản.
  2. **Tiêm Thông Tin Xác Thực Ngoại Vi (External Credential Injection)**:
     - Tuân thủ nghiêm ngặt D-055: Thông tin xác thực được nạp qua biến môi trường hoặc thuộc tính cấu hình ngoài Git:
       - `WORKSPHERE_DEV_E2E_USER_ENABLED`: Bật cờ provisioning (`true`).
       - `WORKSPHERE_E2E_LOGIN`: Tên người dùng hoặc email nhận diện (tự động phân giải nếu là email).
       - `WORKSPHERE_E2E_USERNAME` / `WORKSPHERE_E2E_EMAIL`: Khai báo chi tiết nếu cần phân tách.
       - `WORKSPHERE_E2E_PASSWORD`: Mật khẩu tài khoản kiểm thử local.
       - `WORKSPHERE_E2E_FULL_NAME`: Họ và tên hiển thị (mặc định "E2E Test User").
     - Tuyệt đối không hardcode mật khẩu mặc định hoặc fallback trong source hay configuration.
     - Kiểm tra an toàn: Ném ngoại lệ và dừng khởi tạo an toàn nếu cờ bật nhưng thiếu login hoặc password; thông điệp ngoại lệ tuyệt đối không chứa giá trị credential.
  3. **Quyền Hạn Tối Thiểu (Least Privilege) & Trạng Thái Tài Khoản**:
     - Tài khoản được gán vai trò tối thiểu `EMPLOYEE` (không cấp `ADMIN`, `PROJECT_MANAGER` hay `HR_ADMIN`).
     - Tài khoản được khởi tạo trực tiếp ở trạng thái `ACTIVE` nhằm khắc phục `TEMPORARY_PASSWORD_FLOW_GAP` (vốn chặn đăng nhập người dùng `PENDING` khi chưa có giao diện đổi mật khẩu lần đầu).
     - Mật khẩu được băm an toàn thông qua bean `PasswordEncoder` chuẩn của WorkSphere (BCrypt).
  4. **Tính Lũy Đẳng (Idempotency) & Bảo Vệ Xung Đột (Collision Protection)**:
     - Runner kiểm tra sự tồn tại của tài khoản qua username hoặc email trước khi tạo.
     - Nếu tài khoản chuyên dụng đã tồn tại (khớp cả username và email): Ghi nhận đã tồn tại và bỏ qua an toàn (skip), không tạo bản ghi trùng lặp, không cập nhật lại password hay role ngoài ý muốn.
     - Nếu phát hiện xung đột không khớp (ví dụ: trùng email nhưng khác username, hoặc ngược lại): Báo lỗi xung đột `COLLISION` an toàn và dừng thực hiện để bảo vệ dữ liệu người dùng khác.
  5. **Ghi Log An Toàn (Safe Generic Logging)**:
     - Nhật ký chỉ ghi nhận các thông điệp chung: `E2E user provisioning is disabled`, `E2E user account already exists. Skipping provisioning.`, `E2E user account provisioned successfully.`.
     - Tuyệt đối không in giá trị login, email, password, password_hash, token hay đối tượng cấu hình ra console/log.
  6. **Giải Quyết Finding**:
     - Khắc phục và đóng `AUTH_TEST_ACCOUNT_PROVISIONING_REQUIRED`.

## D-057: Quy Định Toàn Dự Án Về Tái Sử Dụng Tài Nguyên Bên Ngoài, Khu Vực Cách Ly (.external/), Kiểm Thẩm An Ninh Và Quyền Hạn Thường Trực Của Agent

- **Ngày quyết định**: 2026-10-18.
- **Phạm vi**: Toàn bộ dự án WorkSphere, mọi Agent trong mọi phiên hội thoại, quy trình quản trị mã nguồn bên ngoài, kỹ năng (skills), bản mẫu (templates), thư viện (packages), công cụ (tools), ứng dụng và tiện ích mở rộng IDE (extensions).
- **Tình trạng**: APPROVED / ENFORCED.
- **Nội dung quyết định**:
  1. **Quyền Hạn Thường Trực Của Agent (Standing Agent Authority)**:
     - Mọi Agent trong mọi phiên làm việc được chủ động và kỳ vọng tìm kiếm giải pháp đã tồn tại trước khi tự viết mới từ đầu.
     - Agent có quyền tự chủ duyệt web, tra cứu tài liệu chính thức, clone/tải tài nguyên ứng viên vào khu cách ly cục bộ `D:\WorkSphere\.external\quarantine\`, kiểm tra mã nguồn, giấy phép, quét an ninh và ghi nhận hồ sơ mà không cần hỏi xin phép riêng cho từng lần tìm kiếm/tải về.
     - Quyền hạn thường trực CHỈ áp dụng cho việc tìm kiếm, tải cách ly, và thẩm định tĩnh; TUYỆT ĐỐI KHÔNG cấp quyền chạy vô điều kiện cho mã chưa qua kiểm duyệt.
  2. **Khu Vực Cách Ly Cục Bộ (`D:\WorkSphere\.external\`)**:
     - Thiết lập cấu trúc phân vùng cô lập chuẩn: `quarantine/`, `repos/`, `skills/`, `templates/`, `packages/`, `tools/`, `extensions/`, `downloads/`, `cache/`, `scans/`, `manifests/`.
     - Cấu hình `.gitignore` loại trừ `.external/*` (ngoại trừ `.external/README.md`) để đảm bảo không bao giờ commit mã nguồn, artifact, hay binary bên thứ ba vào Git repository WorkSphere.
  3. **Yêu Cầu Sổ Đăng Ký Theo Dõi (Tracked Registries)**:
     - Mọi tài nguyên bên ngoài được tham khảo, chạy thử, hoặc tái sử dụng bắt buộc phải được đăng ký đầy đủ tại `reports/EXTERNAL_RESOURCE_REGISTRY.md` hoặc `reports/TOOL_EXTENSION_REGISTRY.md`.
     - Bắt buộc ghim định danh bất biến: commit SHA 40 ký tự hoặc version digest bất biến; cấm dùng floating branch làm căn cứ provenance duy nhất.
     - Nghiêm cấm ghi nhận access token, mật khẩu hoặc URL chứa bí mật vào sổ theo dõi.
  4. **Phân Cấp Tin Cậy Nguồn (Trust Tiers) & Cổng Bản Quyền (License Gates)**:
     - Phân tầng nghiêm ngặt: Tier 1 (Official Vendor), Tier 2 (Reputable Foundation/Enterprise), Tier 3 (Community with Review), Tier 4 (Blocked/Unlicensed). Lượt stars trên GitHub không phải là bằng chứng an ninh.
     - Áp dụng chuẩn SPDX: Cho phép nhóm Permissible (`MIT`, `Apache-2.0`, `BSD-2/3`, `ISC`); thẩm định nhóm Review Required (`MPL-2.0`, `LGPL`, `EPL`, `CDDL`); chặn nhóm Blocked (No-license, Proprietary, Strong Copyleft `GPL-3.0`/`AGPL-3.0` tích hợp vào sản phẩm phân phối).
  5. **Cổng Kiểm Soát An Ninh (Security Gates) & Thẩm Định Chuyên Biệt**:
     - Áp dụng các pipeline kiểm duyệt chuyên biệt cho Kho mã (Repository), Kỹ năng (Skill - phòng chống Prompt Injection), Gói thư viện (Package - phòng chống Typosquatting), Công cụ (Tool - xác minh Authenticode và SHA-256), và Tiện ích IDE (Extension).
     - Lập tức từ chối và cách ly tài nguyên nếu phát hiện: truy cập credential ngoài dự kiến, đọc SSH/browser profile, upload mã nguồn dự án, tắt kiểm tra TLS, sửa đổi Git remotes, obfuscated PowerShell/Bash, hoặc payload thứ cấp.
  6. **Nguyên Tắc Tái Sử Dụng Mã Nguồn (Code Reuse Principles)**:
     - Ưu tiên khai báo dependency chính thức hơn là sao chép mã nguồn thô (Dependency over Copying).
     - Ưu tiên phỏng tác có chọn lọc hơn là sao chép hàng loạt (Selective Adaptation over Bulk Copying).
     - Giữ nguyên thông báo bản quyền bắt buộc; lưu toàn bộ bằng chứng provenance tại registry và runbook.
  7. **Ranh Giới Roadmap & Phê Duyệt Hệ Thống**:
     - Ranh giới roadmap tối cao: Chính sách tái sử dụng tài nguyên KHÔNG cho phép tự ý chuyển phase hoặc bắt đầu Phase 13/Phase 14 khi chưa có chỉ định nhiệm vụ rõ ràng.
     - Phê duyệt hệ điều hành / IDE: Khi xuất hiện prompt cấp quyền của nền tảng, chính sách dự án không thể và không được phép tự ý vượt qua; Agent có trách nhiệm báo cáo và yêu cầu người dùng xác nhận với phạm vi hẹp nhất.
## D-058: Đóng Băng Kiến Trúc Và Hợp Đồng Triển Khai Phase 13 Mobile Authentication

- **Ngày quyết định**: 2026-10-18.
- **Phạm vi**: Ứng dụng di động WorkSphere Mobile, mô-đun xác thực (`features/auth`, `features/profile`, `app/auth`, `app/navigation`), hợp đồng API xác thực với backend.
- **Tình trạng**: APPROVED / FROZEN.
- **Nội dung quyết định**:
  1. **Đóng Băng Hợp Đồng API Xác Thực (Auth Endpoint Contracts)**:
     - `POST /api/v1/auth/login`: Nhận `login` (email/username, max 255), `password` (8–128 ký tự), `deviceName` (tùy chọn, max 255). Trả về `ApiResponse<AuthResponse>` gồm `accessToken`, `refreshToken`, `tokenType`, `accessTokenExpiresIn`, `refreshTokenExpiresIn`, và `user` (`UserInfo`).
     - `POST /api/v1/auth/refresh`: Nhận `refreshToken`. Trả về `ApiResponse<RefreshResponse>` gồm `accessToken`, `refreshToken` (xoay vòng - rotated), `tokenType`, `accessTokenExpiresIn`, `refreshTokenExpiresIn`. Không trả về `user` (duy trì user hiện có hoặc gọi `/api/v1/me` trong cold start nếu thiếu).
     - `POST /api/v1/auth/logout`: Yêu cầu `Authorization: Bearer <accessToken>` và body `refreshToken`. Trả về `204 No Content`. Thu hồi session hiện tại trên backend.
     - `POST /api/v1/auth/logout-all`: Yêu cầu `Authorization: Bearer <accessToken>`. Trả về `204 No Content`. Thu hồi toàn bộ session và refresh token của user.
     - `POST /api/v1/auth/forgot-password`: Nhận `email`. Luôn trả về thông báo đồng nhất "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu sẽ được gửi." để chống dò quét tài khoản (User Enumeration Protection).
     - `POST /api/v1/auth/reset-password`: Nhận `resetToken`, `newPassword` (8–128), `confirmPassword` (8–128). Hủy toàn bộ session đang hoạt động của người dùng sau khi đổi mật khẩu thành công.
     - `GET /api/v1/me`: Trả về `ApiResponse<UserProfileResponse>` thông tin cá nhân của người dùng hiện tại.
     - `PUT /api/v1/me`: Cập nhật `fullName` (max 150), `phoneNumber` (max 20).
     - `PUT /api/v1/me/password`: Đổi mật khẩu với `currentPassword`, `newPassword`, `confirmPassword`.
  2. **Chiến Lược Biểu Mẫu Có Kiểm Soát (Controlled-State Form Strategy)**:
     - Sử dụng React state có kiểm soát (`useState`) kết hợp pure validator functions.
     - **Không cài đặt thêm thư viện mới** (không dùng `react-hook-form`, `zod`, hay resolvers) nhằm giữ kích thước bundle tối giản, tránh xung đột tương thích với React 19 / React Native 0.88, và dễ dàng unit test độc lập.
     - Phân định ranh giới xác thực:
       - Client kiểm tra: trường bắt buộc, độ dài login tối đa 255, độ dài mật khẩu 8–128, khớp xác nhận mật khẩu, định dạng email cơ bản tại Forgot Password.
       - Server kiểm tra: tính hợp lệ của thông tin đăng nhập, sự tồn tại của tài khoản, trạng thái tài khoản (ACTIVE/PENDING/LOCKED/DISABLED), lịch sử mật khẩu, tính hợp lệ của token, và quyền hạn.
  3. **Máy Trạng Thái Xác Thực (Auth State Machine & Context)**:
     - Sử dụng `AuthProvider` với `useReducer` và `React.createContext`. Không dùng Redux hay Zustand.
     - Phân tách rõ ràng:
       - Trạng thái điều hướng (`SessionState`): `INITIALIZING` | `UNAUTHENTICATED` | `AUTHENTICATED`.
       - Trạng thái thao tác (`AuthOperationState`): `idle` | `authenticating` | `refreshing` | `signingOut` | `error`.
       - Dữ liệu phiên (`SessionData`): `currentUser`, `initialized`, `lastAuthError`.
  4. **Chính Sách Lưu Trữ Bí Mật (Secret Storage Policy)**:
     - `accessToken`: Lưu trữ **duy nhất trong bộ nhớ tạm (in-memory)** qua `accessTokenStore`. Cấm lưu vào `AsyncStorage`, React state, hay navigation params.
     - `refreshToken`: Lưu trữ **duy nhất trong Keychain/Keystore phần cứng an toàn** qua `secureStorage`.
     - Mật khẩu: Tuyệt đối không lưu vào state toàn cục, không ghi log, không in ra terminal.
  5. **Điều Phối Làm Mới Token Đơn Luồng (Single-Flight Token Refresh) & Điều Kiện Kích Hoạt**:
     - Quy tắc kích hoạt: Chỉ request thỏa mãn đủ 5 tiêu chí mới kích hoạt refresh: (1) HTTP 401 với mã UNAUTHORIZED, (2) Request gốc có chứa header Authorization, (3) Không thuộc endpoint auth (login, refresh, forgot, reset), (4) Chưa từng retry (!_retry), (5) config.skipAuthRefresh !== true.
     - Sử dụng **instance Axios riêng biệt (`refreshClient`)** không chứa response interceptor 401 đệ quy để gọi endpoint `/auth/refresh`.
     - Duy trì duy nhất một Promise `refreshPromise` ở phạm vi module. Request đầu tiên gặp 401 kích hoạt refresh, các request đồng thời khác gặp 401 cùng chia sẻ Promise này.
     - Lưu rotated refresh token (TTL 2,592,000s / 30 ngày) vào Keychain trước khi retry các request trong hàng đợi.
     - Mỗi request chỉ được retry tối đa 1 lần (đánh dấu qua cờ `_retry = true`). Nếu retry tiếp tục nhận 401, reject ngay lập tức và kích hoạt xóa phiên an toàn một lần duy nhất.
     - Không có vòng lặp vô hạn, không log token.
  6. **Khởi Tạo Phiên Khởi Động Lạnh (Cold-Start Bootstrap)**:
     - RootNavigator giữ trạng thái `INITIALIZING` hiển thị màn hình khởi tạo.
     - Đọc refresh token từ Keychain. Nếu không có -> chuyển sang `UNAUTHENTICATED`.
     - Nếu có refresh token -> gọi refresh qua `refreshClient` -> lưu rotated token -> set access token vào memory -> gọi `GET /api/v1/me` nạp user -> chuyển sang `AUTHENTICATED`.
     - Nếu refresh thất bại: Xóa access token, xóa refresh token và chuyển sang `UNAUTHENTICATED`.
     - Xử lý khi mất mạng lúc khởi động: Thông báo lỗi kết nối mạng nhưng cho phép người dùng thử lại hoặc chuyển về Login an toàn.
  7. **Rào Chắn Điều Hướng (Navigation Guard)**:
     - `RootNavigator` chuyển đổi có điều kiện giữa `AuthNavigator` và `MainTabNavigator` dựa trên `sessionState`.
     - Người dùng đã đăng nhập không thể quay lại màn hình Login bằng nút Back của hệ điều hành.
  8. **Thứ Tự Đăng Nhập & Đăng Xuất**:
     - Đăng nhập: Validate form -> disable submit kép -> gửi request -> ghi refresh token vào Keychain -> nạp access token vào memory -> gán user -> chuyển RootNavigator sang `AUTHENTICATED`. Nếu ghi Keychain lỗi -> rollback xóa token và báo lỗi an toàn.
     - Đăng xuất: Lấy snapshot refresh token -> gọi API backend logout (khi có mạng) -> finally luôn xóa access token và Keychain cục bộ -> xóa session user -> chuyển RootNavigator sang `UNAUTHENTICATED`.
     - Giới hạn khi offline logout: Xóa sạch phiên cục bộ ngay lập tức. Session trên server sẽ tự hết hạn nếu request thu hồi không gửi được.
  9. **Ánh Xạ Lỗi Thân Thiện & Ma Trận Mã Lỗi HTTP (Error-to-UI Mapping)**:
     - Đối soát chính xác HTTP status từ backend Spring Boot: Các lỗi nghiệp vụ (INVALID_CREDENTIALS, ACCOUNT_PENDING, ACCOUNT_LOCKED, ACCOUNT_DISABLED, REFRESH_TOKEN_*, RESET_TOKEN_*, CURRENT_PASSWORD_INCORRECT, NEW_PASSWORD_SAME_AS_CURRENT, PASSWORD_CONFIRMATION_MISMATCH, PASSWORD_POLICY_VIOLATION) được GlobalExceptionHandler trả về dưới mã **HTTP 422 Unprocessable Entity**; lỗi validation đầu vào trả về **HTTP 400**; lỗi thiếu/sai token trên protected endpoint trả về **HTTP 401 Unauthorized**; lỗi phân quyền trả về **HTTP 403 Forbidden**.
     - Ánh xạ chính xác toàn bộ mã lỗi backend sang thông điệp tiếng Việt rõ ràng, dễ hiểu.
     - Các lỗi validation đặt tại trường nhập liệu tương ứng; các lỗi nghiệp vụ chung (sai mật khẩu, tài khoản khóa) đặt tại thông báo form banner/dialog.
  10. **Xử Lý Khoảng Trống Mật Khẩu Tạm Thời (Temporary Password Gap)**:
      - Ghi nhận `TEMPORARY_PASSWORD_FLOW_GAP`: Tài khoản người dùng do admin tạo có mật khẩu tạm thời ở trạng thái `PENDING`. Backend chặn đăng nhập với lỗi `ACCOUNT_PENDING`.
      - Mobile Phase 13 ánh xạ lỗi này rõ ràng: *"Tài khoản của bạn chưa được kích hoạt. Vui lòng liên hệ quản trị viên."*
      - Mobile không tự ý phát minh luồng tự kích hoạt mật khẩu tạm thời khi chưa có hợp đồng backend. Luồng này sẽ được chuẩn hóa trong giai đoạn quản trị tài khoản sản xuất.
  11. **Chính Sách Tài Khoản Kiểm Thử E2E (Test Account Policy)**:
      - Xác nhận tuân thủ D-055 và D-056: Chỉ sử dụng các biến môi trường ngoài Git (`WORKSPHERE_DEV_E2E_USER_ENABLED`, `WORKSPHERE_E2E_*`).
      - Runner `E2eUserProvisioner` tạo tài khoản chuyên dụng ở trạng thái `ACTIVE` với vai trò tối thiểu `EMPLOYEE`, chỉ hoạt động trên profile `dev`.
      - Tuyệt đối không chạy provisioning hoặc login E2E trong task này.
  12. **Phân Đoạn Triển Khai (Subphases 13A - 13F)**:
      - `13A`: Auth DTOs, API adapters, pure form validators và error mappers.
      - `13B`: AuthProvider, reducer, Login flow, local logout, và navigation guard.
      - `13C`: Single-flight refresh coordinator, cold-start bootstrap, và token rotation retry-once.
      - `13D`: Profile và Change Password screens.
      - `13E`: Forgot Password và Reset Password screens.
      - `13F`: Settings screen, E2E auth integration, Android build/emulator verification, quét an ninh và đóng gói.
  13. **Tài Liệu Tham Chiếu Kiến Trúc Bên Ngoài (Required Architectural References)**:
      - Tuân thủ D-057: Xác lập các tài liệu tham chiếu chuẩn cho triển khai gồm tài liệu chính thức Axios (interceptor separation), React Navigation (conditional auth flow), và react-native-keychain (hardware key storage).
      - Không tải/clone mã nguồn vào repository WorkSphere; toàn bộ tài liệu kiến trúc và mã nền tảng nội bộ là đầy đủ 100%.
  14. **Khoảng Trống Kỹ Thuật Đã Xác Minh & Hoãn Lại (Verified Technical Gaps & Deferred Items)**:
      - `RESET_PASSWORD_DEEP_LINK_DEFERRED`: Chưa có cấu hình deep link cho mobile; token đặt lại mật khẩu trong Phase 13 được nhập thủ công hoặc truyền qua route navigation param kiểm thử.
      - `SETTINGS_POLICY_URL_DEFERRED`: Chưa có URL chính sách công khai trong canonical docs; SettingsScreen trong Subphase 13F hiển thị thông tin tĩnh nội bộ.
      - `TEMPORARY_PASSWORD_FLOW_GAP`: Tài khoản PENDING được ánh xạ lỗi thân thiện yêu cầu liên hệ admin; dev E2E sử dụng tài khoản ACTIVE từ E2eUserProvisioner.
  15. **Giới Hạn Nền Tảng iOS (iOS Build Limitation)**:
      - Module `EnvironmentConfigModule` đã được tích hợp đúng vào Xcode project target (D-054, D-055).
      - Do môi trường host phát triển là Windows, việc biên dịch binary native cho iOS chưa thể thực thi và chưa thể claim PASS native iOS cho đến khi có máy chủ macOS xác minh. Mã nguồn Phase 13 đảm bảo không chứa các giả định Android-only.

## D-059: Triển Khai Subphase 13A - Data Transfer Objects (DTOs), API Adapter, Pure Form Validators Và Error Mappers Cho Mobile Authentication

- **Ngày quyết định**: 2026-10-18.
- **Phạm vi**: `mobile/src/features/auth/api`, `mobile/src/features/auth/validation`, `mobile/src/features/auth/errors`, và các test suites liên quan trong `mobile/__tests__/auth/`.
- **Tình trạng**: APPROVED / COMPLETED.
- **Nội dung quyết định**:
  1. **Khắc Phục Module Augmentation Cho Axios Config**:
     - Định nghĩa `skipAuthRefresh?: boolean` và `_retry?: boolean` cho `AxiosRequestConfig` được chuẩn hóa tại `mobile/src/shared/api/axios.d.ts` thuộc tầng shared transport theo kết quả Phase 13A audit (giải quyết triệt để `AXIOS_REQUEST_METADATA_TYPING_RISK`).
     - Tách biệt hoàn toàn concern giữa DTO feature thuần túy (`authTypes.ts`) và cấu hình transport của Axios; cho phép transport adapter đánh dấu các request công khai bỏ qua bộ điều phối làm mới token tự động mà không vi phạm ranh giới phân tầng D-053.
  2. **Structural Runtime Type Guards**:
     - Triển khai các guard thuần `isAuthDepartment`, `isAuthUser`, `isAuthResponse`, `isRefreshResponse`.
     - Kiểm tra kiểu dữ liệu và cấu trúc trả về từ backend mà không ném ngoại lệ chứa giá trị token/mật khẩu, từ chối an toàn các payload không hợp lệ trước khi chuyển tiếp cho state layer.
  3. **Transport API Adapter Thuần Túy (`authApi`)**:
     - Hoạt động như lớp adapter truyền thông thuần túy kết nối HTTP endpoints Spring Boot (`/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, `/auth/forgot-password`, `/auth/reset-password`, `/me`, `/me/password`).
     - Gán cờ `skipAuthRefresh: true` cho toàn bộ endpoint công khai.
     - Xử lý phản hồi 204 No Content sạch sẽ cho `/auth/logout` và `/auth/logout-all`.
     - Tuyệt đối không lưu trữ token vào Keychain/AsyncStorage, không thay đổi AuthProvider hay Navigation, không tự ý retry đệ quy.
  4. **Bộ Kiểm Tra Biểu Mẫu Thuần Túy (Pure Form Validators) & Chính Sách Chuẩn Hóa**:
     - Triển khai `validateLogin`, `validateForgotPassword`, `validateResetPassword`, `validateChangePassword`, `validateUpdateProfile` dưới dạng hàm thuần túy không phụ thuộc React state hay UI components.
     - Mật khẩu tuyệt đối không được trim (bảo toàn khoảng trắng có chủ đích của người dùng); email được chuẩn hóa chữ thường; token đặt lại mật khẩu không bao giờ xuất hiện trong thông điệp lỗi hoặc log.
  5. **Bộ Ánh Xạ Lỗi Thân Thiện & An Toàn (`mapAuthError`)**:
     - Ánh xạ 15 mã lỗi nghiệp vụ backend Spring Boot và 8 lỗi transport kind sang `AuthPresentationError` với thông điệp tiếng Việt rõ ràng, vị trí hiển thị (placement: form, dialog, session, field), cờ `retryable`, cờ `clearSession`, cờ `navigateToLogin`, và bảo toàn `traceId`.
     - Đảm bảo thông điệp đồng nhất chống user-enumeration và không để lọt credential/token/stacktrace ra UI.
  6. **Độ Bao Phủ Kiểm Thử Đơn Vị**:
     - Bổ sung 4 suites kiểm thử (`authTypes.test.ts`, `authValidation.test.ts`, `authErrorMapper.test.ts`, `authApi.test.ts`) với 81 tests mới (tổng số test mobile đạt 24 suites, 193 tests, 100% PASS, 0 failures).


## D-060: Quy Định Toàn Dự Án Về Phân Tầng, Cách Ly, Thẩm Định Và Điều Phối Đa Tác Nhân (Standing Multi-Agent Orchestration, Isolation and Review Policy)

- **Ngày quyết định**: 2026-10-18.
- **Phạm vi**: Toàn bộ dự án WorkSphere, mọi Agent trong mọi phiên hội thoại, quy trình phối hợp đa tác nhân (multi-agent / sub-agents), phân quyền tệp, cô lập môi trường Git và kiểm soát chất lượng.
- **Tình trạng**: APPROVED / ENFORCED.
- **Nội dung quyết định**:
  1. **Phân loại Năng lực Nền tảng (Platform Capability Classification)**:
     - Nền tảng Antigravity hiện tại được xác minh đạt trạng thái **`TRUE_MULTI_AGENT`**: Hỗ trợ định nghĩa (`define_subagent`), điều phối song song ngầm (`invoke_subagent`), giao tiếp 2 chiều (`send_message`), quản trị tiến trình và hủy bỏ (`manage_subagents`), cô lập workspace (`Workspace: 'branch' | 'share'`), phân bổ vai trò (`Role`), chọn mô hình (`Model`), và lên lịch điều phối (`schedule`).
     - Duy trì song song cơ chế dự phòng chuẩn **`SEQUENTIAL_MULTI_ROLE_MODE`** khi môi trường hoặc tác vụ không khả thi với luồng song song.
  2. **Thẩm Quyền Thường Trực Của Agent (Standing Authority)**:
     - Agent được quyền tự chủ kích hoạt multi-agent khi: tác vụ có $\ge 2$ luồng công việc độc lập; đợt audit cần phản biện chéo khách quan; có nhiều phân hệ không sửa đổi cùng tệp; đầu ra phân vùng rành mạch; và kết quả được Coordinator tổng hợp đối soát.
     - Nghiêm cấm kích hoạt khi: tác vụ hẹp 1–3 tệp liên quan chặt; tác vụ Git nguyên tử đơn; các worker phải sửa cùng tệp; tác vụ chứa secret; thiếu cơ chế cô lập; hoặc chi phí overhead vượt quá lợi ích.
     - Ranh giới roadmap và chính sách an ninh luôn là bất biến tối cao.
  3. **Mô Hình Phân Vai Chuẩn (Standard Role Model)**:
     - Thiết lập 7 vai trò chuẩn: `Coordinator` (phân rã, điều phối, tổng hợp, quyết định cuối); `Contract Agent` (chỉ đọc, phân tích canonical docs/DTOs); `Implementation Agent` (chỉ sửa các tệp được cấp quyền); `Test Agent` (chạy test, build, không sửa mã để ép PASS); `Security Agent` (rà soát secret, token, quyền hạn, có quyền veto); `Reviewer Agent` (đối soát mã nguồn với hợp đồng, đòi hỏi bằng chứng thực tế); `Git Integrator` (duy nhất nắm quyền commit/push khi mọi cổng PASS).
  4. **Phân Quyền Tệp và Nguyên Tắc Một Người Ghi (File Ownership & Single-Writer Rule)**:
     - Mỗi worker bắt buộc phải có thông số: `allowed read paths`, `allowed write paths`, `forbidden paths`, `expected outputs`, `test responsibility`, `stop condition`.
     - Tuyệt đối cấm hai tác nhân chỉnh sửa cùng một tệp đồng thời. Khi cần đóng góp cùng tệp: duy nhất 1 Implementation Agent ghi mã, các tác nhân khác gửi recommendation/patch proposal, Coordinator kiểm duyệt và hợp nhất.
  5. **Cơ Chế Cách Ly Nhánh Bằng Git Worktree (Git Worktree Isolation)**:
     - Khi nhiều tác nhân ghi mã song song: Bắt buộc dùng Git worktree độc lập tại `.external/worktrees/<task-id>-<role> <temporary-branch>`. Thư mục nằm trong `.external/` đã được Git bỏ qua (`.gitignore`), bảo vệ working tree chính không bị ô nhiễm.
     - Không tự động merge khi test chưa PASS 100%. Coordinator kiểm tra diff trước khi cherry-pick/merge. Thu hồi worktree (`git worktree remove`) ngay sau khi tích hợp hoặc hủy bỏ.
     - Khi không thể tạo worktree an toàn: Chuyển ngay sang chế độ ghi tuần tự một tác nhân (sequential single-writer mode).
  6. **Giao Ước Đầu Ra Chuẩn Hóa Máy Đọc (Structured Output Contract)**:
     - Khối kết quả chuẩn hóa gồm 13 trường: `ROLE`, `TASK_ID`, `CHECKPOINT`, `READ_PATHS`, `WRITE_PATHS`, `FILES_READ`, `FILES_CHANGED`, `COMMANDS_RUN`, `FINDINGS`, `TEST_RESULTS`, `SECURITY_NOTES`, `OPEN_QUESTIONS`, `CONCLUSION`.
     - Chỉ chấp nhận 6 kết luận chuẩn: `PASS`, `NEEDS_PATCH`, `BLOCKED`, `CONTRACT_GAP`, `SECURITY_RISK`, `CAPABILITY_UNAVAILABLE`.
  7. **Thứ Tự Phân Xử Xung Đột (Conflict Resolution Hierarchy)**:
     - Cấp bậc ưu tiên: (1) Mã nguồn thực tế hiện tại $\rightarrow$ (2) Lockfile và đầu ra build $\rightarrow$ (3) Mã nguồn Backend hiện hành $\rightarrow$ (4) Canonical docs 01–10 $\rightarrow$ (5) Automated tests $\rightarrow$ (6) Historical reports $\rightarrow$ (7) Ý kiến chủ quan của Agent.
     - Không phân xử theo số đông; Security Agent có quyền veto chặn thực thi khi phát hiện rủi ro mức High/Critical.
  8. **Ngân Sách Lặp Và Thử Lại (Retry and Loop Budget)**:
     - Mỗi lệnh: tối đa 1 lần thử lại nếu không đổi input/giả thuyết; không polling lệnh nền liên tục; không lặp `git status`/`git log` để bù nhớ context; không đọc `transcript.jsonl` hoặc log cũ trừ khi có yêu cầu cụ thể.
     - Mỗi worker: tối đa 1 recovery check, 1 full test suite, 1 build run (trừ khi mã nguồn đã được sửa sau lỗi); nếu tiếp tục fail, trả về `BLOCKED`.
  9. **Quản Lý Ngân Sách Ngữ Cảnh (Context Budget)**:
     - Coordinator chỉ cung cấp thông tin mục tiêu hẹp tối thiểu cho worker, không forward toàn bộ lịch sử hội thoại.
     - Sau khi context compaction xảy ra: Tiếp tục từ Git checkpoint và bộ nhớ bền vững (`AGENTS.md`, `PROJECT_STATE.md`, `HANDOFF.md`, và báo cáo chuyên biệt); không đọc lại transcript cũ.
  10. **Ranh Giới An Ninh Tác Nhân (Security Boundaries)**:
      - Tuyệt đối không chia sẻ credential, token, Authorization header cho worker; cấm tác nhân ngoài truy cập `.env`, Keystore/Keychain, SSH keys, browser profile, CSDL production, hay thư mục ngoài `D:\WorkSphere`; tuân thủ tuyệt đối chính sách kiểm thẩm tài nguyên bên ngoài D-057.
  11. **Chế Độ Dự Phòng Tuần Tự (Fallback Mode)**:
      - Khi không áp dụng true multi-agent: Áp dụng `SEQUENTIAL_MULTI_ROLE_MODE` qua trình tự `Contract` $\rightarrow$ `Implementation` $\rightarrow$ `Test` $\rightarrow$ `Security` $\rightarrow$ `Reviewer` $\rightarrow$ `Git Integrator`. Xuất đầy đủ khối kết quả độc lập cho từng vai trò; trung thực về bản chất thực thi, không giả mạo đánh giá chéo độc lập.


## D-061: Khóa Quyết Định Kiến Trúc Và Đối Soát Hợp Đồng Phase 14 Mobile Dashboard & Projects (Phase 14 Dashboard & Projects Contract Freeze)

- **Ngày quyết định**: 2026-10-19.
- **Phạm vi**: Toàn bộ kiến trúc, DTOs, hợp đồng API, phân trang, tìm kiếm, lọc, phân quyền và lộ trình triển khai của Phase 14 Mobile Dashboard & Projects.
- **Tình trạng**: APPROVED / FROZEN.
- **Tài liệu tham chiếu**: `reports/PRE_PHASE_14_DASHBOARD_PROJECTS_AUDIT.md`, `reports/PHASE_14_CONTRACT_RECONCILIATION.md`.
- **Nội dung quyết định**:
  1. **Khóa Phạm Vi Màn Hình (Screen Scope & Ownership)**:
     - `SCR-MAIN-01` (Dashboard Screen) $\rightarrow$ Subphase 14B.
     - `SCR-PRJ-01` (Project List Screen) $\rightarrow$ Subphase 14C.
     - `SCR-PRJ-02` (Project Detail Screen) $\rightarrow$ Subphase 14D.
     - `SCR-PRJ-03` (Create Project), `SCR-PRJ-04` (Edit Project), `SCR-PRJ-05` (Change Status Modal), `SCR-PRJ-06` (Project Member List), `SCR-PRJ-07` (Add/Edit Member Sheet), `SCR-PRJ-08` (Milestone List), `SCR-PRJ-09` (Create Milestone) $\rightarrow$ Subphase 14E.
     - `PROJECT_DASHBOARD_PROJECTION_DEFERRED` (`GET /projects/{id}/dashboard`) hoãn theo canonical Phase 11; không chặn Personal Dashboard hay Project Detail.
     - Phân hệ Task (`SCR-TSK-01` .. `06`) tách biệt khỏi Phase 14 Dashboard + Projects.
  2. **Khóa Hợp Đồng Dữ Liệu Dashboard & Projects**:
     - `GET /dashboard/me`: Bảng điều khiển cá nhân pre-aggregated tại backend, tuyệt đối không tổng hợp số liệu client-side.
     - `GET /projects`: Danh sách phân trang 0-based qua `PagedData<ProjectSummaryResponse>`.
     - `GET /projects/{projectId}`: Chi tiết dự án kèm `allowedActions`, `milestones`, và `@Version`.
     - Tuyệt đối không thêm trường ngoài backend DTOs đã đối soát.
  3. **Khóa Quy Chuẩn Phân Trang, Tìm Kiếm & Lọc**:
     - Phân trang: 0-based (`page = 0`), kích thước mặc định 20, khớp hoàn toàn với `PagedData<T>` của mobile foundation.
     - Tìm kiếm: Server-side search (`search` param), debounce 300ms bằng `useRef` + `setTimeout` nội bộ (không thêm thư viện debounce).
     - Bộ lọc: Chỉ hỗ trợ các bộ lọc backend thực tế (`status`, `priority`, `departmentId`, `managerId`).
     - Sắp xếp: Whitelist trường backend (`createdAt`, `name`, `code`, `startDate`, `plannedEndDate`, `priority`, `status`).
     - Thay đổi tìm kiếm/bộ lọc bắt buộc reset `page = 0` và hủy generation cũ.
  4. **Khóa Cơ Chế Điều Phối Bất Đồng Bộ & Concurrency**:
     - Áp dụng **Generation Counter Pattern (Latest-Request-Wins)** kết hợp cờ `isMounted` để chống stale response và race condition.
     - Nối trang (`append`) bắt buộc deduplicate theo `item.id`.
     - `AbortController` là cơ chế tối ưu hóa tùy chọn, không phải điều kiện tiên quyết cho tính đúng đắn.
  5. **Khóa Khóa Lạc Quan & Luồng Trạng Thái (Optimistic Lock & Status Transitions)**:
     - Mọi request PUT sửa dự án hoặc đổi trạng thái bắt buộc gửi kèm `version: number`.
     - Xung đột HTTP 409 `OPTIMISTIC_LOCK_CONFLICT` không tự động retry, hiển thị cảnh báo và cung cấp nút tải lại dữ liệu mới nhất.
     - Ma trận trạng thái: Khóa chặt theo `Project.changeStatus` (`DRAFT -> ACTIVE, CANCELLED`; `ACTIVE -> ON_HOLD, COMPLETED, CANCELLED`; `ON_HOLD -> ACTIVE, CANCELLED`; `COMPLETED` và `CANCELLED` là terminal).
  6. **Khóa Phân Quyền & Bất Biến Thành Viên (D-013 Guard)**:
     - Thao tác điều hành trên Detail hiển thị có điều kiện dựa trên `allowedActions` từ backend.
     - Nút "Tạo dự án" yêu cầu quyền `PROJECT_CREATE`.
     - Backend là nơi thực thi kiểm soát truy cập tối cao (`403 Forbidden`).
     - Tuân thủ nghiêm ngặt D-013: Cấm xóa hoặc giáng cấp Project Manager duy nhất của dự án (`PROJECT_MANAGER_REQUIRED`).
  7. **Khóa Kiến Trúc Dữ Liệu & Ranh Giới Thư Viện**:
     - Tuyệt đối không cài thêm thư viện quản lý state hay data-fetching (không React Query, không SWR, không Redux, không Lodash).
     - Sử dụng API adapters thuần túy kết hợp React custom hooks và component state.
  8. **Khóa Lộ Trình Triển Khai Subphases (14A - 14F)**:
     - `14A`: Contracts, DTOs, API Adapters & Navigation Types.
     - `14B`: Personal Dashboard Screen (`SCR-MAIN-01`).
     - `14C`: Project List Screen (`SCR-PRJ-01`) & Search/Filter.
     - `14D`: Project Detail Screen (`SCR-PRJ-02`) & Milestones.
     - `14E`: Project Management Flows (`SCR-PRJ-03`..`09`).
     - `14F`: Integration, Regression, Android E2E (conditional), Security & Final Audit.

---

## D-062: Phase 14E Human-Readable User Selection Contract

- **Ngày quyết định**: 2026-10-20.
- **Phạm vi**: Hợp đồng tìm kiếm và lựa chọn người dùng (User Picker / Directory API) cho Phase 14E Project Management (`SCR-PRJ-03`, `SCR-PRJ-07`) và tái sử dụng cho các phân hệ tiếp theo.
- **Tình trạng**: APPROVED / FROZEN.
- **Tài liệu tham chiếu**: `reports/PHASE_14E_REFERENCE_DATA_CONTRACT_RESOLUTION.md`, `reports/PHASE_14E_PROJECT_MANAGEMENT_REPORT.md`.
- **Nội dung quyết định**:
  1. **Khóa Endpoint Danh Bạ Công Khai Tối Thiểu (Purpose-Scoped Directory API)**:
     - Khóa endpoint `GET /api/v1/directory/users` thuộc phân hệ Identity (`com.worksphere.identity`).
     - Phục vụ tìm kiếm và chọn nhân viên cho các luồng nghiệp vụ không quản trị (gán thành viên dự án, phân công yêu cầu, gán tài sản).
     - Tuyệt đối không mở rộng quyền `USER_READ` hoặc tái sử dụng endpoint quản trị `/api/v1/admin/users` cho Project Manager hay nhân viên thông thường (`ADMIN_USER_API_OVERPRIVILEGED_FOR_PROJECT_PICKER`).
  2. **Khóa Giảm Thiểu Dữ Liệu (Data Minimization DTO)**:
     - DTO trả về `UserDirectoryResponse` chỉ gồm 6 trường danh bạ công khai: `id` (UUID), `username`, `fullName`, `email`, `avatarUrl`, `departmentName`.
     - Tuyệt đối loại trừ: `roles`, `permissions`, `phoneNumber`, `status`, `lastLoginAt`, `failedLoginCount`, `passwordHash`, và các trường kiểm toán nội bộ.
  3. **Khóa Điều Kiện Hoạt Động (Active Accounts Only)**:
     - Endpoint chỉ trả về tài khoản hoạt động (`deleted = false AND status = 'ACTIVE'`).
     - Loại trừ toàn bộ tài khoản `PENDING`, `LOCKED`, `DISABLED`, `DELETED`.
  4. **Khóa Mô Hình Phân Quyền (Authentication Boundary)**:
     - Endpoint yêu cầu xác thực Bearer token thông thường (`AUTHENTICATED`), tương tự `GET /api/v1/departments`.
     - Không yêu cầu quyền quản trị hay di trú bảng `permissions` (Zero Flyway migration).
  5. **Khóa Lộ Trình Vá Lỗ Hổng Hợp Đồng (Gap Patches)**:
     - `14E-G1`: Triển khai và kiểm thử độc lập backend directory endpoint.
     - `14E-G2`: Triển khai và kiểm thử độc lập mobile directory adapter và modal component `UserPickerModal`.
     - Sau khi hoàn thành hai bước trên, Subphase 14E tiếp tục triển khai các màn hình quản lý dự án.


## D-063: Phase 15 Task Management Mobile Contract Freeze

- **Ngày quyết định**: 2026-10-20.
- **Phạm vi**: Khóa kiến trúc và hợp đồng tích hợp Mobile Task Management (Phase 15, màn hình `SCR-TSK-01` .. `SCR-TSK-08`).
- **Tình trạng**: APPROVED / FROZEN.
- **Tài liệu tham chiếu**: `reports/PHASE_15_TASK_CONTRACT_FREEZE.md`, `reports/PRE_PHASE_15_TASK_MANAGEMENT_AUDIT.md`.
- **Nội dung quyết định**:
  1. **Nguồn Dữ Liệu Phân Công Nhiệm Vụ (Task Assignee Eligibility & Source)**:
     - Người được phân công công việc bắt buộc phải là thành viên hoạt động của dự án (`projectMemberRepository.existsByProjectIdAndUserIdAndActiveTrue`).
     - Mobile picker chọn người thực hiện cho Task bắt buộc truy vấn từ `GET /api/v1/projects/{projectId}/members?active=true`. Tuyệt đối không dùng danh bạ toàn công ty (`/directory/users`) làm nguồn ứng viên phân công task trực tiếp.
  2. **Tách Biệt Định Danh Phân Công (Assignment Identity)**:
     - Phân định rõ `userId` (ID của nhân viên) và `assignmentId` (`task_assignments.id`).
     - Thao tác gỡ phân công `DELETE /api/v1/tasks/{taskId}/assignments/{assignmentId}` bắt buộc truyền `assignmentId` (từ `AssigneeDetail.assignmentId`), không truyền `userId`.
  3. **Chuẩn Khóa Đột Biến Bằng Ref (Synchronous Mutation-Lock Standard)**:
     - Tất cả các mutation handler (tạo task, sửa task, đổi trạng thái, cập nhật tiến độ, phân công, xóa task, bình luận) phải sử dụng synchronous ref lock (`isSubmittingRef.current = true`) ngay khi kích hoạt để triệt tiêu nguy cơ duplicate submit do double-tap. State `isSubmitting` chỉ phục vụ hiển thị UI.
  4. **Tối Thiểu Hóa Dữ Liệu Điều Hướng (Route Data Minimization)**:
     - Tham số điều hướng chỉ truyền ID duy nhất (`taskId`, `projectId`, `parentTaskId`).
     - Tuyệt đối không truyền object Task, danh sách quyền, `allowedActions`, hay số `version` qua route params.
  5. **Mô Hình Tái Sử Dụng Thành Phần Chọn Người (Picker Architecture)**:
     - Triển khai `ProjectMemberAssigneePickerModal` độc lập trong `features/tasks/components/` tái sử dụng phong cách giao diện và cơ chế debounce của `UserPickerModal` nhưng gắn với dữ liệu thành viên dự án, tránh ghép lỏng lẻo hay gây rủi ro hồi quy cho `UserPickerModal`.
  6. **Quy Tắc Chuyển Đổi Trạng Thái & Tiến Độ (State Machine & Progress Invariant)**:
     - Chuyển sang `COMPLETED` tự động cập nhật tiến độ thành 100%. Tuy nhiên, việc cập nhật tiến độ đạt 100% qua `updateProgress` KHÔNG tự động chuyển trạng thái task sang `COMPLETED`.
  7. **Ranh Giới Tệp Đính Kèm (Attachment Boundary Drift)**:
     - Phân hệ Task trên mobile Phase 15 tập trung vào luồng thảo luận/bình luận văn bản. Quản lý tải lên tệp đính kèm được hoãn lại cho phân hệ Quản lý Tệp riêng biệt.


## D-064: Phase 15 Task Due-Date Semantics

- **Ngày quyết định**: 2026-10-20.
- **Phạm vi**: Chuẩn hóa ngữ nghĩa chuyển đổi ngày hạn chót (dueDate) giữa giao diện Mobile và backend Task API (`SCR-TSK-03` & `SCR-TSK-04`).
- **Tình trạng**: APPROVED / FROZEN.
- **Tài liệu tham chiếu**: `reports/PHASE_15_TASK_DUE_DATE_POLICY.md`.
- **Nội dung quyết định**:
  1. **Múi Giờ Nghiệp Vụ & Ranh Giới Hạn Chót (Business Timezone & Deadline Boundary)**:
     - WorkSphere vận hành theo lịch làm việc Việt Nam (múi giờ `Asia/Ho_Chi_Minh`, UTC+7).
     - Khi người dùng chọn ngày hạn chót `YYYY-MM-DD` trên giao diện Mobile (chỉ chọn ngày, không chọn giờ), hạn chót có hiệu lực đến hết ngày làm việc đó theo giờ địa phương: `00:00:00 UTC+7` của ngày tiếp theo, tương đương Instant UTC `${YYYY-MM-DD}T17:00:00Z`.
     - Chuẩn này đồng nhất 100% với các ví dụ hợp đồng trong `06_API_CONTRACT.md` và `TaskTest.java`, đồng thời bảo đảm `dueDate.atZone(ZoneOffset.UTC).toLocalDate()` trong `Task.java` trả về chính xác ngày `YYYY-MM-DD` người dùng đã chọn.
  2. **Bảo Toàn Timestamp Khi Sửa Không Đổi Ngày (PRESERVE_EXACT_SERVER_INSTANT_WHEN_DATE_UNCHANGED)**:
     - Trong màn hình `EditTaskScreen`, khi tải dữ liệu công việc hiện hữu từ server, component lưu giữ chuỗi `Instant` nguyên bản của server.
     - Khi người dùng lưu chỉnh sửa mà KHÔNG thay đổi ngày hạn chót trên ô nhập liệu, payload `UpdateTaskRequest.dueDate` bắt buộc gửi lại nguyên vẹn chuỗi `Instant` gốc của server. Tuyệt đối không tự động chuẩn hóa hay làm trôi giờ (drift) của công việc hiện hữu.
  3. **Chỉnh Sửa Khi Thay Đổi Ngày (Edit Changed Date)**:
     - Khi người dùng chủ động thay đổi ngày hạn chót sang ngày mới `YYYY-MM-DD`, mobile tạo `Instant` mới theo quy tắc hạn chót chính thức: `${YYYY-MM-DD}T17:00:00Z`.
  4. **Tạo Mới Công Việc (Create Task)**:
     - Ô hạn chót có giá trị `YYYY-MM-DD` hợp lệ được tuần tự hóa thành `${YYYY-MM-DD}T17:00:00Z`. Ô trống gửi `undefined`. Ngày không tồn tại trong lịch bị chặn ngay tại client.
  5. **Đối Soát Khoảng Ngày (Date Range Comparison)**:
     - Client-side validation đối soát trực tiếp ngày lịch `startDate` (`YYYY-MM-DD`) với ngày lịch được bóc tách từ `dueDate` (`YYYY-MM-DD`).
     - Ngày bắt đầu trùng ngày hạn chót (`startDate === dueDate`) là HỢP LỆ. Chỉ chặn khi `startDate > dueDate`.


## D-065: Phase 16 Mobile Service Request Contract & Scope Freeze

- **Ngày quyết định**: 2026-10-21.
- **Phạm vi**: Khóa kiến trúc, hợp đồng API, phân rã phạm vi và quy chuẩn tích hợp Mobile Service Requests (Phase 16, màn hình `SCR-SRV-01` .. `SCR-SRV-06`).
- **Tình trạng**: APPROVED / FROZEN.
- **Tài liệu tham chiếu**: `reports/PHASE_16_SERVICE_REQUEST_CONTRACT_FREEZE.md`, `reports/PRE_PHASE_16_AUDIT.md`.
- **Nội dung quyết định**:
  1. **Tách Biệt Phạm Vi Phân Hệ (Module Scope Decoupling)**:
     - Dựa trên tiền lệ thành công của Quyết định `D-061` (tách Roadmap Mục 18 thành Phase 14 Dashboard/Projects và Phase 15 Tasks), Phân hệ Mobile Service Request và Phân hệ Quản lý Tài sản (Asset) được tách biệt thành hai giai đoạn độc lập:
       - **Phase 16**: **Mobile Service Requests** (`SCR-SRV-01` .. `SCR-SRV-06`).
       - **Phase 17**: **Mobile Asset Management** (`SCR-AST-01` .. `SCR-AST-06`).
     - Tuyệt đối không triển khai màn hình Quản lý Tài sản trong Phase 16.
  2. **Nguồn Ứng Viên Phân Công (Assignee Candidate Source)**:
     - Khác với Task (chỉ phân công thành viên dự án), Service Request mang tính chất hỗ trợ tổ chức; người xử lý được chọn từ Danh bạ nhân viên toàn công ty (`GET /api/v1/directory/users`).
     - Tái sử dụng `UserPickerModal` từ Phase 14 (`mobile/src/features/directory/components/UserPickerModal.tsx`). Thao tác phân công chỉ hiển thị khi người dùng có quyền Quản trị hệ thống (`allowedActions.includes('ASSIGN')`).
  3. **Nguồn Danh Mục Dịch Vụ (Service Category Source)**:
     - Mobile chỉ tiêu thụ danh sách danh mục đang hoạt động qua `GET /api/v1/service-categories`. Không hiển thị hoặc triển khai chức năng quản trị danh mục (`/api/v1/admin/service-categories`), nội dung này thuộc Admin Module.
  4. **Chính Sách Tài Sản Liên Kết (Asset Context Policy)**:
     - Yêu cầu dịch vụ được phép tạo mà không cần gắn tài sản (`assetId: undefined`).
     - Hỗ trợ nhận `assetId` qua tham số điều hướng phục vụ luồng "Báo hỏng" trong tương lai. Không tạo ô nhập UUID tự do; modal chọn tài sản trực tiếp trong form hoãn đến Phase 17.
  5. **Ranh Giới Tệp Đính Kèm (Attachment Boundary Policy)**:
     - Hỗ trợ hiển thị danh sách tệp đính kèm do server trả về (`originalName`, `sizeBytes`, `downloadUrl`) và mở tải tệp qua `apiClient`.
     - Chức năng chọn tệp từ máy / upload nhị phân hoãn lại do giới hạn thư viện native (không thêm thư viện ngoài).
  6. **Quy Chuẩn Khóa Đột Biến Bằng Ref (Synchronous Mutation-Lock Standard)**:
     - Toàn bộ 7 luồng mutation (Tạo yêu cầu, Từ chối giải quyết, Cập nhật trạng thái, Phân công, Chỉnh sửa, Bình luận, Đánh giá) bắt buộc sử dụng synchronous `useRef` lock (`submittingRef.current = true` / `addingRef.current = true`) ngay khi kích hoạt để triệt tiêu nguy cơ duplicate submit do double-tap.
  7. **Tối Thiểu Hóa Dữ Liệu Điều Hướng (Route Data Minimization)**:
     - Tham số điều hướng chỉ truyền ID duy nhất (`requestId`, `assetId`). Tuyệt đối không truyền object thực thể, quyền hạn, `allowedActions`, hay số `version` qua route params.
  8. **Mở Rộng StatusBadge (StatusBadge Extension)**:
     - Bổ sung ngữ cảnh `type="serviceRequest"` trong `StatusBadge.tsx` với ánh xạ đầy đủ 7 trạng thái canonical (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_FOR_USER`, `RESOLVED`, `CLOSED`, `CANCELLED`), đặc biệt bổ sung `'ASSIGNED': 'Đã phân công'`.
