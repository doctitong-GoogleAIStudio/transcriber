from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create a gradient background
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background (purple to indigo)
    for y in range(size):
        r = int(147 + (99 - 147) * y / size)
        g = int(51 + (102 - 51) * y / size)
        b = int(234 + (241 - 234) * y / size)
        draw.rectangle([(0, y), (size, y+1)], fill=(r, g, b))
    
    # Draw text
    try:
        # Try to use a nice font
        font_size = size // 4
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    text = "DDH"
    
    # Get text bounding box
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Center the text
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]
    
    # Draw text with shadow
    shadow_offset = max(2, size // 100)
    draw.text((x + shadow_offset, y + shadow_offset), text, fill=(0, 0, 0, 128), font=font)
    draw.text((x, y), text, fill='white', font=font)
    
    # Save icon
    img.save(filename, 'PNG')
    print(f"Created {filename}")

# Create icons
create_icon(192, 'icon-192.png')
create_icon(512, 'icon-512.png')

print("Icons created successfully!")
