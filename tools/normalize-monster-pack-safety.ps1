param(
  [int]$StartIndex = 2,
  [int]$EndIndex = 9,
  [string]$PackRoot = "assets\monster-packs",
  [string]$EvolutionRoot = "assets\evolutions",
  [string]$PreviewRoot = "local-output\previews\monster-packs",
  [string]$DiagnosticRoot = "local-output\diagnostics\monster-packs",
  [string]$BackupRoot = "local-output\backups\monster-packs",
  [string]$ReportPath = "local-output\diagnostics\safety-normalize-report.json",
  [int]$FrameSize = 256,
  [int]$SideMargin = 16,
  [int]$TopMargin = 18,
  [int]$BottomMargin = 14,
  [switch]$Backup
)

Add-Type -AssemblyName System.Drawing

$stages = @("baby", "rookie", "ultimate")
$actions = @("idle-1", "idle-2", "entrance", "hit", "defeat", "capture", "evolution")

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

function Find-ContentBounds($image) {
  $minX = $image.Width
  $minY = $image.Height
  $maxX = -1
  $maxY = -1

  for ($y = 0; $y -lt $image.Height; $y++) {
    for ($x = 0; $x -lt $image.Width; $x++) {
      $color = $image.GetPixel($x, $y)
      if ($color.A -gt 20) {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -lt $minX -or $maxY -lt $minY) {
    return $null
  }

  return New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
}

function Test-IsChromaResidue($color) {
  $isMagenta = $color.R -gt 190 -and $color.B -gt 190 -and $color.G -lt 145
  $isPinkFringe = $color.R -gt 210 -and $color.B -gt 165 -and $color.G -lt 165 -and ([Math]::Abs($color.R - $color.B) -lt 95)
  return $isMagenta -or $isPinkFringe
}

function Remove-ChromaResidue($image) {
  $removed = 0
  for ($y = 0; $y -lt $image.Height; $y++) {
    for ($x = 0; $x -lt $image.Width; $x++) {
      $color = $image.GetPixel($x, $y)
      if ($color.A -gt 0 -and (Test-IsChromaResidue $color)) {
        $image.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        $removed++
      }
    }
  }
  return $removed
}

function Copy-Content($source, $bounds) {
  $cropped = New-TransparentBitmap $bounds.Width $bounds.Height
  $graphics = New-CanvasGraphics $cropped
  $graphics.DrawImage($source, 0, 0, $bounds, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.Dispose()
  return $cropped
}

function Remove-EdgeArtifacts($image, $pathOrAction) {
  $width = $image.Width
  $height = $image.Height
  $visited = New-Object 'bool[,]' $width, $height
  $components = New-Object System.Collections.Generic.List[object]
  $queue = New-Object System.Collections.Generic.Queue[object]

  for ($startY = 0; $startY -lt $height; $startY++) {
    for ($startX = 0; $startX -lt $width; $startX++) {
      if ($visited[$startX, $startY]) {
        continue
      }
      $visited[$startX, $startY] = $true
      if ($image.GetPixel($startX, $startY).A -le 20) {
        continue
      }

      $pixels = New-Object System.Collections.Generic.List[object]
      $minX = $startX
      $maxX = $startX
      $minY = $startY
      $maxY = $startY
      $queue.Enqueue(@($startX, $startY))

      while ($queue.Count -gt 0) {
        $point = $queue.Dequeue()
        $x = [int]$point[0]
        $y = [int]$point[1]
        $pixels.Add(@($x, $y)) | Out-Null
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }

        foreach ($delta in @(@(-1, 0), @(1, 0), @(0, -1), @(0, 1))) {
          $nx = $x + [int]$delta[0]
          $ny = $y + [int]$delta[1]
          if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $width -or $ny -ge $height) {
            continue
          }
          if ($visited[$nx, $ny]) {
            continue
          }
          $visited[$nx, $ny] = $true
          if ($image.GetPixel($nx, $ny).A -gt 20) {
            $queue.Enqueue(@($nx, $ny))
          }
        }
      }

      $components.Add([pscustomobject]@{
        pixels = $pixels
        count = $pixels.Count
        minX = $minX
        maxX = $maxX
        minY = $minY
        maxY = $maxY
      }) | Out-Null
    }
  }

  if ($components.Count -le 1) {
    return 0
  }

  $main = $components | Sort-Object -Property count -Descending | Select-Object -First 1
  $largest = $main.count
  $actionName = [System.IO.Path]::GetFileNameWithoutExtension([string]$pathOrAction)
  $mainPad = if ($actionName -like "idle-*") { 4 } else { 18 }
  $removed = 0
  foreach ($component in $components) {
    $touchesSide = $component.minX -le 1 -or $component.maxX -ge ($width - 2)
    $isMainBody = $component.count -eq $largest
    $isLikelySliver = $component.count -lt ($largest * 0.45)
    $isSeparatedFromMain = $component.minX -gt ($main.maxX + $mainPad) -or $component.maxX -lt ($main.minX - $mainPad)
    $strictIdleArtifact = ($actionName -like "idle-*") -and $isSeparatedFromMain -and ($component.count -lt ($largest * 0.2))
    $sideArtifact = $touchesSide -and ($component.count -lt ($largest * 0.08))
    $canCullSmallFarArtifact = $actionName -notlike "idle-*" -and $actionName -notin @("capture", "evolution")
    $smallFarActionArtifact = $canCullSmallFarArtifact -and $isSeparatedFromMain -and ($component.count -lt ($largest * 0.04))
    $isVerticallySeparatedFromMain = $component.minY -gt ($main.maxY + 8) -or $component.maxY -lt ($main.minY - 12)
    $smallFarVerticalArtifact = $canCullSmallFarArtifact -and $isVerticallySeparatedFromMain -and ($component.count -lt ($largest * 0.04))
    if (-not $isMainBody -and ($strictIdleArtifact -or $sideArtifact -or $smallFarActionArtifact -or $smallFarVerticalArtifact)) {
      foreach ($pixel in $component.pixels) {
        $image.SetPixel([int]$pixel[0], [int]$pixel[1], [System.Drawing.Color]::Transparent)
      }
      $removed += $component.count
    }
  }
  return $removed
}

function Get-SafeMargins($pathOrAction) {
  $name = [System.IO.Path]::GetFileNameWithoutExtension([string]$pathOrAction)
  if ($name -eq "capture" -or $name -eq "evolution") {
    return @{
      side = $SideMargin
      top = [Math]::Min($TopMargin, 16)
      bottom = $BottomMargin
    }
  }
  return @{
    side = $SideMargin
    top = $TopMargin
    bottom = $BottomMargin
  }
}

function Save-SafeFrame($path) {
  $image = [System.Drawing.Bitmap]::FromFile($path)
  $removedChromaPixels = Remove-ChromaResidue $image
  $removedEdgePixels = Remove-EdgeArtifacts $image $path
  $bounds = Find-ContentBounds $image
  if ($null -eq $bounds) {
    $image.Dispose()
    return $null
  }

  $before = @{
    left = $bounds.Left
    top = $bounds.Top
    right = $FrameSize - $bounds.Right
    bottom = $FrameSize - $bounds.Bottom
    width = $bounds.Width
    height = $bounds.Height
  }

  $content = Copy-Content $image $bounds
  $image.Dispose()

  $margins = Get-SafeMargins $path
  $maxDrawW = $FrameSize - ($margins.side * 2)
  $maxDrawH = $FrameSize - $margins.top - $margins.bottom
  $scale = [Math]::Min(1.0, [Math]::Min($maxDrawW / [double]$content.Width, $maxDrawH / [double]$content.Height))
  $drawW = [Math]::Max(1, [int][Math]::Floor($content.Width * $scale))
  $drawH = [Math]::Max(1, [int][Math]::Floor($content.Height * $scale))
  $x = [int][Math]::Floor(($FrameSize - $drawW) / 2)
  $y = [int]($FrameSize - $margins.bottom - $drawH)
  if ($y -lt $margins.top) {
    $y = $margins.top
  }

  $frame = New-TransparentBitmap $FrameSize $FrameSize
  $graphics = New-CanvasGraphics $frame
  $graphics.DrawImage($content, $x, $y, $drawW, $drawH)
  $content.Dispose()

  $frame.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $frame.Dispose()

  return @{
    path = [string]$path
    before = $before
    after = @{
      left = $x
      top = $y
      right = $FrameSize - ($x + $drawW)
      bottom = $FrameSize - ($y + $drawH)
      width = $drawW
      height = $drawH
      scale = [Math]::Round($scale, 4)
    }
    removedEdgePixels = $removedEdgePixels
    removedChromaPixels = $removedChromaPixels
  }
}

function Render-Diagnostic($monsterIndex, $packDir, $outPath) {
  $cell = $FrameSize
  $labelH = 26
  $cols = $actions.Count
  $rows = $stages.Count
  $preview = New-Object System.Drawing.Bitmap ($cell * $cols), (($cell + $labelH) * $rows), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $preview.SetResolution(96, 96)
  $graphics = [System.Drawing.Graphics]::FromImage($preview)
  $graphics.Clear([System.Drawing.Color]::FromArgb(34, 30, 26))
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None

  $font = New-Object System.Drawing.Font("Arial", 12, [System.Drawing.FontStyle]::Bold)
  $white = [System.Drawing.Brushes]::White
  $safePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(210, 84, 255, 128)), 2
  $boundsPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(210, 255, 80, 80)), 2

  for ($row = 0; $row -lt $stages.Count; $row++) {
    for ($col = 0; $col -lt $actions.Count; $col++) {
      $x = $col * $cell
      $y = $row * ($cell + $labelH)
      $graphics.DrawString(("{0} {1}" -f $stages[$row], $actions[$col]), $font, $white, $x + 6, $y + 5)
      $path = Join-Path $packDir ("{0}\{1}.png" -f $stages[$row], $actions[$col])
      if (Test-Path -LiteralPath $path) {
        $img = [System.Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $path))
        $graphics.DrawImage($img, $x, $y + $labelH, $cell, $cell)
        $bounds = Find-ContentBounds $img
        if ($null -ne $bounds) {
          $graphics.DrawRectangle($boundsPen, $x + $bounds.Left, $y + $labelH + $bounds.Top, $bounds.Width, $bounds.Height)
        }
        $img.Dispose()
      }
      $margins = Get-SafeMargins $actions[$col]
      $graphics.DrawRectangle($safePen, $x + $margins.side, $y + $labelH + $margins.top, $FrameSize - ($margins.side * 2), $FrameSize - $margins.top - $margins.bottom)
    }
  }

  $preview.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $preview.Dispose()
  $font.Dispose()
  $safePen.Dispose()
  $boundsPen.Dispose()
}

function Render-PackPreview($packDir, $outPath) {
  $preview = New-Object System.Drawing.Bitmap ($FrameSize * $actions.Count), ($FrameSize * $stages.Count), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $preview.SetResolution(96, 96)
  $graphics = New-CanvasGraphics $preview

  for ($row = 0; $row -lt $stages.Count; $row++) {
    for ($col = 0; $col -lt $actions.Count; $col++) {
      $path = Join-Path $packDir ("{0}\{1}.png" -f $stages[$row], $actions[$col])
      if (Test-Path -LiteralPath $path) {
        $img = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $path))
        $graphics.DrawImage($img, $col * $FrameSize, $row * $FrameSize, $FrameSize, $FrameSize)
        $img.Dispose()
      }
    }
  }

  $preview.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $preview.Dispose()
}

$results = New-Object System.Collections.Generic.List[object]

for ($monsterIndex = $StartIndex; $monsterIndex -le $EndIndex; $monsterIndex++) {
  $monsterId = "monster-{0:D2}" -f $monsterIndex
  $packDir = Join-Path $PackRoot $monsterId
  $previewDir = Join-Path $PreviewRoot $monsterId
  $diagnosticDir = Join-Path $DiagnosticRoot $monsterId
  if (-not (Test-Path -LiteralPath $packDir)) {
    Write-Warning "Pack not found: $packDir"
    continue
  }

  New-Item -ItemType Directory -Force -Path $previewDir | Out-Null
  New-Item -ItemType Directory -Force -Path $diagnosticDir | Out-Null

  if ($Backup) {
    $backupDir = Join-Path (Join-Path $BackupRoot $monsterId) ("safety-backup-{0:yyyyMMdd-HHmmss}" -f (Get-Date))
    New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
    foreach ($stage in $stages) {
      $srcStageDir = Join-Path $packDir $stage
      if (Test-Path -LiteralPath $srcStageDir) {
        Copy-Item -LiteralPath $srcStageDir -Destination (Join-Path $backupDir $stage) -Recurse
      }
    }
  }

  foreach ($stage in $stages) {
    foreach ($action in $actions) {
      $path = Join-Path $packDir ("{0}\{1}.png" -f $stage, $action)
      if (Test-Path -LiteralPath $path) {
        $result = Save-SafeFrame (Resolve-Path -LiteralPath $path)
        if ($null -ne $result) {
          $results.Add($result) | Out-Null
        }
      }
    }
  }

  foreach ($stage in $stages) {
    $path = Join-Path $EvolutionRoot ("{0}-{1}.png" -f $monsterId, $stage)
    if (Test-Path -LiteralPath $path) {
      $result = Save-SafeFrame (Resolve-Path -LiteralPath $path)
      if ($null -ne $result) {
        $results.Add($result) | Out-Null
      }
    }
  }

  Render-PackPreview $packDir (Join-Path $previewDir "preview.png")
  Render-Diagnostic $monsterIndex $packDir (Join-Path $diagnosticDir "safety-diagnostic.png")
  Write-Output ("Normalized {0}" -f $monsterId)
}

$reportDir = Split-Path -Parent $ReportPath
if ($reportDir) {
  New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
}
$results | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReportPath -Encoding UTF8
Write-Output $ReportPath
