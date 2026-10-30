# Invoked by the Python checker with an encoded destination; read-only, no secrets.
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$pcStage = 'DESTINATION'
try {
    if ($pcDestination -notmatch '^[A-Za-z]:[\\/]') { throw 'Invalid destination' }
    $pcReport = @{}
    foreach ($pcKind in @('Database', 'Storage')) {
        $pcFolder = Join-Path -Path $pcDestination -ChildPath $pcKind
        $pcStage = 'DIRECTORY'
        $pcDirectory = Get-Item -LiteralPath $pcFolder
        if (-not $pcDirectory.PSIsContainer -or ($pcDirectory.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Invalid directory' }
        if (Test-Path -LiteralPath (Join-Path $pcFolder 'INCOMPLETE.txt')) { throw 'Incomplete backup' }
        $pcStage = 'MANIFEST'
        $pcManifest = Get-Item -LiteralPath (Join-Path $pcFolder 'manifest.json')
        if ($pcManifest.PSIsContainer -or $pcManifest.Length -gt 2097152 -or ($pcManifest.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Invalid manifest' }
        $pcManifestBytes = [IO.File]::ReadAllBytes($pcManifest.FullName)
        $pcFiles = @{}
        $pcStage = 'LIST_FILES'
        foreach ($pcFile in (Get-ChildItem -LiteralPath $pcFolder -File)) {
            $pcStage = 'FILE_METADATA'
            if ($pcFile.Name -eq 'manifest.json') { continue }
            if ($pcFile.Name -notmatch '^(database\.dump|roles\.sql|inventory\.json|object-[0-9]{6})\.gpg$') { throw 'Unexpected file' }
            if ($pcFile.Length -gt 17179869184 -or ($pcFile.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Invalid encrypted file' }
            $pcSize = $pcFile.Length
            $pcModified = $pcFile.LastWriteTimeUtc
            $pcStage = 'FILE_HASH'
            $pcHash = (Get-FileHash -LiteralPath $pcFile.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
            $pcAfter = Get-Item -LiteralPath $pcFile.FullName
            $pcStage = 'FILE_STABILITY'
            if ($pcAfter.Length -ne $pcSize -or $pcAfter.LastWriteTimeUtc -ne $pcModified) { throw 'File changed' }
            $pcFiles[$pcFile.Name] = @{ bytes = $pcSize; sha256 = $pcHash }
        }
        $pcReport[$pcKind] = @{ manifest = [Convert]::ToBase64String($pcManifestBytes); files = $pcFiles }
    }
    $pcReport | ConvertTo-Json -Depth 8 -Compress
} catch {
    # Never print a filename, private path, raw exception or file content.
    @{ error = 'COPY_FILES_NOT_READABLE'; stage = $pcStage; category = $_.Exception.GetType().Name } | ConvertTo-Json -Compress
    exit 1
}
