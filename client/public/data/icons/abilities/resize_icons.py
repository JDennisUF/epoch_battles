#!/usr/bin/env python3
"""
Resize PNG files over 50KB to 24x24 pixels for optimal web performance.
This script processes all PNG files in the current directory.
"""

import os
import sys
from PIL import Image, ImageOps

def get_file_size_kb(filepath):
    """Get file size in kilobytes."""
    return os.path.getsize(filepath) / 1024

def resize_image(input_path, output_path, size=(24, 24)):
    """
    Resize image to specified size while maintaining quality.
    Uses high-quality resampling for best results at small sizes.
    """
    try:
        with Image.open(input_path) as img:
            # Convert to RGBA if not already (preserves transparency)
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # Use high-quality resampling for small icons
            resized = img.resize(size, Image.Resampling.LANCZOS)
            
            # Save with optimization
            resized.save(output_path, 'PNG', optimize=True)
            return True
    except Exception as e:
        print(f"Error resizing {input_path}: {e}")
        return False

def main():
    """Main function to process PNG files in current directory."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("PNG Icon Resizer")
    print("================")
    print(f"Processing directory: {current_dir}")
    print("Target size: 24x24 pixels")
    print("Size threshold: 50KB")
    print()
    
    # Find all PNG files
    png_files = [f for f in os.listdir(current_dir) if f.lower().endswith('.png')]
    
    if not png_files:
        print("No PNG files found in current directory.")
        return
    
    processed_count = 0
    skipped_count = 0
    error_count = 0
    
    for filename in sorted(png_files):
        filepath = os.path.join(current_dir, filename)
        file_size_kb = get_file_size_kb(filepath)
        
        print(f"Checking: {filename} ({file_size_kb:.1f}KB)")
        
        if file_size_kb > 50:
            # Create backup of original
            backup_path = os.path.join(current_dir, f"{filename}.backup")
            if not os.path.exists(backup_path):
                try:
                    os.rename(filepath, backup_path)
                    print(f"  → Backed up to {filename}.backup")
                except Exception as e:
                    print(f"  → Error creating backup: {e}")
                    error_count += 1
                    continue
            else:
                backup_path = filepath  # Use original if backup exists
            
            # Resize the image
            if resize_image(backup_path, filepath):
                new_size_kb = get_file_size_kb(filepath)
                savings_kb = file_size_kb - new_size_kb
                savings_percent = (savings_kb / file_size_kb) * 100
                
                print(f"  ✅ Resized: {file_size_kb:.1f}KB → {new_size_kb:.1f}KB "
                      f"(saved {savings_kb:.1f}KB, {savings_percent:.1f}%)")
                processed_count += 1
            else:
                print(f"  ❌ Failed to resize")
                error_count += 1
        else:
            print(f"  → Skipped (under 50KB)")
            skipped_count += 1
    
    print()
    print("Summary:")
    print(f"  Processed: {processed_count} files")
    print(f"  Skipped: {skipped_count} files")
    print(f"  Errors: {error_count} files")
    
    if processed_count > 0:
        print()
        print("Note: Original files backed up with .backup extension")
        print("You can delete .backup files once you verify the resized images work correctly.")

if __name__ == "__main__":
    try:
        # Check if PIL is available
        from PIL import Image
    except ImportError:
        print("Error: Pillow library not found!")
        print("Install it with: pip install Pillow")
        sys.exit(1)
    
    main()