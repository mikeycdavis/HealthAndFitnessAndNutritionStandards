<#
.SYNOPSIS
Submit a pull request for a commit that has actually been verified.

.DESCRIPTION
The invariant this script exists to enforce:

    The commit pushed for a PR is exactly the commit that passed the complete local Docker CI
    pipeline.

Which is why HEAD is resolved twice — once before CI and once after — and why the push names the
verified SHA explicitly rather than pushing whatever HEAD happens to be by then. A pipeline that
verifies one tree and pushes another is not a weaker guarantee; it is no guarantee, and it is the
easiest possible thing to build by accident.

It never commits anything, and it never pushes when verification did not pass. Making the pipeline
green is the developer's job; this script's job is to refuse.

.PARAMETER Base
Base branch for the PR. Defaults to the remote's default branch.

.PARAMETER Draft
Create the PR as a draft.

.PARAMETER Title
PR title. Defaults to the subject of the verified commit.

.PARAMETER Body
PR body. The local-CI evidence block is appended to it, never in place of it.

.EXAMPLE
.\ci\submit-pr.ps1
.EXAMPLE
.\ci\submit-pr.ps1 -Draft -Base develop
#>
[CmdletBinding()]
param(
    [string]$Base,
    [switch]$Draft,
    [string]$Title,
    [string]$Body
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Deny([string]$message) {
    Write-Host ""
    Write-Host $message -ForegroundColor Red
    exit 1
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $repoRoot
try {
    # --- 1. a repository, on a branch that may hold a PR ---------------------------------------

    git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -ne 0) { Deny "Not a Git repository. Nothing was pushed and no PR was created." }

    $branch = (git rev-parse --abbrev-ref HEAD).Trim()
    if ($branch -eq "HEAD") { Deny "HEAD is detached. Check out a branch before submitting. Nothing was pushed and no PR was created." }

    if (-not $Base) {
        $remoteHead = (git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>$null)
        $Base = if ($remoteHead) { ($remoteHead -replace '^origin/', '').Trim() } else { "main" }
    }
    if ($branch -eq $Base) {
        Deny "Refusing to open a PR from '$branch' onto itself. The default branch is never a PR source. Nothing was pushed and no PR was created."
    }

    # --- 2. a clean tree, so that "the commit" and "what was tested" are the same thing ----------
    #
    # CI containerises the working tree, not the commit, because a developer running ci.ps1 wants to
    # know about the change in front of them. That is the right behaviour there and the wrong
    # guarantee here: it is only equivalent to verifying the commit when there is nothing
    # uncommitted. So the cleanliness check is not tidiness — it is what makes the CI result
    # transferable to the SHA being pushed.

    if (git status --porcelain) {
        Write-Host "`nThe working tree has uncommitted changes:`n"
        git status --short
        Deny "Refusing to submit: CI verifies the working tree, so an uncommitted change would be verified and never pushed. Commit or stash first. Nothing was pushed and no PR was created."
    }

    # --- 3. the SHA, before ---------------------------------------------------------------------

    $shaBefore = (git rev-parse HEAD).Trim()

    Write-Host "Submitting a verified PR"
    Write-Host "  branch : $branch -> $Base"
    Write-Host "  commit : $shaBefore`n"

    # --- 4. the pipeline ------------------------------------------------------------------------

    $ciCommand = if ($env:LOCAL_CI_COMMAND) { $env:LOCAL_CI_COMMAND } else { Join-Path $PSScriptRoot "ci.ps1" }
    if ($ciCommand -like "*.ps1") { & $ciCommand } else { Invoke-Expression $ciCommand }
    if ($LASTEXITCODE -ne 0) { Deny "CI failed. No branch was pushed and no PR was created." }

    # --- 5. the SHA, after ----------------------------------------------------------------------

    $shaAfter = (git rev-parse HEAD).Trim()
    if ($shaAfter -ne $shaBefore) {
        Write-Host "`n  verified : $shaBefore"
        Write-Host "  current  : $shaAfter"
        Deny "HEAD changed after CI verification. The current commit has not been verified. Re-run CI before submitting. Nothing was pushed and no PR was created."
    }
    if (git status --porcelain) {
        Deny "The working tree became dirty during CI verification. The current state has not been verified. Nothing was pushed and no PR was created."
    }

    # --- 6. the evidence must name this commit --------------------------------------------------
    #
    # The SHA comparison proves HEAD did not move. This proves the run that passed was a run of
    # *this* commit — a stale latest.json from an earlier branch would otherwise satisfy every check
    # above.

    $evidencePath = Join-Path $repoRoot "artifacts/local-ci/latest.json"
    if (-not (Test-Path $evidencePath)) {
        Deny "CI produced no evidence file at artifacts/local-ci/latest.json. Nothing was pushed and no PR was created."
    }
    $evidence = Get-Content $evidencePath -Raw | ConvertFrom-Json

    if ($evidence.result -ne "passed") {
        Deny "The CI evidence does not record a pass (result: $($evidence.result)). Nothing was pushed and no PR was created."
    }
    if ($evidence.commit -ne $shaAfter) {
        Deny "The CI evidence names commit $($evidence.commit), not $shaAfter. That run verified a different commit. Nothing was pushed and no PR was created."
    }

    # --- 7. push exactly what was verified ------------------------------------------------------

    Write-Host "`nPushing the verified commit $shaAfter to origin/$branch"
    git push origin "$($shaAfter):refs/heads/$branch"
    if ($LASTEXITCODE -ne 0) { Deny "The push failed. No PR was created." }
    git branch --set-upstream-to="origin/$branch" $branch *> $null

    # --- 8. the PR ------------------------------------------------------------------------------

    if (-not $Title) { $Title = (git log -1 --pretty=%s).Trim() }
    if (-not $Body) { $Body = (git log -1 --pretty=%b) }

    # The stages the evidence says ran, not the stages the pipeline is configured to run. If those
    # two ever differ, the PR body should show what happened rather than what was intended.
    $stages = (@($evidence.checks) | ForEach-Object { $_.name }) -join ", "

    $bodyFile = New-TemporaryFile
    @(
        $Body
        ""
        "---"
        ""
        "## Local CI"
        ""
        "| | |"
        "|---|---|"
        "| Verified commit | ``$shaAfter`` |"
        "| Result | **PASS** |"
        "| Environment | Docker, no network, ``ci/run-checks.sh`` |"
        "| Stages | $stages |"
        "| Completed | $($evidence.completedAt) |"
        ""
        "Verified locally in an ephemeral Docker container, not by a GitHub-hosted Actions run."
        "This says nothing about whether GitHub Actions has run or passed for this commit."
    ) | Set-Content -Path $bodyFile -Encoding utf8

    # GH_COMMAND is a seam, like LOCAL_CI_COMMAND: it lets PR creation be asserted without
    # contacting GitHub. A submission workflow whose refusals are untested is a workflow that will
    # be trusted to refuse and won't.
    $gh = if ($env:GH_COMMAND) { $env:GH_COMMAND } else { "gh" }

    try {
        if (-not (Get-Command $gh -ErrorAction SilentlyContinue)) {
            Write-Host "`nThe verified commit was pushed. GitHub CLI is not installed, so no PR was created."
            Write-Host "Open one manually and paste the block below:`n"
            Get-Content $bodyFile
            exit 0
        }
        & $gh auth status *> $null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`nThe verified commit was pushed. GitHub CLI is not authenticated (gh auth login), so no PR was created."
            exit 0
        }

        $ghArgs = @("pr", "create", "--base", $Base, "--head", $branch, "--title", $Title, "--body-file", $bodyFile)
        if ($Draft) { $ghArgs += "--draft" }
        & $gh @ghArgs
        if ($LASTEXITCODE -ne 0) { Deny "The verified commit was pushed, but `gh pr create` failed." }

        Write-Host "`nPASS  $shaAfter  verified and submitted."
    }
    finally {
        Remove-Item $bodyFile -Force -ErrorAction SilentlyContinue
    }
}
finally {
    Pop-Location
}
