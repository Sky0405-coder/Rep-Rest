#!/usr/bin/env python3
"""Erzeugt alle App-Icons aus dem R²D²-Logo (Entwurf B).

Aufruf aus dem Projekt-Root:  python3 design/generate-icons.py
Benötigt ImageMagick (`magick`) mit SVG-Unterstützung.
"""
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'apps/mobile/assets/images'
DESIGN = ROOT / 'design'

REP, REST, NIGHT, WHITE = '#FF6B3D', '#2EC4B6', '#0F1B2D', '#F4F7FB'

# Geometrische Buchstaben als Strichpfade (lokale Box ca. 97×140).
R_PATH = 'M11 129 V11 H50 A30 30 0 0 1 50 71 H11 M48 71 L86 129'
D_PATH = 'M11 11 H42 Q86 11 86 70 Q86 129 42 129 H11 Z'
TWO_PATH = 'M4 13 A11 11 0 1 1 24 21 L4 40 H28'


def stroke(d, x, y, s, color, width):
    return (f'<path transform="translate({x:.2f},{y:.2f}) scale({s})" d="{d}" fill="none" '
            f'stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>')


def mark(letter=WHITE, sup_r=REP, sup_d=REST, s=0.56, k=0.8, gap=6, rowgap=10):
    """R² über D², als Gruppe in einem 200×200-Feld zentriert."""
    lw, lh, tw = 97 * s, 140 * s, 32 * k
    x0 = 100 - (lw + gap + tw) / 2
    y0 = 100 - (2 * lh + rowgap) / 2
    out = ''
    for i, (d, sup) in enumerate([(R_PATH, sup_r), (D_PATH, sup_d)]):
        y = y0 + i * (lh + rowgap)
        out += stroke(d, x0, y, s, letter, 22) + stroke(TWO_PATH, x0 + lw + gap, y - lh * 0.05, k, sup, 8)
    return out


def svg(body, size=200):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 200 200">{body}</svg>'


def scaled(body, factor):
    return f'<g transform="translate(100,100) scale({factor}) translate(-100,-100)">{body}</g>'


FILES = {
    # Master-Dateien
    DESIGN / 'logo.svg': svg(f'<rect width="200" height="200" rx="46" fill="{NIGHT}"/>' + mark()),
    DESIGN / 'logo-light.svg': svg(f'<rect width="200" height="200" rx="46" fill="{WHITE}"/>' + mark(letter=NIGHT)),
    # iOS/Store-Icon: vollflächig, die Rundung macht das System.
    ASSETS / 'icon.png': svg(f'<rect width="200" height="200" fill="{NIGHT}"/>' + mark(), 1024),
    # Android Adaptive Icon: Vordergrund im sicheren Bereich (Kreis mit 66 % Durchmesser).
    ASSETS / 'android-icon-foreground.png': svg(scaled(mark(), 0.64), 1024),
    ASSETS / 'android-icon-monochrome.png': svg(scaled(mark(WHITE, WHITE, WHITE), 0.64), 1024),
    # Splash: nur die Marke, Hintergrund kommt aus app.json.
    ASSETS / 'splash-icon.png': svg(mark(), 1024),
    # Web-Favicon mit gerundeten Ecken.
    ASSETS / 'favicon.png': svg(f'<rect width="200" height="200" rx="46" fill="{NIGHT}"/>' + mark(), 192),
}


def main():
    for path, content in FILES.items():
        if path.suffix == '.svg':
            path.write_text(content)
            continue
        with tempfile.NamedTemporaryFile('w', suffix='.svg', delete=False) as tmp:
            tmp.write(content)
        subprocess.run(['magick', '-background', 'none', tmp.name, str(path)], check=True, capture_output=True)
        pathlib.Path(tmp.name).unlink()
        print('geschrieben:', path.relative_to(ROOT))


if __name__ == '__main__':
    main()
