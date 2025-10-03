#!/usr/bin/env python3
"""
Image Optimization Script for Epoch Battles
Converts 1024x1024 army images to optimized sizes for web use.

Usage:
    python optimize_images.py
    
This will create optimized versions in subdirectories:
- 64x64/ (for game board pieces)
- 128x128/ (for UI elements)
- 256x256/ (for future use/zoom)
"""

import os
import sys
from pathlib import Path
from PIL import Image, ImageOps
import argparse

def ensure_pillow():
    """Check if Pillow is installed, provide installation instructions if not."""
    try:
        import PIL
        return True
    except ImportError:
        print("❌ Pillow (PIL) is not installed.")
        print("📦 Install it with: pip install Pillow")
        print("   Or with conda: conda install pillow")
        return False

def optimize_image(input_path, output_path, target_size, quality=85):
    """
    Optimize a single image to target size with quality compression.
    
    Args:
        input_path (Path): Source image file
        output_path (Path): Destination image file
        target_size (tuple): Target dimensions (width, height)
        quality (int): JPEG quality for compression (PNG will use optimization)
    """
    try:
        with Image.open(input_path) as img:
            # Convert RGBA to RGB if saving as JPEG, otherwise keep original mode
            if output_path.suffix.lower() == '.jpg' and img.mode in ('RGBA', 'LA'):
                # Create white background for transparency
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[-1])  # Use alpha channel as mask
                else:
                    background.paste(img)
                img = background
            
            # Resize with high-quality resampling
            img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
            
            # Save with optimization
            if output_path.suffix.lower() == '.png':
                img_resized.save(output_path, 'PNG', optimize=True)
            else:
                img_resized.save(output_path, 'JPEG', quality=quality, optimize=True)
                
            return True
    except Exception as e:
        print(f"❌ Error processing {input_path}: {e}")
        return False

def get_file_size_mb(file_path):
    """Get file size in MB."""
    return file_path.stat().st_size / (1024 * 1024)

def process_army_directory(army_path, sizes, keep_original=True, output_format='png'):
    """
    Process all PNG images in an army directory.
    
    Args:
        army_path (Path): Path to army directory
        sizes (dict): Dictionary of size_name -> (width, height)
        keep_original (bool): Whether to keep original 1024x1024 images
        output_format (str): Output format ('png' or 'jpg')
    """
    print(f"\n🎮 Processing {army_path.name} army...")
    
    # Find all PNG images in the directory (but not in subdirectories)
    png_files = [f for f in army_path.glob("*.png") if f.is_file()]
    
    if not png_files:
        print(f"   ⚠️  No PNG files found in {army_path}")
        return
    
    print(f"   📁 Found {len(png_files)} images")
    
    # Create size directories
    size_dirs = {}
    for size_name in sizes.keys():
        size_dir = army_path / size_name
        size_dir.mkdir(exist_ok=True)
        size_dirs[size_name] = size_dir
    
    # Process each image
    total_original_size = 0
    total_optimized_size = 0
    successful_conversions = 0
    
    for png_file in png_files:
        original_size = get_file_size_mb(png_file)
        total_original_size += original_size
        
        print(f"   🖼️  Processing {png_file.name} ({original_size:.1f}MB)")
        
        # Convert to each target size
        file_optimized_size = 0
        file_success = True
        
        for size_name, (width, height) in sizes.items():
            output_path = size_dirs[size_name] / f"{png_file.stem}.{output_format}"
            
            if optimize_image(png_file, output_path, (width, height)):
                optimized_size = get_file_size_mb(output_path)
                file_optimized_size += optimized_size
                print(f"      ✅ {size_name}: {optimized_size:.1f}MB")
            else:
                file_success = False
                print(f"      ❌ {size_name}: Failed")
        
        if file_success:
            successful_conversions += 1
            total_optimized_size += file_optimized_size
            
            # Optionally move original to backup or delete
            if not keep_original:
                backup_dir = army_path / "originals"
                backup_dir.mkdir(exist_ok=True)
                backup_path = backup_dir / png_file.name
                png_file.rename(backup_path)
                print(f"      📦 Original moved to originals/")
    
    # Summary
    compression_ratio = (1 - total_optimized_size / total_original_size) * 100 if total_original_size > 0 else 0
    print(f"   📊 Summary: {successful_conversions}/{len(png_files)} images processed")
    print(f"   💾 Size reduction: {total_original_size:.1f}MB → {total_optimized_size:.1f}MB ({compression_ratio:.1f}% smaller)")

def main():
    parser = argparse.ArgumentParser(description="Optimize Epoch Battles army images")
    parser.add_argument("--armies-path", type=str, default="client/src/data/armies",
                       help="Path to armies directory (default: client/src/data/armies)")
    parser.add_argument("--keep-originals", action="store_true", default=True,
                       help="Keep original 1024x1024 images (default: True)")
    parser.add_argument("--format", choices=['png', 'jpg'], default='png',
                       help="Output format (default: png)")
    parser.add_argument("--custom-sizes", type=str, 
                       help="Custom sizes as 'name1:WxH,name2:WxH' (e.g., 'small:32x32,large:512x512')")
    
    args = parser.parse_args()
    
    # Check dependencies
    if not ensure_pillow():
        sys.exit(1)
    
    # Define target sizes
    sizes = {
        "64x64": (64, 64),      # Game board pieces
        "128x128": (128, 128),  # UI elements  
        "256x256": (256, 256),  # Future use/zoom
    }
    
    # Parse custom sizes if provided
    if args.custom_sizes:
        custom_sizes = {}
        for size_spec in args.custom_sizes.split(','):
            try:
                name, dimensions = size_spec.split(':')
                width, height = map(int, dimensions.split('x'))
                custom_sizes[name] = (width, height)
            except ValueError:
                print(f"❌ Invalid size specification: {size_spec}")
                sys.exit(1)
        sizes = custom_sizes
    
    # Find armies directory
    armies_path = Path(args.armies_path)
    if not armies_path.exists():
        print(f"❌ Armies directory not found: {armies_path}")
        print("💡 Run this script from the project root directory")
        sys.exit(1)
    
    print("🎯 Epoch Battles Image Optimizer")
    print("=" * 50)
    print(f"📂 Armies path: {armies_path}")
    print(f"🎨 Output format: {args.format}")
    print(f"📏 Target sizes: {', '.join(f'{name} ({w}x{h})' for name, (w, h) in sizes.items())}")
    print(f"💾 Keep originals: {args.keep_originals}")
    
    # Find all army directories
    army_dirs = [d for d in armies_path.iterdir() if d.is_dir() and not d.name.startswith('.')]
    
    if not army_dirs:
        print(f"❌ No army directories found in {armies_path}")
        sys.exit(1)
    
    print(f"\n🔍 Found {len(army_dirs)} army directories:")
    for army_dir in army_dirs:
        print(f"   - {army_dir.name}")
    
    # Confirm before processing
    response = input(f"\n❓ Process all armies? (y/N): ").strip().lower()
    if response not in ['y', 'yes']:
        print("❌ Cancelled by user")
        sys.exit(0)
    
    # Process each army
    print("\n🚀 Starting optimization...")
    total_start_time = Path().resolve()  # Just for timing reference
    
    for army_dir in sorted(army_dirs):
        process_army_directory(army_dir, sizes, args.keep_originals, args.format)
    
    print("\n🎉 Optimization complete!")
    print("\n💡 Next steps:")
    print("   1. Update your React components to use the optimized images")
    print("   2. Consider using 64x64 for game board pieces")
    print("   3. Use 128x128 for UI elements and piece selection")
    print("   4. Test loading performance in your browser")

if __name__ == "__main__":
    main()