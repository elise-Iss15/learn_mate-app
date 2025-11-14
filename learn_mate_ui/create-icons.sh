#!/bin/bash

# Create simple PWA icons using ImageMagick convert
# If ImageMagick is not installed, these are fallback solid color icons

# Check if convert command exists
if command -v convert &> /dev/null; then
    echo "Creating icons with ImageMagick..."
    
    # Create 192x192 icon
    convert -size 192x192 xc:'#2563eb' \
        -gravity center \
        -pointsize 80 -fill white -font "DejaVu-Sans-Bold" \
        -annotate +0+0 'LM' \
        public/icon-192x192.png
    
    # Create 512x512 icon
    convert -size 512x512 xc:'#2563eb' \
        -gravity center \
        -pointsize 220 -fill white -font "DejaVu-Sans-Bold" \
        -annotate +0+0 'LM' \
        public/icon-512x512.png
    
    echo "✅ Icons created successfully!"
else
    echo "⚠️  ImageMagick not found. Creating placeholder instructions..."
    echo "Please create icons manually:"
    echo "1. Create public/icon-192x192.png (192x192 pixels)"
    echo "2. Create public/icon-512x512.png (512x512 pixels)"
    echo "You can use online tools like https://www.favicon-generator.org/"
fi
