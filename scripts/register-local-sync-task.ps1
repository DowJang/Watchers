# 사무실 PC에서 딱 한 번만 실행하는 설정 스크립트.
#
# 매일 09:30 에 local-sync.ps1 을 자동 실행하도록 Windows 작업 스케줄러에 등록한다.
# 관리자 권한 없이 실행 가능 (현재 로그인한 사용자 계정으로 등록되며, PC가 켜져
# 로그인되어 있을 때만 실행된다).
#
# 실행 방법: 이 파일을 우클릭 → PowerShell로 실행
#   또는 PowerShell 창에서: powershell -ExecutionPolicy Bypass -File .\register-local-sync-task.ps1

$repoRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $repoRoot "scripts\local-sync.ps1"

if (-not (Test-Path $scriptPath)) {
    Write-Error "local-sync.ps1 을 찾을 수 없습니다: $scriptPath  (Dropbox 동기화가 아직 안 끝났을 수 있습니다)"
    exit 1
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At 9:30AM
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask -TaskName "감시자들 공식데이터동기화" `
    -Action $action -Trigger $trigger -Settings $settings `
    -Description "매일 09:30 열린국회정보 수집 후 GitHub 에 자동 커밋·푸시 (scripts/local-sync.ps1)" `
    -Force | Out-Null

Write-Output "등록 완료."
Write-Output "작업 스케줄러(taskschd.msc) 에서 '감시자들 공식데이터동기화' 로 확인할 수 있습니다."
Write-Output ""
Write-Output "지금 바로 한 번 테스트하려면:"
Write-Output "  Start-ScheduledTask -TaskName '감시자들 공식데이터동기화'"
Write-Output "테스트 후 결과 로그: scripts\local-sync.log"
