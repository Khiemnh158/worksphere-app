$ErrorActionPreference = 'Stop'
$testUrl = $env:WORKSPHERE_AUTHZ_TEST_JDBC_URL
if (!$testUrl -or $testUrl -notmatch '^jdbc:postgresql://(localhost|127\.0\.0\.1):[0-9]+/worksphere_(authz|test|web_test)[a-zA-Z0-9_]*$') {
    throw 'Cấp WORKSPHERE_AUTHZ_TEST_JDBC_URL tới PostgreSQL local riêng, database worksphere_authz*, worksphere_test* hoặc worksphere_web_test*. Không dùng database thực hành đang chạy hay dữ liệu thật.'
}
if (!$env:WORKSPHERE_AUTHZ_TEST_DB_USER -or !$env:WORKSPHERE_AUTHZ_TEST_DB_PASSWORD) {
    throw 'Cần cấp tài khoản và mật khẩu database kiểm thử qua biến môi trường.'
}
$backend = Join-Path (Split-Path $PSScriptRoot -Parent) 'backend'
$tests = 'AuthorizationPostgresTest,WorkplacePostgresTest,ProjectAccessPolicyTest,SessionAuthorizationTest,ServiceRequestAccessPolicyTest,TaskTest,TaskWorkflowTest,E2eUserProvisionerTest,FileValidationServiceTest,FilenameSanitizerTest,StoredFileTest,TwoFactorServiceTest'
Push-Location $backend
try {
    & '.\mvnw.cmd' "-Dtest=$tests" test
    $testExit = $LASTEXITCODE
} finally { Pop-Location }
exit $testExit
