param(
  [Parameter(Mandatory = $true)]
  [string]$Source,

  [int]$MonsterIndex = 0,
  [string]$PackRoot = "assets\monster-packs",
  [string]$PreviewRoot = "local-output\previews\monster-packs",
  [int]$FrameSize = 256,
  [string]$RowWindows = "",
  [string]$Actions = "entrance,hit,defeat",
  [switch]$AutoRowWindows
)

Add-Type -AssemblyName System.Drawing

$stages = @(
  @{ Name = "baby"; Fill = 0.72 },
  @{ Name = "rookie"; Fill = 0.88 },
  @{ Name = "ultimate"; Fill = 0.96 }
)
[string[]]$actions = @($Actions -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_.Length -gt 0 })
if ($actions.Count -lt 1) {
  throw "Actions must provide at least one action name."
}
$previewActions = @("idle-1", "idle-2", "entrance", "hit", "defeat", "capture", "evolution")
$script:ChromaMode = "magenta"

function New-TransparentBitmap($width, $height) {
  $bitmap = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
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

function Test-IsMagentaChroma($color) {
  $isMagenta = $color.R -gt 205 -and $color.B -gt 205 -and $color.G -lt 110
  $isPinkFringe = $color.R -gt 220 -and $color.B -gt 190 -and $color.G -lt 155 -and ([Math]::Abs($color.R - $color.B) -lt 95)
  return $isMagenta -or $isPinkFringe
}

function Test-IsGreenChroma($color) {
  return $color.G -gt 120 -and $color.G -gt ($color.R * 1.28) -and $color.G -gt ($color.B * 1.28)
}

function Test-IsChroma($color) {
  if ($script:ChromaMode -eq "green") {
    return Test-IsGreenChroma $color
  }
  return Test-IsMagentaChroma $color
}

function Set-ChromaModeFromImage($image) {
  $magenta = 0
  $green = 0
  $step = [Math]::Max(1, [int][Math]::Floor([Math]::Min($image.Width, $image.Height) / 80))
  for ($x = 0; $x -lt $image.Width; $x += $step) {
    foreach ($y in @(0, ($image.Height - 1))) {
      $color = $image.GetPixel($x, $y)
      if (Test-IsMagentaChroma $color) { $magenta++ }
      if (Test-IsGreenChroma $color) { $green++ }
    }
  }
  for ($y = 0; $y -lt $image.Height; $y += $step) {
    foreach ($x in @(0, ($image.Width - 1))) {
      $color = $image.GetPixel($x, $y)
      if (Test-IsMagentaChroma $color) { $magenta++ }
      if (Test-IsGreenChroma $color) { $green++ }
    }
  }
  $script:ChromaMode = if ($green -gt $magenta) { "green" } else { "magenta" }
}

function Find-ContentBounds($image, $cellRect) {
  $minX = $cellRect.Right
  $minY = $cellRect.Bottom
  $maxX = $cellRect.Left
  $maxY = $cellRect.Top

  for ($y = $cellRect.Top; $y -lt $cellRect.Bottom; $y++) {
    for ($x = $cellRect.Left; $x -lt $cellRect.Right; $x++) {
      $color = $image.GetPixel($x, $y)
      if ($color.A -gt 20 -and -not (Test-IsChroma $color)) {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -le $minX -or $maxY -le $minY) {
    throw "No sprite content found in cell $cellRect."
  }

  $padX = [Math]::Max(16, [int](($maxX - $minX) * 0.08))
  $padY = [Math]::Max(16, [int](($maxY - $minY) * 0.08))
  $minX = [Math]::Max($cellRect.Left, $minX - $padX)
  $minY = [Math]::Max($cellRect.Top, $minY - $padY)
  $maxX = [Math]::Min($cellRect.Right - 1, $maxX + $padX)
  $maxY = [Math]::Min($cellRect.Bottom - 1, $maxY + $padY)

  return New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
}

function Find-RowSegments($image) {
  $segments = New-Object System.Collections.Generic.List[object]
  $inSegment = $false
  $start = 0

  for ($y = 0; $y -lt $image.Height; $y++) {
    $count = 0
    for ($x = 0; $x -lt $image.Width; $x++) {
      $color = $image.GetPixel($x, $y)
      if ($color.A -gt 20 -and -not (Test-IsChroma $color)) {
        $count++
      }
    }
    $active = $count -gt 8
    if ($active -and -not $inSegment) {
      $start = $y
      $inSegment = $true
    }
    if (-not $active -and $inSegment) {
      $segments.Add(@($start, ($y - 1))) | Out-Null
      $inSegment = $false
    }
  }
  if ($inSegment) {
    $segments.Add(@($start, ($image.Height - 1))) | Out-Null
  }

  return $segments
}

function Convert-RowSegmentsToWindows($segments, $limit) {
  if ($segments.Count -ne 3) {
    throw "AutoRowWindows expected exactly three content segments, found $($segments.Count)."
  }
  $cut1 = [int][Math]::Floor(($segments[0][1] + $segments[1][0]) / 2)
  $cut2 = [int][Math]::Floor(($segments[1][1] + $segments[2][0]) / 2)
  return @(
    ,@(0, $cut1),
    ,@($cut1, $cut2),
    ,@($cut2, $limit)
  )
}

function Copy-WithoutChroma($source, $bounds) {
  $cropped = New-TransparentBitmap $bounds.Width $bounds.Height
  for ($y = 0; $y -lt $bounds.Height; $y++) {
    for ($x = 0; $x -lt $bounds.Width; $x++) {
      $color = $source.GetPixel(($bounds.Left + $x), ($bounds.Top + $y))
      if (Test-IsChroma $color) {
        $cropped.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
      } else {
        $cropped.SetPixel($x, $y, $color)
      }
    }
  }
  return $cropped
}

function Save-FittedFrame($source, $outPath, $scale, $action) {
  $frame = New-TransparentBitmap $FrameSize $FrameSize
  $graphics = New-CanvasGraphics $frame

  $drawW = [int]($source.Width * $scale)
  $drawH = [int]($source.Height * $scale)
  $topSafe = if ($action -eq "entrance") { 18 } elseif ($action -eq "hit") { 12 } else { 10 }
  $bottomSafe = if ($action -eq "defeat") { 14 } else { 8 }

  if ($drawH -gt ($FrameSize - $topSafe - $bottomSafe)) {
    $scale = ($FrameSize - $topSafe - $bottomSafe) / $source.Height
    $drawW = [int]($source.Width * $scale)
    $drawH = [int]($source.Height * $scale)
  }

  $x = [int](($FrameSize - $drawW) / 2)
  $y = [Math]::Max($topSafe, [int]($FrameSize - $drawH - $bottomSafe))

  $graphics.DrawImage($source, $x, $y, $drawW, $drawH)
  $frame.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $graphics.Dispose()
  $frame.Dispose()
}

function Render-PackPreview($packDir, $outPath) {
  $preview = New-Object System.Drawing.Bitmap ($FrameSize * $previewActions.Count), ($FrameSize * $stages.Count), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $preview.SetResolution(96, 96)
  $graphics = New-CanvasGraphics $preview

  for ($row = 0; $row -lt $stages.Count; $row++) {
    for ($col = 0; $col -lt $previewActions.Count; $col++) {
      $path = Join-Path $packDir ("{0}\{1}.png" -f $stages[$row].Name, $previewActions[$col])
      if (Test-Path $path) {
        $img = [System.Drawing.Image]::FromFile($path)
        $graphics.DrawImage($img, $col * $FrameSize, $row * $FrameSize, $FrameSize, $FrameSize)
        $img.Dispose()
      }
    }
  }

  $preview.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $preview.Dispose()
}

$sourcePath = Resolve-Path $Source
$packDir = Join-Path (Resolve-Path ".").Path ("{0}\monster-{1:D2}" -f $PackRoot, $MonsterIndex)
$previewDir = Join-Path (Resolve-Path ".").Path ("{0}\monster-{1:D2}" -f $PreviewRoot, $MonsterIndex)
if (-not (Test-Path $packDir)) {
  throw "Monster pack not found: $packDir"
}
New-Item -ItemType Directory -Force -Path $previewDir | Out-Null
$previewPath = Join-Path $previewDir "preview.png"

$image = [System.Drawing.Bitmap]::FromFile($sourcePath.Path)
Set-ChromaModeFromImage $image
$cellWidth = [int][Math]::Floor($image.Width / $actions.Count)
$cellHeight = [int][Math]::Floor($image.Height / 3)
$rowWindowsParsed = @()
if ($AutoRowWindows) {
  $segments = Find-RowSegments $image
  if ($segments.Count -ne 3) {
    throw "AutoRowWindows expected exactly three content segments, found $($segments.Count)."
  }
  $cut1 = [int][Math]::Floor(($segments[0][1] + $segments[1][0]) / 2)
  $cut2 = [int][Math]::Floor(($segments[1][1] + $segments[2][0]) / 2)
  $rowWindowsParsed += ,@(0, $cut1)
  $rowWindowsParsed += ,@($cut1, $cut2)
  $rowWindowsParsed += ,@($cut2, $image.Height)
} elseif ($RowWindows.Trim().Length -gt 0) {
  foreach ($window in $RowWindows.Split(";")) {
    $pair = $window.Split(",")
    if ($pair.Count -ne 2) {
      throw "RowWindows must look like '0,405;405,770;770,1254'."
    }
    $top = [int]$pair[0]
    $bottom = [int]$pair[1]
    if ($top -lt 0 -or $bottom -le $top) {
      throw "Invalid RowWindows entry '$window'."
    }
    $rowWindowsParsed += ,@($top, $bottom)
  }
  if ($rowWindowsParsed.Count -ne 3) {
    throw "RowWindows must provide exactly three row windows."
  }
}
$rowFrames = @{}

for ($row = 0; $row -lt $stages.Count; $row++) {
  $stageName = $stages[$row].Name
  $stageDir = Join-Path $packDir $stageName
  New-Item -ItemType Directory -Force -Path $stageDir | Out-Null
  $rowFrames[$stageName] = @()

  for ($col = 0; $col -lt $actions.Count; $col++) {
    $left = $col * $cellWidth
    $top = if ($rowWindowsParsed.Count -eq 3) { $rowWindowsParsed[$row][0] } else { $row * $cellHeight }
    $right = if ($col -eq ($actions.Count - 1)) { $image.Width } else { ($col + 1) * $cellWidth }
    $bottom = if ($rowWindowsParsed.Count -eq 3) { $rowWindowsParsed[$row][1] } elseif ($row -eq 2) { $image.Height } else { ($row + 1) * $cellHeight }
    if ($top -lt 0 -or $bottom -gt $image.Height -or $bottom -le $top) {
      throw "Row window $row ($top,$bottom) is outside source height $($image.Height)."
    }
    $cell = New-Object System.Drawing.Rectangle $left, $top, ($right - $left), ($bottom - $top)
    $bounds = Find-ContentBounds $image $cell
    $cropped = Copy-WithoutChroma $image $bounds
    $rowFrames[$stageName] += ,@{
      Action = $actions[$col]
      Image = $cropped
    }
  }

  $maxW = ($rowFrames[$stageName] | ForEach-Object { $_.Image.Width } | Measure-Object -Maximum).Maximum
  $maxH = ($rowFrames[$stageName] | ForEach-Object { $_.Image.Height } | Measure-Object -Maximum).Maximum
  $scale = [Math]::Min(($FrameSize * $stages[$row].Fill) / $maxW, ($FrameSize * $stages[$row].Fill) / $maxH)

  foreach ($frame in $rowFrames[$stageName]) {
    $outPath = Join-Path $stageDir ("{0}.png" -f $frame.Action)
    Save-FittedFrame $frame.Image $outPath $scale $frame.Action
    $frame.Image.Dispose()
    Write-Output $outPath
  }
}

$image.Dispose()
Render-PackPreview $packDir $previewPath
Write-Output $previewPath
