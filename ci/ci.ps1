<#
.SYNOPSIS
Run the complete CI pipeline in an ephemeral Docker container. Exits 0 only if every stage passed.

.DESCRIPTION
This script is a wrapper and deliberately contains no pipeline logic. The stages live in
ci/run-checks.sh, which is what actually runs — here, on GitHub, and on any self-hosted runner added
later — so there is one definition of what "CI passes" means rather than two that agree until the
day they matter.

Nothing here depends on the developer's machine beyond Docker and git. In particular it does not
depend on the developer's Node: the container pins the version the enforcement surface pins, which
is the whole reason a local run is worth trusting. That is not hypothetical for this repository —
the test invocation in package.json had never once run in CI, because it needed a newer Node than
the workflow pins and every local run used a newer one still.

.PARAMETER KeepOnFailure
Leave the failed container in place for `docker exec` inspection.

.PARAMETER NodeVersion
Build against a different Node major. Defaults to 20, matching the GitHub workflow.

.EXAMPLE
.\ci\ci.ps1
.EXAMPLE
.\ci\ci.ps1 -KeepOnFailure -Verbose
#>
[CmdletBinding()]
param(
    [switch]$KeepOnFailure,
    [string]$NodeVersion = "20"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $repoRoot
try {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is required and was not found."
    }
    docker info *> $null
    if ($LASTEXITCODE -ne 0) { Write-Error "Docker is installed but not running." }

    $branch = (git rev-parse --abbrev-ref HEAD 2>$null)
    $commit = (git rev-parse HEAD 2>$null)
    if (-not $commit) { $commit = "unknown" }
    $dirty = [bool](git status --porcelain 2>$null)

    # Unique per run, so two runs — or two repositories using this pattern — cannot collide, and so
    # the teardown below can only ever remove resources this run created. `docker compose down` is
    # scoped to the project; it is not `docker system prune`, and it must never become it.
    $suffix = -join ((1..6) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
    $project = "hfn-ci-$($commit.Substring(0, [Math]::Min(12, $commit.Length)))-$PID-$suffix"
    $image = "hfn-local-ci:node$NodeVersion"
    $container = "$project-ci"

    $env:CI_NODE_VERSION = $NodeVersion
    $env:CI_IMAGE = $image

    $evidenceDir = Join-Path $repoRoot "artifacts/local-ci"
    New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null
    $log = Join-Path $evidenceDir "last-run.log"
    $startedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

    Write-Host "Local CI"
    Write-Host "  repository : $repoRoot"
    Write-Host "  branch     : $branch"
    $dirtyNote = if ($dirty) { "  (working tree is dirty; the container tests the tree, not the commit)" } else { "" }
    Write-Host "  commit     : $commit$dirtyNote"
    Write-Host "  image      : $image"
    Write-Host "  project    : $project`n"

    $composeArgs = @("compose", "-f", "compose.ci.yml", "-p", $project)

    $removed = $false
    $cleanup = {
        if ($script:removed) { return }
        $script:removed = $true
        & docker @composeArgs down --remove-orphans --volumes --timeout 5 *> $null
        & docker rm --force $container *> $null
    }

    try {
        Write-Verbose "docker $($composeArgs -join ' ') build"
        & docker @composeArgs build --quiet
        if ($LASTEXITCODE -ne 0) { throw "The CI image failed to build." }

        $runArgs = if ($KeepOnFailure) { @("run", "--name", $container, "--no-TTY", "ci") }
                   else { @("run", "--rm", "--name", $container, "--no-TTY", "ci") }

        Write-Verbose "docker $($composeArgs -join ' ') $($runArgs -join ' ')"
        & docker @composeArgs @runArgs 2>&1 | Tee-Object -FilePath $log
        $status = $LASTEXITCODE
    }
    finally {
        if (-not ($KeepOnFailure -and $status -ne 0)) { & $cleanup }
    }

    $completedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    $result = if ($status -eq 0) { "passed" } else { "failed" }

    # The stages are read back out of the runner's own output rather than re-listed here. A wrapper
    # that maintains its own copy of the stage list is a wrapper that will one day report a stage
    # that did not run.
    $stages = Select-String -Path $log -Pattern '::ci-stage:: name=([a-z-]+) status=([a-z]+)' -AllMatches |
        ForEach-Object { $_.Matches } |
        ForEach-Object { [ordered]@{ name = $_.Groups[1].Value; status = $_.Groups[2].Value } }

    [ordered]@{
        schemaVersion = "1.0"
        repository    = Split-Path $repoRoot -Leaf
        branch        = $branch
        commit        = $commit
        workingTreeDirty = $dirty
        result        = $result
        environment   = [ordered]@{ runner = "docker"; image = $image; network = "none"; pipeline = "ci/run-checks.sh" }
        startedAt     = $startedAt
        completedAt   = $completedAt
        checks        = @($stages)
    } | ConvertTo-Json -Depth 5 | Set-Content -Path (Join-Path $evidenceDir "latest.json") -Encoding utf8

    Write-Host ""
    if ($status -eq 0) {
        Write-Host "PASS  $branch  $commit  $completedAt"
        Write-Host "Stages: $((@($stages) | ForEach-Object { $_.name }) -join ', ')"
        Write-Host "Evidence: artifacts/local-ci/latest.json"
    }
    else {
        Write-Host "FAIL  $branch  $commit  (exit $status)"
        Write-Host "Log: artifacts/local-ci/last-run.log"
        if ($KeepOnFailure) {
            Write-Host "Container kept for inspection: docker exec -it $container bash   (then: docker rm -f $container)"
        }
    }

    exit $status
}
finally {
    Pop-Location
}
