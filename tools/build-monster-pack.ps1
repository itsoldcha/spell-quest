param(
  [int]$MonsterIndex = 0,
  [string]$SourceDir = "assets\evolutions",
  [string]$OutRoot = "assets\monster-packs",
  [string]$PreviewRoot = "local-output\previews\monster-packs",
  [int]$FrameSize = 256
)

Add-Type -AssemblyName System.Drawing

$stages = @("baby", "rookie", "ultimate")
$actions = @("idle-1", "idle-2", "entrance", "hit", "defeat", "capture", "evolution")
$root = Resolve-Path "."
$sourceDirPath = Resolve-Path $SourceDir
$packDir = Join-Path $root ("{0}\monster-{1:D2}" -f $OutRoot, $MonsterIndex)
$previewDir = Join-Path $root ("{0}\monster-{1:D2}" -f $PreviewRoot, $MonsterIndex)
New-Item -ItemType Directory -Force -Path $packDir | Out-Null
New-Item -ItemType Directory -Force -Path $previewDir | Out-Null

function New-Frame() {
  $bitmap = New-Object System.Drawing.Bitmap $FrameSize, $FrameSize, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bitmap.SetResolution(96, 96)
  return $bitmap
}

function New-CanvasGraphics($bitmap) {
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
  return $graphics
}

function SolidBrush($hex, $alpha = 255) {
  $base = [System.Drawing.ColorTranslator]::FromHtml($hex)
  return New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb($alpha, $base.R, $base.G, $base.B))
}

function SolidPen($hex, $width, $alpha = 255) {
  $base = [System.Drawing.ColorTranslator]::FromHtml($hex)
  return New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb($alpha, $base.R, $base.G, $base.B)), $width
}

function Draw-ImageFitted($graphics, $image, $scaleX, $scaleY, $offsetX, $offsetY, $alpha = 1.0, $rotation = 0) {
  $attributes = New-Object System.Drawing.Imaging.ImageAttributes
  if ($alpha -lt 0.999) {
    $matrix = New-Object System.Drawing.Imaging.ColorMatrix
    $matrix.Matrix33 = [single]$alpha
    $attributes.SetColorMatrix($matrix, [System.Drawing.Imaging.ColorMatrixFlag]::Default, [System.Drawing.Imaging.ColorAdjustType]::Bitmap)
  }

  $drawW = [int]($FrameSize * $scaleX)
  $drawH = [int]($FrameSize * $scaleY)
  $x = [int](($FrameSize - $drawW) / 2 + $offsetX)
  $y = [int](($FrameSize - $drawH) / 2 + $offsetY)
  $rect = New-Object System.Drawing.Rectangle $x, $y, $drawW, $drawH

  if ([Math]::Abs($rotation) -gt 0.01) {
    $graphics.TranslateTransform($FrameSize / 2, $FrameSize * 0.72)
    $graphics.RotateTransform($rotation)
    $graphics.TranslateTransform(-$FrameSize / 2, -$FrameSize * 0.72)
  }
  $graphics.DrawImage($image, $rect, 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
  if ([Math]::Abs($rotation) -gt 0.01) {
    $graphics.ResetTransform()
  }
  $attributes.Dispose()
}

function Draw-Star($graphics, $cx, $cy, $size, $color, $alpha = 230) {
  $pen = SolidPen $color 3 $alpha
  $graphics.DrawLine($pen, $cx - $size, $cy, $cx + $size, $cy)
  $graphics.DrawLine($pen, $cx, $cy - $size, $cx, $cy + $size)
  $graphics.DrawLine($pen, $cx - $size * 0.65, $cy - $size * 0.65, $cx + $size * 0.65, $cy + $size * 0.65)
  $graphics.DrawLine($pen, $cx - $size * 0.65, $cy + $size * 0.65, $cx + $size * 0.65, $cy - $size * 0.65)
  $pen.Dispose()
}

function Draw-Ring($graphics, $cx, $cy, $rx, $ry, $color, $width, $alpha = 190) {
  $pen = SolidPen $color $width $alpha
  $graphics.DrawEllipse($pen, $cx - $rx, $cy - $ry, $rx * 2, $ry * 2)
  $pen.Dispose()
}

function Save-ActionFrame($stageDir, $action, $image, $stageIndex) {
  $bitmap = New-Frame
  $graphics = New-CanvasGraphics $bitmap

  if ($action -eq "idle-1") {
    Draw-ImageFitted $graphics $image 1.0 1.0 0 0
  } elseif ($action -eq "idle-2") {
    Draw-ImageFitted $graphics $image 1.025 0.985 0 -3
  } elseif ($action -eq "entrance") {
    $glow = SolidBrush "#b8ff84" 46
    $graphics.FillEllipse($glow, 46, 48, 164, 156)
    $glow.Dispose()
    Draw-Ring $graphics 128 144 76 44 "#92ffb4" 5 150
    Draw-Ring $graphics 128 126 92 58 "#fff0a0" 3 120
    Draw-ImageFitted $graphics $image 0.98 0.98 0 -10
    Draw-Star $graphics 68 82 12 "#fff7a8" 220
    Draw-Star $graphics 196 92 10 "#8dffdc" 200
  } elseif ($action -eq "hit") {
    Draw-ImageFitted $graphics $image 1.0 1.0 -10 6
    $flash = SolidBrush "#fff7c7" 88
    $graphics.FillEllipse($flash, 44, 38, 168, 174)
    $flash.Dispose()
    $spark = SolidPen "#ffec56" 5 230
    $graphics.DrawLine($spark, 54, 66, 78, 92)
    $graphics.DrawLine($spark, 202, 76, 176, 102)
    $graphics.DrawLine($spark, 86, 202, 112, 176)
    $spark.Dispose()
  } elseif ($action -eq "defeat") {
    Draw-ImageFitted $graphics $image 0.96 0.82 5 24 0.58 -12
    $dust = SolidBrush "#d0b080" 90
    $graphics.FillEllipse($dust, 54, 204, 64, 16)
    $graphics.FillEllipse($dust, 130, 212, 74, 15)
    $dust.Dispose()
  } elseif ($action -eq "capture") {
    Draw-Ring $graphics 128 136 86 62 "#6dffbc" 5 170
    Draw-Ring $graphics 128 136 104 76 "#ffe778" 3 130
    Draw-ImageFitted $graphics $image 0.98 0.98 0 -4
    Draw-Star $graphics 58 70 11 "#fff6a6" 230
    Draw-Star $graphics 206 80 12 "#75f8ff" 220
    Draw-Star $graphics 70 196 9 "#b2ff77" 210
  } elseif ($action -eq "evolution") {
    $aura = SolidBrush "#fff6a8" 58
    $graphics.FillEllipse($aura, 28, 18, 200, 216)
    $aura.Dispose()
    Draw-Ring $graphics 128 132 94 72 "#fff06a" 6 210
    Draw-Ring $graphics 128 132 116 88 "#7cffc1" 4 145
    Draw-ImageFitted $graphics $image 1.04 1.04 0 -5
    Draw-Star $graphics 72 56 15 "#fffbe0" 245
    Draw-Star $graphics 198 68 13 "#fff06a" 225
    Draw-Star $graphics 190 204 10 "#92fff0" 210
  }

  $outPath = Join-Path $stageDir "$action.png"
  $bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

$manifest = [ordered]@{
  monsterIndex = $MonsterIndex
  frameSize = $FrameSize
  stages = [ordered]@{}
}

foreach ($stage in $stages) {
  $sourcePath = Join-Path $sourceDirPath.Path ("monster-{0:D2}-{1}.png" -f $MonsterIndex, $stage)
  if ($stage -eq "baby" -and -not (Test-Path $sourcePath)) {
    $sourcePath = Join-Path $root ("assets\monsters\monster-{0:D2}.png" -f $MonsterIndex)
  }
  if (-not (Test-Path $sourcePath)) {
    continue
  }
  $stageDir = Join-Path $packDir $stage
  New-Item -ItemType Directory -Force -Path $stageDir | Out-Null
  $image = [System.Drawing.Image]::FromFile($sourcePath)
  $stageIndex = [Array]::IndexOf($stages, $stage)
  $manifest.stages[$stage] = [ordered]@{}
  foreach ($action in $actions) {
    Save-ActionFrame $stageDir $action $image $stageIndex
    $manifest.stages[$stage][$action] = "$stage/$action.png"
  }
  $image.Dispose()
}

$manifest | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 (Join-Path $packDir "manifest.json")

$preview = New-Object System.Drawing.Bitmap ($FrameSize * $actions.Count), ($FrameSize * $stages.Count), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$preview.SetResolution(96, 96)
$previewGraphics = New-CanvasGraphics $preview
for ($row = 0; $row -lt $stages.Count; $row++) {
  for ($col = 0; $col -lt $actions.Count; $col++) {
    $path = Join-Path $packDir ("{0}\{1}.png" -f $stages[$row], $actions[$col])
    if (Test-Path $path) {
      $img = [System.Drawing.Image]::FromFile($path)
      $previewGraphics.DrawImage($img, $col * $FrameSize, $row * $FrameSize, $FrameSize, $FrameSize)
      $img.Dispose()
    }
  }
}
$previewPath = Join-Path $previewDir "preview.png"
$preview.Save($previewPath, [System.Drawing.Imaging.ImageFormat]::Png)
$previewGraphics.Dispose()
$preview.Dispose()

Write-Output $packDir
Write-Output $previewPath
