param(
  [Parameter(Mandatory = $true)]
  [string]$Source,

  [string]$OutDir = "assets\evolutions",
  [int]$MonsterIndex = 0,
  [int]$FrameSize = 256,
  [string]$StageWindows = "",
  [switch]$AutoStageWindows
)

Add-Type -AssemblyName System.Drawing
$script:ChromaMode = "magenta"

function New-TransparentBitmap($width, $height) {
  $bitmap = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bitmap.SetResolution(96, 96)
  return $bitmap
}

function Test-IsMagentaChroma($color) {
  $isMagenta = $color.R -gt 220 -and $color.B -gt 220 -and $color.G -lt 100
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

function Find-ContentBounds($image, $left, $right) {
  $minX = $right
  $minY = $image.Height
  $maxX = $left
  $maxY = 0

  for ($y = 0; $y -lt $image.Height; $y++) {
    for ($x = $left; $x -lt $right; $x++) {
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
    throw "No sprite content found between x=$left and x=$right."
  }

  $padX = [Math]::Max(18, [int](($maxX - $minX) * 0.08))
  $padY = [Math]::Max(18, [int](($maxY - $minY) * 0.08))
  $minX = [Math]::Max($left, $minX - $padX)
  $minY = [Math]::Max(0, $minY - $padY)
  $maxX = [Math]::Min($right - 1, $maxX + $padX)
  $maxY = [Math]::Min($image.Height - 1, $maxY + $padY)

  return New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
}

function Find-AxisSegments($image) {
  $segments = New-Object System.Collections.Generic.List[object]
  $inSegment = $false
  $start = 0

  for ($x = 0; $x -lt $image.Width; $x++) {
    $count = 0
    for ($y = 0; $y -lt $image.Height; $y++) {
      $color = $image.GetPixel($x, $y)
      if ($color.A -gt 20 -and -not (Test-IsChroma $color)) {
        $count++
      }
    }
    $active = $count -gt 8
    if ($active -and -not $inSegment) {
      $start = $x
      $inSegment = $true
    }
    if (-not $active -and $inSegment) {
      $segments.Add(@($start, ($x - 1))) | Out-Null
      $inSegment = $false
    }
  }
  if ($inSegment) {
    $segments.Add(@($start, ($image.Width - 1))) | Out-Null
  }

  return $segments
}

function Convert-SegmentsToWindows($segments, $limit) {
  if ($segments.Count -ne 3) {
    throw "AutoStageWindows expected exactly three content segments, found $($segments.Count)."
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

function Save-FittedFrame($source, $outPath, $targetFill) {
  $frame = New-TransparentBitmap $FrameSize $FrameSize
  $graphics = [System.Drawing.Graphics]::FromImage($frame)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None

  $scale = [Math]::Min(($FrameSize * $targetFill) / $source.Width, ($FrameSize * $targetFill) / $source.Height)
  $drawW = [int]($source.Width * $scale)
  $drawH = [int]($source.Height * $scale)
  $x = [int](($FrameSize - $drawW) / 2)
  $y = [int]($FrameSize - $drawH - 8)

  $graphics.DrawImage($source, $x, $y, $drawW, $drawH)
  $frame.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $graphics.Dispose()
  $frame.Dispose()
}

$sourcePath = Resolve-Path $Source
$resolvedOutDir = Resolve-Path $OutDir -ErrorAction SilentlyContinue
if (-not $resolvedOutDir) {
  New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
  $resolvedOutDir = Resolve-Path $OutDir
}

$image = [System.Drawing.Bitmap]::FromFile($sourcePath.Path)
Set-ChromaModeFromImage $image
$windows = @()
if ($AutoStageWindows) {
  $segments = Find-AxisSegments $image
  if ($segments.Count -ne 3) {
    throw "AutoStageWindows expected exactly three content segments, found $($segments.Count)."
  }
  $cut1 = [int][Math]::Floor(($segments[0][1] + $segments[1][0]) / 2)
  $cut2 = [int][Math]::Floor(($segments[1][1] + $segments[2][0]) / 2)
  $windows += ,@(0, $cut1)
  $windows += ,@($cut1, $cut2)
  $windows += ,@($cut2, $image.Width)
} elseif ($StageWindows.Trim().Length -gt 0) {
  foreach ($window in $StageWindows.Split(";")) {
    $pair = $window.Split(",")
    if ($pair.Count -ne 2) {
      throw "StageWindows must look like '0,480;480,1080;1080,1774'."
    }
    $windows += ,@([int]$pair[0], [int]$pair[1])
  }
  if ($windows.Count -ne 3) {
    throw "StageWindows must provide exactly three windows."
  }
}

$stages = @(
  @{ Name = "baby"; Fill = 0.70 },
  @{ Name = "rookie"; Fill = 0.86 },
  @{ Name = "ultimate"; Fill = 0.94 }
)

for ($i = 0; $i -lt $stages.Count; $i++) {
  if ($windows.Count -eq 3) {
    $left = $windows[$i][0]
    $right = $windows[$i][1]
  } else {
    $left = [int][Math]::Floor($image.Width * $i / $stages.Count)
    $right = [int][Math]::Floor($image.Width * ($i + 1) / $stages.Count)
  }
  $bounds = Find-ContentBounds $image $left $right
  $cropped = Copy-WithoutChroma $image $bounds
  $outPath = Join-Path $resolvedOutDir.Path ("monster-{0:D2}-{1}.png" -f $MonsterIndex, $stages[$i].Name)
  Save-FittedFrame $cropped $outPath $stages[$i].Fill
  $cropped.Dispose()
  Write-Output $outPath
}

$image.Dispose()
