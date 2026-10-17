# 一键安装 dsh-antigravity-direct 到 DSH Desktop 桌面端
# 用法：在 PowerShell 中直接运行 ./install.ps1
$ErrorActionPreference = "Stop"

$pluginDir = $PSScriptRoot
$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE ".dsh" }
$desktopProfile = Join-Path $dshHome "profiles\desktop"
$pluginsDir = Join-Path $dshHome "plugins\dsh-antigravity-direct"
$targetNodeModules = Join-Path $desktopProfile "node_modules\dsh-antigravity-direct"

if (-not (Test-Path $desktopProfile)) {
    Write-Error "未找到 DSH 桌面端配置目录: $desktopProfile"
    exit 1
}

Write-Host ">>> 1. 复制插件到 ~/.dsh/plugins/dsh-antigravity-direct ..."
if (-not (Test-Path $pluginsDir)) { New-Item -ItemType Directory -Path $pluginsDir -Force | Out-Null }
Copy-Item "$pluginDir\index.js" "$pluginsDir\index.js" -Force
Copy-Item "$pluginDir\client.js" "$pluginsDir\client.js" -Force
Copy-Item "$pluginDir\cordis.patch.yml" "$pluginsDir\cordis.patch.yml" -Force
Copy-Item "$pluginDir\package.json" "$pluginsDir\package.json" -Force
Copy-Item "$pluginDir\provider-config-snippet.yml" "$pluginsDir\provider-config-snippet.yml" -Force
Copy-Item "$pluginDir\sanitize-rules.json" "$pluginsDir\sanitize-rules.json" -Force
Copy-Item "$pluginDir\lib" "$pluginsDir" -Recurse -Force

Write-Host ">>> 2. 部署到桌面端 profile 依赖目录 ..."
if (-not (Test-Path $targetNodeModules)) { New-Item -ItemType Directory -Path $targetNodeModules -Force | Out-Null }
Copy-Item "$pluginsDir\*" "$targetNodeModules" -Recurse -Force

Write-Host ">>> 3. 注册插件到 profiles/desktop/package.json ..."
$pkgFile = Join-Path $desktopProfile "package.json"
$pkg = Get-Content $pkgFile -Raw | ConvertFrom-Json

# 添加 dependencies
if (-not $pkg.dependencies."dsh-antigravity-direct") {
    $pkg.dependencies | Add-Member -MemberType NoteProperty -Name "dsh-antigravity-direct" -Value "file:../../plugins/dsh-antigravity-direct" -Force
}

# 添加 bundles
$bundles = [System.Collections.ArrayList]@($pkg.dsh.profile.bundles)
if (-not $bundles.Contains("dsh-antigravity-direct")) {
    $bundles.Add("dsh-antigravity-direct") | Out-Null
    $pkg.dsh.profile.bundles = $bundles
}

$pkg | ConvertTo-Json -Depth 10 | Set-Content $pkgFile -Encoding UTF8

Write-Host "`n✅ 安装成功！请重启 DSH Desktop 桌面端生效。"
Write-Host "若首次使用，请将 provider-config-snippet.yml 内容添加至 profiles/desktop/cordis.patch.yml"
