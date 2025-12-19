param(
    [string]$TaskName = "Netflix Central Backend"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$ExePath  = Join-Path $RepoRoot "netflix-central.exe"

Write-Host "[info] Repo root: $RepoRoot"

if (-not (Test-Path $ExePath)) {
    Write-Host "[info] Building backend binary..."
    Push-Location $RepoRoot
    try {
        go build -o $ExePath
    } finally {
        Pop-Location
    }
}

if (-not (Test-Path $ExePath)) {
    throw "Build failed; netflix-central.exe not found. Pastikan Go terpasang."
}

$action = New-ScheduledTaskAction -Execute $ExePath -WorkingDirectory $RepoRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest
$task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal

Write-Host "[info] Registering scheduled task '$TaskName'..."
Register-ScheduledTask -TaskName $TaskName -InputObject $task -Force | Out-Null

Write-Host "[info] Starting task..."
Start-ScheduledTask -TaskName $TaskName | Out-Null
Write-Host "[done] Backend installed and started. API on http://localhost:8080"
