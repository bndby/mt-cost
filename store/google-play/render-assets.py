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


def feature_graphic() -> None:
    icon = Image.open(ROOT / "assets" / "icon.png").convert("RGB").resize((360, 360))
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
    icon = Image.open(ROOT / "assets" / "icon.png").convert("RGB").resize((512, 512))
    path = OUT / "icon-512.png"
    icon.save(path, "PNG")
    print(path)


if __name__ == "__main__":
    signed_out()
    valuation()
    waiting()
    feature_graphic()
    hi_res_icon()
