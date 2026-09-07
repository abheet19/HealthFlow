"""
Assemble the HealthFlow hero-demo GIF from the frame pairs record-demo.mjs
captured.

Each captured "frame" is a pair of 1280x1600 PNGs (the IT pane and the
department pane, both grabbed at the same instant). This composites them side
by side into a 2560x1600 canvas with a thin divider and a small caption strip,
downsamples the result to GIF_WIDTH with LANCZOS, and writes a single
animated GIF with per-frame durations taken from the manifest's `hold` ticks.

Per-frame durations (rather than duplicating held frames) keep the file small:
Pillow only has to store ~90 frames instead of ~250, and it crops each frame to
the region that actually changed.

Usage:
    python build-gif.py
    python build-gif.py --width 900 --colors 96
"""

import argparse
import json
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).parent
FRAME_DIR = HERE / ".frames"
OUT = HERE.parent / "docs" / "demo" / "healthflow-demo.gif"

TICK_MS = 125          # one `hold` tick = 1/8 second
GAP = 24               # gutter between the two panes, in captured pixels
LABEL_H = 68           # caption strip above the panes
BG = (7, 10, 8)
DIVIDER = (30, 60, 46)
LABEL_FG = (150, 200, 176)


def load_font(size):
    for name in ("segoeui.ttf", "arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def compose(left_path, right_path, font):
    left = Image.open(left_path).convert("RGB")
    right = Image.open(right_path).convert("RGB")
    w, h = left.size
    canvas = Image.new("RGB", (w * 2 + GAP, h + LABEL_H), BG)
    canvas.paste(left, (0, LABEL_H))
    canvas.paste(right, (w + GAP, LABEL_H))

    d = ImageDraw.Draw(canvas)
    d.line([(w + GAP // 2, LABEL_H), (w + GAP // 2, LABEL_H + h)], fill=DIVIDER, width=2)
    d.text((28, LABEL_H // 2), "TAB 1  -  IT DESK", font=font, fill=LABEL_FG, anchor="lm")
    d.text((w + GAP + 28, LABEL_H // 2), "TAB 2  -  DEPARTMENT", font=font, fill=LABEL_FG, anchor="lm")
    return canvas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--width", type=int, default=1000, help="final GIF width in px")
    ap.add_argument("--colors", type=int, default=128, help="palette size (2-256)")
    ap.add_argument("--out", type=pathlib.Path, default=OUT)
    ap.add_argument("--tempo", type=float, default=0.75,
                    help="scale every frame's duration; <1 is faster. The raw "
                         "capture holds run ~34s, which is longer than a README "
                         "GIF should be, so trim without dropping any beat.")
    args = ap.parse_args()

    manifest_path = FRAME_DIR / "manifest.json"
    if not manifest_path.exists():
        sys.exit(f"No manifest at {manifest_path} - run `node record-demo.mjs` first.")
    manifest = json.loads(manifest_path.read_text())
    entries = manifest["frames"]

    font = load_font(34)
    frames, durations = [], []
    target_size = None

    for i, entry in enumerate(entries, 1):
        canvas = compose(FRAME_DIR / entry["l"], FRAME_DIR / entry["r"], font)
        if target_size is None:
            ratio = args.width / canvas.width
            target_size = (args.width, int(round(canvas.height * ratio)))
        small = canvas.resize(target_size, Image.LANCZOS)
        frames.append(small.quantize(colors=args.colors, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG))
        # 100ms floor: browsers clamp very short GIF delays anyway, and the
        # fast transition frames still need to be visible.
        durations.append(max(100, round(entry["hold"] * TICK_MS * args.tempo)))
        print(f"\r  composed {i}/{len(entries)}", end="")

    print()

    # Cap every hold at MAX_HOLD_MS so no beat freezes past ~1.5s. A capped
    # frame that's still byte-identical to its neighbour is dropped outright
    # rather than kept as a second identical frame, because Pillow's GIF
    # `optimize` pass merges consecutive byte-identical frames on save
    # regardless — it would otherwise silently undo the cap by re-summing two
    # adjacent capped holds back into one long freeze.
    MAX_HOLD_MS = 1500
    capped_frames, capped_durations = [], []
    prev_bytes = None
    for f, ms in zip(frames, durations):
        b = f.tobytes()
        if prev_bytes is not None and b == prev_bytes:
            capped_durations[-1] = min(MAX_HOLD_MS, capped_durations[-1] + ms)
            continue
        capped_frames.append(f)
        capped_durations.append(min(MAX_HOLD_MS, ms))
        prev_bytes = b
    frames, durations = capped_frames, capped_durations

    args.out.parent.mkdir(parents=True, exist_ok=True)
    frames[0].save(
        args.out,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        optimize=True,
        disposal=1,
    )

    total_s = sum(durations) / 1000
    size_mb = args.out.stat().st_size / 1024 / 1024
    print(f"{args.out}")
    print(f"  {target_size[0]}x{target_size[1]}px, {len(frames)} frames, "
          f"{total_s:.1f}s, {size_mb:.2f} MB, {args.colors} colours")


if __name__ == "__main__":
    main()
