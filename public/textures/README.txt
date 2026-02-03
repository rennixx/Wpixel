# Earth Textures Required for PlanetCanvas 3D

Place Earth texture images in this folder for the different globe view styles.

## Texture Files Needed:

1. **earth-map-8k.jpg** - Map style (political boundaries, flat colors)
2. **earth-satellite-8k.jpg** - Satellite view (photographic)
3. **earth-hybrid-8k.jpg** - Hybrid view (satellite + labels)

---

## Where to get Google Earth-style Map Textures:

### 1. Natural Earth (Best for Map Style)
   **URL:** https://www.naturalearthdata.com/downloads/

   **Download:**
   - "Natural Earth I" (with country boundaries) for map view
   - "Natural Earth II" (satellite shaded relief) for hybrid view
   - Resolution: 10km or 50km (free, no registration required)

   **Instructions:**
   1. Download the raster images (not vector data)
   2. Convert to equirectangular projection if needed
   3. Save as JPG at 8192x4096 resolution
   4. Rename to appropriate filename above

### 2. Solar System Scope
   **URL:** https://www.solarsystemscope.com/textures/

   **Download:**
   - "Earth Day Map" for satellite view
   - "Earth Night Lights" for hybrid view
   - "Earth Clouds" (optional, for overlay)

   **Instructions:**
   1. Download at 8k resolution
   2. Rename to `earth-satellite-8k.jpg`

### 3. NASA Visible Earth
   **URL:** https://visibleearth.nasa.gov/

   **Download:**
   - Search for "Blue Marble" for satellite
   - Search for "City Lights" for night/hybrid view

### 4. Creating a Custom Map Style Texture:

**Option A: Using Online Tools**
   - Use NASA's GIBS (Global Imagery Browse Services)
   - URL: https://gibs.earthdata.nasa.gov/
   - Select "MODIS_Terra_CorrectedReflectance_TrueColor"
   - Download and export as equirectangular JPG

**Option B: Using QGIS (Free)**
   1. Download QGIS from https://qgis.org
   2. Add Natural Earth shapefiles as layers
   3. Style with flat colors for land/ocean
   4. Export as GeoTIFF
   5. Convert to equirectangular JPG

**Option C: Procedural Fallback**
   The app will automatically generate a procedural texture
   if the texture files are missing. This provides a basic
   map-like appearance without external files.

---

## Texture Specifications:

| Property | Value |
|----------|-------|
| Resolution | 8192 x 4096 (8k) recommended |
| Format | JPG (for smaller file size) |
| Projection | Equirectangular (Plate Carrée) |
| Color Space | sRGB |
| Bit Depth | 8-bit (24-bit RGB) |

---

## Quick Start (Minimal Setup):

If you want to test the app quickly without textures:
1. The app includes a procedural fallback texture
2. It will generate a basic map-style appearance automatically
3. No files required - just run `npm run dev`

For production use, download at least the map-style texture for the best Google Earth experience.
