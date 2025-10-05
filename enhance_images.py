from PIL import Image, ImageEnhance
import os

def enhance_image_contrast(input_path, output_path, contrast_factor=1.5):
    """
    Enhance contrast of an image
    contrast_factor: 1.0 = original, >1.0 = more contrast, <1.0 = less contrast
    """
    try:
        # Open the image
        with Image.open(input_path) as img:
            # Create contrast enhancer
            enhancer = ImageEnhance.Contrast(img)
            # Apply contrast enhancement
            enhanced_img = enhancer.enhance(contrast_factor)
            # Save the enhanced image
            enhanced_img.save(output_path)
            print(f"Enhanced: {input_path} -> {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

def batch_enhance_army_images(army_folder, contrast_factor=1.5):
    """
    Enhance all images in an army folder
    """
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
    
    for filename in os.listdir(army_folder):
        file_path = os.path.join(army_folder, filename)
        
        # Check if it's an image file
        if os.path.isfile(file_path) and any(filename.lower().endswith(ext) for ext in image_extensions):
            # Create backup of original
            backup_path = os.path.join(army_folder, f"original_{filename}")
            if not os.path.exists(backup_path):
                os.rename(file_path, backup_path)
                enhance_image_contrast(backup_path, file_path, contrast_factor)
            else:
                print(f"Backup already exists for {filename}, skipping...")

# Main execution
if __name__ == "__main__":
    # Path to post_apocalyptic army images
    army_path = "/home/jasondennis/code/epoch_battles/client/public/data/armies/post_apocalyptic"
    
    # Enhance with 1.8x contrast (adjust as needed)
    contrast_level = 1.8
    
    print(f"Enhancing images in: {army_path}")
    print(f"Contrast factor: {contrast_level}")
    
    if os.path.exists(army_path):
        batch_enhance_army_images(army_path, contrast_level)
        print("Enhancement complete!")
    else:
        print(f"Directory not found: {army_path}")