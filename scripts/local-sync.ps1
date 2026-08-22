# 사무실 PC 전용 — 매일 09:30 자동 실행
#
# 열린국회정보 API 는 GitHub Actions(해외 클라우드 IP)의 접속을 막는다
# (연결 자체가 타임아웃 — CONNECT_TIMEOUT, 인증키 문제 아님).
# 반면 이 PC의 국내 네트워크에서는 정상 접속되므로, 자동 수집을 이 PC에서 대신 실행하고
# 결과만 GitHub 에 올린다. 사이트 자체는 여전히 100% GitHub Pages 에서 서비스된다 —
# 이 스크립트가 하는 일은 데이터 수집 후 커밋·푸시뿐이다.
#
# 이 작업폴더는 Dropbox 로 사무실 PC와 동기화되어 두 PC가 번갈아 쓰므로,
# 예약 작업은 반드시 이 PC(사무실 PC) 한 곳에만 등록한다. (register-local-sync-task.ps1)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$logFile = Join-Path $repoRoot "scripts\local-sync.log"
function Log($msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
    Write-Output $line
    Add-Content -Path $logFile -Value $line
}

# 중복 실행 방지 — Dropbox 동기화 중 또는 이전 실행이 남아 있으면 건너뛴다.
$lockFile = Join-Path $repoRoot ".sync.lock"
if (Test-Path $lockFile) {
    $age = (Get-Date) - (Get-Item $lockFile).LastWriteTime
    if ($age.TotalMinutes -lt 30) {
        Log "이미 실행 중으로 보입니다 (lock 파일 $([int]$age.TotalMinutes)분 전). 건너뜁니다."
        exit 0
    }
    Log "오래된 lock 파일을 정리합니다."
}
New-Item -ItemType File -Path $lockFile -Force | Out-Null

try {
    # .env.local 에서 인증키를 읽는다. 이 파일은 git 에 커밋하지 않는다 (.gitignore 처리됨).
    $envFile = Join-Path $repoRoot ".env.local"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$') {
                [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }
    if (-not $env:ASSEMBLY_API_KEY) {
        Log "오류: .env.local 에 ASSEMBLY_API_KEY 가 없습니다. 저장소 루트에 파일을 만들고"
        Log "      ASSEMBLY_API_KEY=발급받은키  한 줄을 넣으세요."
        exit 1
    }

    Log "git pull 시작"
    git pull --rebase --autostash origin main 2>&1 | ForEach-Object { Log "  $_" }
    if ($LASTEXITCODE -ne 0) { throw "git pull 실패 (exit $LASTEXITCODE)" }

    Log "npm run sync 시작"
    npm run sync 2>&1 | ForEach-Object { Log "  $_" }
    $syncExit = $LASTEXITCODE
    Log "npm run sync 종료 (exit $syncExit)"

    $changed = git status --porcelain src/data/official
    if ($changed) {
        git add src/data/official
        $stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        $status = if ($syncExit -eq 0) { "success" } else { "failure" }
        git commit -m "공식 기록 동기화 $stamp KST [$status] (사무실 PC)" | ForEach-Object { Log "  $_" }
        git push origin main 2>&1 | ForEach-Object { Log "  $_" }
        if ($LASTEXITCODE -ne 0) { throw "git push 실패 (exit $LASTEXITCODE)" }
        Log "커밋·푸시 완료"
    } else {
        Log "변경 없음 — 커밋하지 않습니다."
    }

    if ($syncExit -ne 0) {
        Log "수집 단계가 실패했습니다. src/data/official/sync-log.json 을 확인하세요."
        exit 1
    }
    Log "완료"
}
catch {
    Log "오류: $($_.Exception.Message)"
    exit 1
}
finally {
    Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}
