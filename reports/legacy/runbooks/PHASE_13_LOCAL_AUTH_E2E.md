# PHASE 13 LOCAL AUTH E2E RUNBOOK

## 1. Overview and Invariants

This runbook documents the operational procedure for provisioning a dedicated local test account and executing end-to-end authentication testing in local development.

### Strict Security Rules:
- Never commit actual usernames, emails, passwords, tokens, or `.env` files to Git.
- Never use personal, production, or customer credentials.
- Never print or echo password values in terminal, logcat, reports, or screenshots.
- Dedicated local account is provisioned with least-privilege role (`EMPLOYEE`) and `ACTIVE` status.
- Provisioning is strictly disabled in production (`@Profile("dev")` and `@ConditionalOnProperty`).

---

## 2. Environment Contract Variables

The backend E2E provisioner consumes the following environment variable contract:

| Environment Variable | Required | Description | Example Placeholder |
| :--- | :--- | :--- | :--- |
| `WORKSPHERE_DEV_E2E_USER_ENABLED` | Yes (for provisioning) | Master flag enabling the dev runner | `"true"` |
| `WORKSPHERE_E2E_LOGIN` | Optional if username/email set | Unified login identifier | `"<external-login>"` |
| `WORKSPHERE_E2E_USERNAME` | Yes (or via login) | Unique username (3–50 chars) | `"<external-username>"` |
| `WORKSPHERE_E2E_EMAIL` | Yes (or via login) | Unique email address | `"<external-email>"` |
| `WORKSPHERE_E2E_PASSWORD` | Yes | Dedicated password (8–128 chars) | `"<external-secret>"` |
| `WORKSPHERE_E2E_FULL_NAME` | No | Display name (defaults to "E2E Test User") | `"<optional-display-name>"` |
| `WORKSPHERE_E2E_BASE_URL` | No | Custom host/IP override for mobile | `"http://10.0.2.2:8080/api/v1"` |

---

## 3. Step-by-Step Provisioning and Execution Procedure

### Step 3.1: Start Local PostgreSQL Container
Verify or start the local development database container:
```powershell
& "C:\Users\dienm\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe" start worksphere-dev-pg
```
Verify port 5432 is listening:
```powershell
Get-NetTCPConnection -LocalPort 5432 -State Listen
```

### Step 3.2: Configure Environment Variables in Private Session
In a private, non-recorded PowerShell session, set the environment variables using placeholders (do not echo variables back to terminal):
```powershell
$env:WORKSPHERE_DEV_E2E_USER_ENABLED = "true"
$env:WORKSPHERE_E2E_USERNAME = "<external-username>"
$env:WORKSPHERE_E2E_EMAIL = "<external-email>"
$env:WORKSPHERE_E2E_PASSWORD = "<external-secret>"
$env:WORKSPHERE_E2E_FULL_NAME = "E2E Test Employee"
```

### Step 3.3: Launch Backend with Dev Profile
Start the backend using Maven wrapper under the `dev` profile:
```powershell
cd D:\WorkSphere\backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

### Step 3.4: Verify Provisioning from Safe Logs
Inspect backend startup logs. Confirm the safe generic message appears without exposing credentials:
```text
INFO com.worksphere.identity.dev.E2eUserProvisioner -- Dedicated E2E test account provisioned successfully with ACTIVE status and least-privilege role.
```
On subsequent startups, the runner is idempotent and logs:
```text
INFO com.worksphere.identity.dev.E2eUserProvisioner -- E2E test account already exists. Provisioning skipped.
```

### Step 3.5: Disable Provisioning Flag
Once the account exists in `worksphere-dev-pg`, reset the provisioning flag to prevent re-execution:
```powershell
$env:WORKSPHERE_DEV_E2E_USER_ENABLED = "false"
```

### Step 3.6: Execute Mobile E2E Tests
When Phase 13 E2E test suite or emulator session is executed:
- The mobile app communicates with `http://10.0.2.2:8080/api/v1` on Android emulator.
- Submits credentials via private test runner referencing `$env:WORKSPHERE_E2E_LOGIN` and `$env:WORKSPHERE_E2E_PASSWORD`.
- If environment variables are absent, automated E2E tests skip gracefully with an informative notice.

---

## 4. Database Reset and Cleanup Policy

If the local development database requires reset or re-seeding:
1. Stop backend process.
2. Connect to local database container:
   ```powershell
   & "C:\Users\dienm\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe" exec worksphere-dev-pg psql -U postgres -d worksphere -c "DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE username = '<external-username>'); DELETE FROM users WHERE username = '<external-username> subterranean';"
   ```
3. Or drop and recreate the `worksphere` database to allow Flyway to re-run from V001:
   ```powershell
   & "C:\Users\dienm\AppData\Local\Programs\DockerDesktop\resources\bin\docker.exe" exec worksphere-dev-pg psql -U postgres -c "DROP DATABASE worksphere; CREATE DATABASE worksphere;"
   ```
4. Clear session environment variables:
   ```powershell
   Remove-Item Env:\WORKSPHERE_DEV_E2E_USER_ENABLED -ErrorAction SilentlyContinue
   Remove-Item Env:\WORKSPHERE_E2E_USERNAME -ErrorAction SilentlyContinue
   Remove-Item Env:\WORKSPHERE_E2E_EMAIL -ErrorAction SilentlyContinue
   Remove-Item Env:\WORKSPHERE_E2E_PASSWORD -ErrorAction SilentlyContinue
   Remove-Item Env:\WORKSPHERE_E2E_LOGIN -ErrorAction SilentlyContinue
   ```
