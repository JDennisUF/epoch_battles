#!/usr/bin/env python3
"""
Copy army JSON files from client/src/data/armies/ to client/public/data/armies/
This script ensures the public folder has the latest army definitions.
"""

import os
import shutil
import sys
from pathlib import Path

def copy_armies():
    """Copy army JSON files from src to public directory."""
    
    # Define source and destination paths
    src_base = Path("client/src/data/armies")
    dest_base = Path("client/public/data/armies")
    
    # Check if source directory exists
    if not src_base.exists():
        print(f"❌ Source directory not found: {src_base}")
        sys.exit(1)
    
    # Create destination directory if it doesn't exist
    dest_base.mkdir(parents=True, exist_ok=True)
    
    copied_files = []
    errors = []
    
    # Copy default.json from root
    default_src = src_base / "default.json"
    default_dest = dest_base / "default.json"
    
    if default_src.exists():
        try:
            shutil.copy2(default_src, default_dest)
            copied_files.append("default.json")
            print(f"✅ Copied: default.json")
        except Exception as e:
            errors.append(f"default.json: {e}")
            print(f"❌ Failed to copy default.json: {e}")
    
    # Copy army-specific JSON files and image folders from subdirectories
    for army_dir in src_base.iterdir():
        if army_dir.is_dir():
            army_name = army_dir.name
            
            # Create destination army directory
            dest_army_dir = dest_base / army_name
            dest_army_dir.mkdir(exist_ok=True)
            
            # Look for JSON file in the army directory
            json_files = list(army_dir.glob("*.json"))
            
            if json_files:
                json_file = json_files[0]  # Take the first JSON file found
                
                # Copy the JSON file
                dest_json = dest_army_dir / json_file.name
                
                try:
                    shutil.copy2(json_file, dest_json)
                    copied_files.append(f"{army_name}/{json_file.name}")
                    print(f"✅ Copied: {army_name}/{json_file.name}")
                except Exception as e:
                    errors.append(f"{army_name}/{json_file.name}: {e}")
                    print(f"❌ Failed to copy {army_name}/{json_file.name}: {e}")
            else:
                print(f"⚠️  No JSON files found in {army_name}")
            
            # Copy image size folders (64x64, 128x128, 256x256)
            size_folders = ["64x64", "128x128", "256x256"]
            for size_folder in size_folders:
                src_size_dir = army_dir / size_folder
                if src_size_dir.exists() and src_size_dir.is_dir():
                    dest_size_dir = dest_army_dir / size_folder
                    
                    try:
                        # Remove existing directory if it exists
                        if dest_size_dir.exists():
                            shutil.rmtree(dest_size_dir)
                        
                        # Copy the entire directory
                        shutil.copytree(src_size_dir, dest_size_dir)
                        
                        # Count copied images
                        image_count = len(list(dest_size_dir.glob("*.png")))
                        copied_files.append(f"{army_name}/{size_folder}/ ({image_count} images)")
                        print(f"✅ Copied: {army_name}/{size_folder}/ ({image_count} images)")
                        
                    except Exception as e:
                        errors.append(f"{army_name}/{size_folder}/: {e}")
                        print(f"❌ Failed to copy {army_name}/{size_folder}/: {e}")
            
            # Copy individual PNG files in the root army directory
            png_files = list(army_dir.glob("*.png"))
            for png_file in png_files:
                dest_png = dest_army_dir / png_file.name
                try:
                    shutil.copy2(png_file, dest_png)
                    copied_files.append(f"{army_name}/{png_file.name}")
                    print(f"✅ Copied: {army_name}/{png_file.name}")
                except Exception as e:
                    errors.append(f"{army_name}/{png_file.name}: {e}")
                    print(f"❌ Failed to copy {army_name}/{png_file.name}: {e}")
    
    # Summary
    print(f"\n📊 Summary:")
    print(f"   ✅ Successfully copied: {len(copied_files)} files")
    if errors:
        print(f"   ❌ Errors: {len(errors)} files")
        for error in errors:
            print(f"      - {error}")
    
    print(f"\n📁 Files copied to: {dest_base.absolute()}")
    
    if errors:
        sys.exit(1)
    else:
        print("🎉 All army files copied successfully!")

if __name__ == "__main__":
    # Change to script directory to ensure relative paths work
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    print("🚀 Copying army JSON files from src to public...")
    copy_armies()