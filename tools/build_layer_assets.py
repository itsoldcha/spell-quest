from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "art-source" / "layers"
LAYER_DIR = ROOT / "assets" / "layers"
PREVIEW_DIR = ROOT / "local-output" / "previews" / "layers"
CANVAS_SIZE = (1672, 941)


def save_png(image: Image.Image, name: str) -> Path:
    out = LAYER_DIR / name
    image.save(out, "PNG", optimize=True)
    return out


def save_preview(image: Image.Image, name: str) -> Path:
    out = PREVIEW_DIR / name
    image.save(out, "PNG", optimize=True)
    return out


def resize_cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    src_w, src_h = image.size
    dst_w, dst_h = size
    scale = max(dst_w / src_w, dst_h / src_h)
    new_size = (round(src_w * scale), round(src_h * scale))
    resized = image.resize(new_size, Image.Resampling.LANCZOS)
    left = (new_size[0] - dst_w) // 2
    top = (new_size[1] - dst_h) // 2
    return resized.crop((left, top, left + dst_w, top + dst_h))


def remove_magenta_key(path: Path, edge_contract: int = 1) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            is_key = r > 185 and b > 185 and g < 125
            if is_key:
                pixels[x, y] = (r, g, b, 0)

    alpha = image.getchannel("A")
    if edge_contract:
        alpha = alpha.filter(ImageFilter.MinFilter(edge_contract * 2 + 1))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.35))
    image.putalpha(alpha)

    bbox = image.getbbox()
    if not bbox:
        return image

    pad = 28
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(width, bbox[2] + pad)
    bottom = min(height, bbox[3] + pad)
    return image.crop((left, top, right, bottom))


def fit_width(image: Image.Image, target_width: int) -> Image.Image:
    scale = target_width / image.width
    target_size = (target_width, round(image.height * scale))
    return image.resize(target_size, Image.Resampling.LANCZOS)


def make_cloud_layer(size: tuple[int, int], near: bool) -> Image.Image:
    width, height = size
    low = Image.new("RGBA", (width // 2, height // 2), (0, 0, 0, 0))
    draw = ImageDraw.Draw(low, "RGBA")
    palette = [
        (255, 244, 220, 92 if near else 78),
        (255, 205, 246, 76 if near else 58),
        (255, 232, 198, 72 if near else 54),
        (176, 216, 255, 48 if near else 36),
    ]
    specs = [
        (20, 42, 118, 34),
        (172, 22, 170, 50),
        (390, 58, 150, 34),
        (620, 28, 190, 52),
        (832, 70, 130, 34),
    ]
    offset = 42 if near else 0
    for index, (x, y, w, h) in enumerate(specs):
        x = (x + offset) % low.width
        color = palette[index % len(palette)]
        draw.ellipse((x, y, x + w, y + h), fill=color)
        draw.ellipse((x + w * 0.22, y - h * 0.32, x + w * 0.72, y + h * 0.56), fill=color)
        draw.rectangle((x + w * 0.12, y + h * 0.36, x + w * 0.92, y + h * 0.78), fill=color)

    return low.resize(size, Image.Resampling.NEAREST)


def make_haze_layer(size: tuple[int, int]) -> Image.Image:
    width, height = size
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    horizon_y = round(height * 0.45)
    for radius, alpha in [(520, 32), (360, 44), (220, 36)]:
        draw.ellipse(
            (
                width // 2 - radius,
                horizon_y - radius // 5,
                width // 2 + radius,
                horizon_y + radius // 3,
            ),
            fill=(255, 218, 154, alpha),
        )
    draw.arc(
        (width // 2 - 420, horizon_y - 150, width // 2 + 420, horizon_y + 250),
        start=196,
        end=344,
        fill=(255, 126, 202, 92),
        width=8,
    )
    draw.arc(
        (width // 2 - 440, horizon_y - 156, width // 2 + 440, horizon_y + 260),
        start=196,
        end=344,
        fill=(109, 207, 255, 70),
        width=5,
    )
    return image.filter(ImageFilter.GaussianBlur(1.2))


def make_muzzle_sheet() -> Image.Image:
    frame_w, frame_h = 256, 256
    sheet = Image.new("RGBA", (frame_w * 5, frame_h), (0, 0, 0, 0))
    for i in range(5):
        frame = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame, "RGBA")
        cx, cy = frame_w // 2, frame_h // 2
        scale = 0.46 + i * 0.18
        alpha = max(0, 230 - i * 42)
        points = []
        for n in range(16):
            radius = (92 if n % 2 == 0 else 34) * scale
            angle = -1.5708 + n * 3.14159 / 8
            points.append((cx + radius * __import__("math").cos(angle), cy + radius * __import__("math").sin(angle)))
        draw.polygon(points, fill=(255, 232, 64, alpha))
        draw.ellipse((cx - 46 * scale, cy - 46 * scale, cx + 46 * scale, cy + 46 * scale), fill=(255, 255, 255, alpha))
        draw.ellipse((cx - 78 * scale, cy - 78 * scale, cx + 78 * scale, cy + 78 * scale), outline=(255, 130, 31, alpha), width=8)
        sheet.alpha_composite(frame, (i * frame_w, 0))
    return sheet


def make_projectile_sheet() -> Image.Image:
    frame_w, frame_h = 192, 96
    sheet = Image.new("RGBA", (frame_w * 4, frame_h), (0, 0, 0, 0))
    for i in range(4):
        frame = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(frame, "RGBA")
        x = 26 + i * 8
        draw.rounded_rectangle((x, 34, x + 118, 62), radius=14, fill=(255, 219, 51, 210))
        draw.rounded_rectangle((x + 20, 40, x + 138, 56), radius=8, fill=(255, 255, 255, 230))
        draw.polygon([(x + 126, 28), (x + 178, 48), (x + 126, 68)], fill=(255, 139, 36, 188))
        draw.line((x - 22, 48, x + 30, 48), fill=(86, 218, 255, 168), width=8)
        sheet.alpha_composite(frame, (i * frame_w, 0))
    return sheet


def make_preview(bg: Image.Image, left: Image.Image, right: Image.Image, clouds: Image.Image, haze: Image.Image) -> Image.Image:
    preview = bg.convert("RGBA")
    preview.alpha_composite(clouds, (0, 0))
    preview.alpha_composite(haze, (0, 0))
    left_fit = fit_width(left, 520)
    right_fit = fit_width(right, 520)
    preview.alpha_composite(left_fit, (-30, CANVAS_SIZE[1] - left_fit.height + 18))
    preview.alpha_composite(right_fit, (CANVAS_SIZE[0] - right_fit.width + 30, CANVAS_SIZE[1] - right_fit.height + 18))
    return preview


def make_cannon_alpha_preview(left: Image.Image, right: Image.Image) -> Image.Image:
    width, height = 1280, 640
    preview = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(preview)
    tile = 32
    for y in range(0, height, tile):
        for x in range(0, width, tile):
            color = (52, 58, 72, 255) if (x // tile + y // tile) % 2 == 0 else (89, 96, 112, 255)
            draw.rectangle((x, y, x + tile, y + tile), fill=color)
    left_fit = fit_width(left, 560)
    right_fit = fit_width(right, 560)
    preview.alpha_composite(left_fit, (40, height - left_fit.height - 16))
    preview.alpha_composite(right_fit, (width - right_fit.width - 40, height - right_fit.height - 16))
    return preview


def main() -> None:
    LAYER_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

    bg_source = Image.open(SOURCE_DIR / "bg-clean-source.png").convert("RGB")
    bg = resize_cover(bg_source, CANVAS_SIZE)
    save_png(bg, "bg-clean.png")

    left = remove_magenta_key(SOURCE_DIR / "cannon-left-source.png")
    right = remove_magenta_key(SOURCE_DIR / "cannon-right-source.png")
    save_png(left, "cannon-left.png")
    save_png(right, "cannon-right.png")

    clouds_far = make_cloud_layer((CANVAS_SIZE[0], 300), near=False)
    clouds_near = make_cloud_layer((CANVAS_SIZE[0], 300), near=True)
    haze = make_haze_layer(CANVAS_SIZE)
    muzzle = make_muzzle_sheet()
    projectile = make_projectile_sheet()
    save_png(clouds_far, "clouds-far.png")
    save_png(clouds_near, "clouds-near.png")
    save_png(haze, "haze-light.png")
    save_png(muzzle, "muzzle-flash-sheet.png")
    save_png(projectile, "projectile-bolt-sheet.png")
    save_preview(make_preview(bg, left, right, clouds_near, haze), "layer-preview.png")
    save_preview(make_cannon_alpha_preview(left, right), "cannon-alpha-preview.png")

    manifest = {
        "canvas": {"width": CANVAS_SIZE[0], "height": CANVAS_SIZE[1]},
        "background": "bg-clean.png",
        "overlays": ["clouds-far.png", "clouds-near.png", "haze-light.png"],
        "foreground": ["cannon-left.png", "cannon-right.png"],
        "effects": ["muzzle-flash-sheet.png", "projectile-bolt-sheet.png"],
        "sources": [
            "../../art-source/layers/bg-clean-source.png",
            "../../art-source/layers/cannon-left-source.png",
            "../../art-source/layers/cannon-right-source.png",
            "../../art-source/layers/art-reference-sheet.png",
        ],
        "previews": [
            "../../local-output/previews/layers/layer-preview.png",
            "../../local-output/previews/layers/cannon-alpha-preview.png",
        ],
        "notes": "First separated pixel-art layer pass. Generated source assets are preserved; transparent cannons use magenta chroma-key removal."
    }
    (LAYER_DIR / "layers-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
