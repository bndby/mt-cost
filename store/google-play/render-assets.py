#!/usr/bin/env python3
"""Render Play Store graphics from the production UI palette and copy."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
SCREEN_DIR = OUT / "screenshots"
BG = (18, 20, 26)
FG = (243, 241, 234)
MUTED = (154, 150, 140)
KICKER = (140, 136, 124)
CTA_BG = (231, 196, 106)
CTA_FG = (26, 20, 8)
LINE = (42, 45, 54)
PULSE = (58, 62, 74)
W, H = 1080, 1920
PAD = 66
FONT_REG = "/usr/share/fonts/OTF/FiraSans-Regular.otf"
FONT_SB = "/usr/share/fonts/OTF/FiraSans-SemiBold.otf"
FONT_BOLD = "/usr/share/fonts/OTF/FiraSans-Bold.otf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def new_screen() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)


def text_width(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.FreeTypeFont) -> int:
    return int(draw.textbbox((0, 0), text, font=fnt)[2])


def save(img: Image.Image, name: str) -> None:
    SCREEN_DIR.mkdir(parents=True, exist_ok=True)
    path = SCREEN_DIR / name
    img.save(path, "PNG")
    print(path)


def signed_out() -> None:
    img, d = new_screen()
    title = font(FONT_SB, 108)
    sub = font(FONT_REG, 42)
    cta = font(FONT_BOLD, 46)
    d.text((PAD, 1180), "Оценка", font=title, fill=FG)
    d.text(
        (PAD, 1310),
        "Имущество аккаунта Мира танков\nв рублях.",
        font=sub,
        fill=MUTED,
        spacing=8,
    )
    btn = (PAD, 1680, W - PAD, 1810)
    d.rounded_rectangle(btn, radius=42, fill=CTA_BG)
    label = "Войти через Lesta"
    tw = text_width(d, label, cta)
    d.text(((W - tw) / 2, 1716), label, font=cta, fill=CTA_FG)
    save(img, "01-signed-out.png")


def valuation() -> None:
    img, d = new_screen()
    small = font(FONT_REG, 38)
    kicker = font(FONT_SB, 28)
    sum_f = font(FONT_SB, 128)
    dock_l = font(FONT_REG, 28)
    dock_v = font(FONT_REG, 36)
    d.text((W - PAD - text_width(d, "Выйти", small), 72), "Выйти", font=small, fill=(201, 196, 182))
    d.text((PAD, 640), "ОЦЕНКА", font=kicker, fill=KICKER)
    d.text((PAD, 700), "184 320,156 ₽", font=sum_f, fill=FG)
    d.line((PAD, 1540, W - PAD, 1540), fill=LINE, width=2)
    cols = [
        ("Танки", "87"),
        ("Танки, ₽", "128 960,4 ₽"),
        ("Прочее имущество", "55 359,756 ₽"),
    ]
    col_w = (W - 2 * PAD) / 3
    for i, (label, value) in enumerate(cols):
        x = PAD + i * col_w
        d.text((x, 1570), label, font=dock_l, fill=KICKER)
        d.text((x, 1618), value, font=dock_v, fill=FG)
    save(img, "02-valuation.png")


def waiting() -> None:
    img, d = new_screen()
    small = font(FONT_REG, 38)
    kicker = font(FONT_SB, 28)
    dock_l = font(FONT_REG, 28)
    d.text((W - PAD - text_width(d, "Выйти", small), 72), "Выйти", font=small, fill=(201, 196, 182))
    d.text((PAD, 640), "ОЦЕНКА", font=kicker, fill=KICKER)
    d.rounded_rectangle((PAD, 720, PAD + 560, 850), radius=12, fill=PULSE)
    d.line((PAD, 1540, W - PAD, 1540), fill=LINE, width=2)
    labels = ["Танки", "Танки, ₽", "Прочее имущество"]
    col_w = (W - 2 * PAD) / 3
    for i, label in enumerate(labels):
        x = PAD + i * col_w
        d.text((x, 1570), label, font=dock_l, fill=KICKER)
        d.rounded_rectangle((x, 1618, x + 180, 1656), radius=8, fill=PULSE)
    save(img, "03-waiting.png")


# Lesta «Мир танков» shield, traced from the official mark (152×202 px).
# Orange field #F0401E; heptagon with flat top, vertical sides, pointed bottom.
SHIELD_ORANGE = (240, 64, 30)
SHIELD_BG = (0, 0, 0)
SHIELD_VERTS = (
    (34.0, 0.0),
    (117.0, 0.0),
    (151.0, 29.0),
    (151.0, 138.0),
    (75.5, 201.0),
    (0.0, 138.0),
    (0.0, 29.0),
)
SHIELD_W, SHIELD_H = 151.0, 201.0
# Star bbox on the reference: (30,41)–(121,126), center (75.5, 83.5).
STAR_CX, STAR_CY = 75.5, 83.5
STAR_H = 86.0
RUBLE_FONT = "/usr/share/fonts/OTF/FiraSans-Heavy.otf"


def _shield_layout(size: int) -> tuple[float, float, float]:
    pad = size * 0.08
    scale = (size - 2 * pad) / SHIELD_H
    sw = SHIELD_W * scale
    tx = (size - sw) / 2
    return tx, pad, scale


def play_icon_svg(size: int) -> str:
    tx, ty, scale = _shield_layout(size)
    pts = " ".join(f"{tx + x * scale:.3f},{ty + y * scale:.3f}" for x, y in SHIELD_VERTS)
    cx = tx + STAR_CX * scale
    cy = ty + STAR_CY * scale
    font_size = STAR_H * scale * 1.55
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
        f'viewBox="0 0 {size} {size}">'
        f'<rect width="{size}" height="{size}" fill="#000000"/>'
        f'<polygon fill="#F0401E" points="{pts}"/>'
        f'<text x="{cx:.3f}" y="{cy:.3f}" fill="#000000" font-family="Fira Sans" '
        f'font-weight="900" font-size="{font_size:.3f}" text-anchor="middle" '
        f'dominant-baseline="central">₽</text>'
        f"</svg>"
    )


def render_play_icon(size: int) -> Image.Image:
    ss = 4
    canvas = size * ss
    tx, ty, scale = _shield_layout(canvas)
    img = Image.new("RGB", (canvas, canvas), SHIELD_BG)
    d = ImageDraw.Draw(img)
    d.polygon([(tx + x * scale, ty + y * scale) for x, y in SHIELD_VERTS], fill=SHIELD_ORANGE)
    fnt = ImageFont.truetype(RUBLE_FONT, size=round(STAR_H * scale * 1.55))
    glyph = "₽"
    l, t, r, b = fnt.getbbox(glyph)
    cx = tx + STAR_CX * scale
    cy = ty + STAR_CY * scale
    d.text((cx - (l + r) / 2, cy - (t + b) / 2), glyph, font=fnt, fill=SHIELD_BG)
    return img.resize((size, size), Image.Resampling.LANCZOS)


def write_play_icon(path: Path, size: int) -> None:
    render_play_icon(size).save(path, "PNG")
    print(path)


def feature_graphic() -> None:
    icon = (
        Image.open(OUT / "icon-source.png")
        .convert("RGB")
        .resize((360, 360), Image.Resampling.LANCZOS)
    )
    img = Image.new("RGB", (1024, 500), BG)
    img.paste(icon, (80, 70))
    d = ImageDraw.Draw(img)
    title = font(FONT_SB, 64)
    sub = font(FONT_REG, 28)
    d.text((480, 160), "Оценка", font=title, fill=FG)
    d.text((480, 250), "Имущество аккаунта\nМира танков в рублях", font=sub, fill=MUTED, spacing=6)
    path = OUT / "feature-graphic.png"
    img.save(path, "PNG")
    print(path)


def hi_res_icon() -> None:
    svg = OUT / "icon.svg"
    svg.write_text(play_icon_svg(512), encoding="utf-8")
    write_play_icon(OUT / "icon-source.png", 1024)
    write_play_icon(OUT / "icon-512.png", 512)


if __name__ == "__main__":
    signed_out()
    valuation()
    waiting()
    feature_graphic()
    hi_res_icon()
