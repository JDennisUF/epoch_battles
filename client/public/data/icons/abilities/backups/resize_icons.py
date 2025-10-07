#!/usr/bin/env python3
"""
Resize PNG files over a size threshold (default 50KB) to an N×N square (default 24) for web use.

Output naming:
    Original:  fleet.png  → Resized: fleet_24.png (if --pixels 24)
    Another run with --pixels 36 will create fleet_36.png, leaving prior variants intact.

Behavior:
 - No backups; originals are never modified.
 - Any file already ending with _<number>.png is treated as an already-sized variant and skipped.
 - Use --force ONLY if you want to regenerate an existing size variant.
"""

import os
import sys
import argparse
import re
from PIL import Image, ImageOps

def get_file_size_kb(filepath):
    """Get file size in kilobytes."""
    return os.path.getsize(filepath) / 1024

def resize_image(input_path, output_path, size=(24, 24)):
    """Resize image to specified size with high-quality resampling."""
    try:
        with Image.open(input_path) as img:
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            img = img.resize(size, Image.Resampling.LANCZOS)
            img.save(output_path, 'PNG', optimize=True)
        return True
    except Exception as e:
        print(f"  ❌ Error resizing {os.path.basename(input_path)}: {e}")
        return False

def parse_args():
    parser = argparse.ArgumentParser(description="Resize larger PNG icons to a square size, writing *_<pixels>.png variants.")
    parser.add_argument("--pixels", "-p", type=int, default=24,
                        help="Square dimension in pixels (default: 24 → produces size PxP).")
    parser.add_argument("--threshold-kb", "-t", type=float, default=50,
                        help="Only resize files strictly larger than this size in KB (default: 50).")
    parser.add_argument("--force", "-f", action="store_true",
                        help="Force re-create resized variant even if it already exists (overwrites *_<pixels>.png).")
    return parser.parse_args()


def is_dimension_variant(filename: str) -> bool:
    """Return True if filename already ends with _<digits>.png (case-insensitive)."""
    return bool(re.match(r"^.+_[0-9]+\.png$", filename.lower()))


def main():
    args = parse_args()
    threshold_kb = args.threshold_kb
    target_size = (args.pixels, args.pixels)
    current_dir = os.path.dirname(os.path.abspath(__file__))

    print("PNG Icon Resizer (Non-Destructive)")
    print("=================================")
    print(f"Directory: {current_dir}")
    print(f"Target size: {target_size[0]}x{target_size[1]} px")
    print(f"Size threshold: {threshold_kb}KB (strictly greater)")
    print(f"Force overwrite existing *_{args.pixels}.png: {'YES' if args.force else 'no'}")
    print()

    png_files = [f for f in os.listdir(current_dir)
                 if f.lower().endswith('.png') and not is_dimension_variant(f)]

    if not png_files:
        print("No base PNG files found (dimension variants *_<n>.png are excluded).")
        return

    processed = 0
    skipped = 0
    errors = 0

    for filename in sorted(png_files):
        src = os.path.join(current_dir, filename)
        size_kb = get_file_size_kb(src)
        base, _ = os.path.splitext(filename)
        dest = os.path.join(current_dir, f"{base}_{args.pixels}.png")

        print(f"Checking: {filename} ({size_kb:.1f}KB)")

        if size_kb <= threshold_kb:
            print("  → Skipped (under or equal to threshold)")
            skipped += 1
            continue

        if os.path.exists(dest) and not args.force:
            print("  → Skipped (variant exists; use --force to regenerate)")
            skipped += 1
            continue

        if resize_image(src, dest, size=target_size):
            new_size_kb = get_file_size_kb(dest)
            print(f"  ✅ Created {os.path.basename(dest)} ({new_size_kb:.1f}KB)")
            processed += 1
        else:
            errors += 1

    print("\nSummary:")
    print(f"  Created resized variants: {processed}")
    print(f"  Skipped: {skipped}")
    print(f"  Errors: {errors}")
    print("\nDone. Originals preserved; variants suffixed with _<pixels>.png.")

if __name__ == "__main__":
    try:
        # Check if PIL is available
        from PIL import Image
    except ImportError:
        print("Error: Pillow library not found!")
        print("Install it with: pip install Pillow")
        sys.exit(1)
    
    main()