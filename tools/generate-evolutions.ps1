Add-Type -AssemblyName System.Drawing

$root = Resolve-Path "."
$outDir = Join-Path $root "assets\evolutions"
$previewDir = Join-Path $root "local-output\previews\evolutions"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
New-Item -ItemType Directory -Force -Path $previewDir | Out-Null

function New-Bitmap($size) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bitmap.SetResolution(96, 96)
  return $bitmap
}

function New-Graphics($bitmap) {
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
  return $graphics
}

function Brush($hex) {
  return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($hex))
}

function Pen($hex, $width) {
  return New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml($hex)), $width
}

function Draw-Poly($g, $fill, $outline, [int[][]]$points) {
  $pts = $points | ForEach-Object { New-Object System.Drawing.Point $_[0], $_[1] }
  $g.FillPolygon($fill, $pts)
  $g.DrawPolygon($outline, $pts)
}

function Draw-Base($g, $source, $scale, $offsetY) {
  $size = [int](256 * $scale)
  $x = [int]((256 - $size) / 2)
  $y = [int]((256 - $size) / 2 + $offsetY)
  $g.DrawImage($source, $x, $y, $size, $size)
}

function Draw-Armor($g, $accent, $dark, $kind, $ultimate) {
  $outline = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml("#332b4f")), 5
  $accentBrush = Brush $accent
  $darkBrush = Brush $dark
  $goldBrush = Brush "#ffd35d"
  $cyanBrush = Brush "#4fe8ff"

  if ($kind -eq 0) {
    Draw-Poly $g $accentBrush $outline @(@(96,70),@(118,24),@(136,72),@(116,62))
    Draw-Poly $g $accentBrush $outline @(@(160,70),@(138,24),@(120,72),@(140,62))
    $g.FillEllipse($goldBrush, 108, 166, 40, 24)
    $g.DrawEllipse($outline, 108, 166, 40, 24)
  } elseif ($kind -eq 1) {
    Draw-Poly $g $accentBrush $outline @(@(72,110),@(30,78),@(74,152))
    Draw-Poly $g $accentBrush $outline @(@(184,110),@(226,78),@(182,152))
    $g.FillRectangle($cyanBrush, 110, 58, 36, 18)
    $g.DrawRectangle($outline, 110, 58, 36, 18)
  } elseif ($kind -eq 2) {
    Draw-Poly $g $accentBrush $outline @(@(80,90),@(62,40),@(116,78))
    Draw-Poly $g $accentBrush $outline @(@(176,90),@(194,40),@(140,78))
    $g.FillRectangle($darkBrush, 86, 154, 84, 20)
    $g.DrawRectangle($outline, 86, 154, 84, 20)
  } elseif ($kind -eq 3) {
    Draw-Poly $g $accentBrush $outline @(@(72,132),@(38,106),@(58,174))
    Draw-Poly $g $accentBrush $outline @(@(184,132),@(218,106),@(198,174))
    $g.FillEllipse($goldBrush, 104, 52, 48, 26)
    $g.DrawEllipse($outline, 104, 52, 48, 26)
  } else {
    Draw-Poly $g $accentBrush $outline @(@(92,72),@(82,28),@(122,58))
    Draw-Poly $g $accentBrush $outline @(@(164,72),@(174,28),@(134,58))
    $g.FillEllipse($cyanBrush, 104, 152, 48, 30)
    $g.DrawEllipse($outline, 104, 152, 48, 30)
  }

  if ($ultimate) {
    Draw-Poly $g $darkBrush $outline @(@(46,142),@(10,112),@(42,196),@(74,164))
    Draw-Poly $g $darkBrush $outline @(@(210,142),@(246,112),@(214,196),@(182,164))
    $g.FillEllipse($accentBrush, 88, 62, 30, 18)
    $g.FillEllipse($accentBrush, 138, 62, 30, 18)
    $g.FillRectangle($goldBrush, 94, 184, 68, 18)
    $g.DrawRectangle($outline, 94, 184, 68, 18)
  }
}

$palette = @(
  @{ Accent = "#6be878"; Dark = "#3b7c4f" },
  @{ Accent = "#ff83d2"; Dark = "#6b4de0" },
  @{ Accent = "#54dcff"; Dark = "#4b54c8" },
  @{ Accent = "#d8c197"; Dark = "#75634e" },
  @{ Accent = "#ffe479"; Dark = "#a46bd8" }
)

for ($i = 0; $i -lt 5; $i++) {
  $sourcePath = Join-Path $root ("assets\monsters\monster-{0:D2}.png" -f $i)
  $source = [System.Drawing.Image]::FromFile($sourcePath)
  foreach ($stage in @("rookie", "ultimate")) {
    $ultimate = $stage -eq "ultimate"
    $bitmap = New-Bitmap 256
    $g = New-Graphics $bitmap
    if ($ultimate) {
      Draw-Base $g $source 1.22 -8
      Draw-Armor $g $palette[$i].Accent $palette[$i].Dark $i $true
    } else {
      Draw-Base $g $source 1.08 -2
      Draw-Armor $g $palette[$i].Accent $palette[$i].Dark $i $false
    }
    $out = Join-Path $outDir ("monster-{0:D2}-{1}.png" -f $i, $stage)
    $bitmap.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bitmap.Dispose()
  }
  $source.Dispose()
}

$preview = New-Bitmap 768
$preview.Dispose()
$preview = New-Object System.Drawing.Bitmap 768, 1280, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$preview.SetResolution(96, 96)
$pg = New-Graphics $preview
for ($i = 0; $i -lt 5; $i++) {
  $baby = [System.Drawing.Image]::FromFile((Join-Path $root ("assets\monsters\monster-{0:D2}.png" -f $i)))
  $rookie = [System.Drawing.Image]::FromFile((Join-Path $outDir ("monster-{0:D2}-rookie.png" -f $i)))
  $ultimate = [System.Drawing.Image]::FromFile((Join-Path $outDir ("monster-{0:D2}-ultimate.png" -f $i)))
  $y = $i * 256
  $pg.DrawImage($baby, 0, $y, 256, 256)
  $pg.DrawImage($rookie, 256, $y, 256, 256)
  $pg.DrawImage($ultimate, 512, $y, 256, 256)
  $baby.Dispose()
  $rookie.Dispose()
  $ultimate.Dispose()
}
$preview.Save((Join-Path $previewDir "evolution-preview.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$pg.Dispose()
$preview.Dispose()
