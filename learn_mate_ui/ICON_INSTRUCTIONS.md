## PWA Icon Instructions

The application needs two icon files for the Progressive Web App functionality:

### Required Icons

1. **icon-192x192.png** - Small icon (192x192 pixels)
2. **icon-512x512.png** - Large icon (512x512 pixels)

### Quick Ways to Create Icons

#### Option 1: Online Tool (Recommended - 2 minutes)
1. Visit [Favicon Generator](https://www.favicon-generator.org/) or [PWA Icon Generator](https://www.pwabuilder.com/imageGenerator)
2. Upload your logo or create a simple design with "LM" text
3. Download the generated icons
4. Rename and place them in the `public/` folder

#### Option 2: Use Figma/Canva (5 minutes)
1. Create a 512x512px square design
2. Add a blue background (#2563eb)
3. Add white text "LM" or a book/graduation cap icon
4. Export as PNG at 512x512 and 192x192
5. Place in `public/` folder

#### Option 3: Use GIMP/Photoshop
1. Create new image 512x512px
2. Fill with blue (#2563eb)
3. Add white text "LM" centered
4. Save as icon-512x512.png
5. Resize to 192x192 and save as icon-192x192.png

### Temporary Placeholder

For now, the app will work without icons (browser will show a default icon). You can add proper icons later when you have a logo design.

### Verify Icons

After adding icons, check:
- Files exist: `ls -l public/icon-*.png`
- Referenced in `public/manifest.json`
- App installs correctly on mobile devices
