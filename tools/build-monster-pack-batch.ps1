param(
  [int]$StartIndex = 1,
  [int]$EndIndex = 4,
  [string]$SourceDir = "assets\evolutions",
  [string]$OutRoot = "assets\monster-packs",
  [string]$PreviewRoot = "local-output\previews\monster-packs",
  [int]$FrameSize = 256
)

if ($EndIndex -lt $StartIndex) {
  throw "EndIndex must be greater than or equal to StartIndex."
}

for ($index = $StartIndex; $index -le $EndIndex; $index++) {
  powershell -NoProfile -ExecutionPolicy Bypass -File ".\tools\build-monster-pack.ps1" `
    -MonsterIndex $index `
    -SourceDir $SourceDir `
    -OutRoot $OutRoot `
    -PreviewRoot $PreviewRoot `
    -FrameSize $FrameSize
}
