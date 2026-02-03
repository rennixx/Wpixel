# 🤖 **PlanetCanvas 3D - AI Agent Development Plan**

**Version:** 1.0  
**Date:** February 4, 2026  
**Purpose:** Modular development guide for building MVP using AI coding agents  

---

## 📐 **Development Architecture**

This plan breaks the MVP into **8 independent modules** that can be built by AI agents sequentially or in parallel (where dependencies allow).

Each module includes:
- **Goal** - What this module accomplishes
- **AI Agent Prompt** - Copy-paste ready instruction
- **Dependencies** - What must exist first
- **Acceptance Criteria** - How to verify it works
- **Estimated Complexity** - Low/Medium/High

---

## 🗂️ **Module Dependency Chart**

```
Module 1 (Project Setup) 
    ↓
Module 2 (3D Globe) ← Module 3 (Drawing Canvas)
    ↓                      ↓
Module 4 (Coordinate System) →  Module 5 (Stamping System)
                                     ↓
                          Module 6 (Real-time Updates)
                                     ↓
                          Module 7 (AI Enhancement)
                                     ↓
                          Module 8 (Feed & Polish)
```

**Parallel-Safe Modules:** 2+3 can build simultaneously, 7+8 can build simultaneously

---

# 🔧 **MODULE 1: Project Foundation & Setup**

## **Goal:**
Initialize Next.js project with all dependencies, folder structure, and basic routing.

## **Dependencies:** 
None (start here)

## **Complexity:** 
Low

## **AI Agent Prompt:**

```
Create a Next.js 14 project for "PlanetCanvas 3D" with the following setup:

TECH STACK:
- Next.js 14 (App Router)
- React 18
- Three.js (latest)
- Tailwind CSS
- TypeScript (optional but recommended)

FOLDER STRUCTURE:
src/
├── app/
│   ├── page.tsx (main canvas page)
│   ├── layout.tsx
│   └── api/
│       ├── stamp/route.ts
│       └── enhance/route.ts
├── components/
│   ├── Globe3D.tsx
│   ├── DrawCanvas.tsx
│   ├── SidebarFeed.tsx
│   ├── AIEnhanceButton.tsx
│   └── Toolbar.tsx
├── lib/
│   ├── utils/
│   │   ├── coordinates.ts (lat/long conversion)
│   │   └── realtime.ts (websocket helpers)
│   └── types/
│       └── drawing.ts
├── public/
│   └── textures/
│       └── earth-8k.jpg (placeholder, I'll provide later)
└── styles/
    └── globals.css

REQUIREMENTS:
1. Install dependencies:
   - three, @react-three/fiber, @react-three/drei
   - canvas (for server-side image processing)
   - ws (WebSocket)
   
2. Configure Tailwind with dark mode default

3. Set up basic layout:
   - Dark background (#0a0a0a)
   - Full-screen canvas area
   - No headers/footers in MVP

4. Create .env.local template with:
   - NEXT_PUBLIC_WS_URL
   - OPENAI_API_KEY (for AI enhance)

5. Add placeholder components (empty exports) for all components listed

OUTPUT:
- Fully initialized project
- All folders created
- Dependencies installed
- Can run `npm run dev` without errors
- Each component file should export a basic placeholder
```

## **Acceptance Criteria:**
- [ ] `npm run dev` starts without errors
- [ ] All folders exist as specified
- [ ] Dark mode Tailwind configured
- [ ] Placeholder components render "Coming soon" text

---

# 🌍 **MODULE 2: 3D Earth Globe with Navigation**

## **Goal:**
Render interactive 3D Earth with rotation, zoom, and region selection.

## **Dependencies:** 
Module 1 complete

## **Complexity:** 
High

## **AI Agent Prompt:**

```
Build the 3D Earth globe component using Three.js with the following specs:

FILE: src/components/Globe3D.tsx

CORE FEATURES:
1. Sphere geometry with Earth texture
2. Mouse controls:
   - Click + drag to rotate
   - Scroll to zoom (min: 2x Earth radius, max: 1.2x Earth radius)
   - Double-click on region to "lock" view and enable drawing mode

3. Camera setup:
   - Perspective camera
   - Initial position: Looking at Earth from space
   - Smooth zoom animations (use lerp)

4. Visual feedback:
   - Hover: Highlight region under cursor (subtle glow)
   - Selected region: Brighter highlight + emit event

5. Region detection:
   - Use raycasting to get lat/long of clicked point
   - Pass clicked coordinates to parent component

TECHNICAL REQUIREMENTS:
- Use @react-three/fiber for React integration
- Use @react-three/drei for OrbitControls (but disable auto-rotate)
- Earth texture: Load from /textures/earth-8k.jpg
- Add ambient + directional lighting for realistic shading
- Performance: Maintain 60fps on mid-range hardware

STATE MANAGEMENT:
- Expose these via props/callbacks:
  - onRegionClick(lat, long, zoom)
  - selectedRegion {lat, long, zoom}
  - isDrawingMode boolean

VISUAL STYLE:
- Space background (dark starfield)
- Earth should have slight atmospheric glow (use shader or postprocessing)
- Smooth transitions (300ms ease-out)

EDGE CASES:
- Handle mobile touch events
- Prevent zoom beyond defined limits
- Reset view button (returns to initial position)

OUTPUT:
A fully interactive Globe3D component that:
- Renders Earth beautifully
- Allows smooth navigation
- Detects clicked regions
- Emits lat/long coordinates for drawing
```

## **Acceptance Criteria:**
- [ ] Earth renders with texture
- [ ] Rotation is smooth and responsive
- [ ] Zoom limits work correctly
- [ ] Double-click emits lat/long coordinates
- [ ] Performance: 60fps maintained
- [ ] Mobile touch controls work

---

# 🎨 **MODULE 3: Drawing Canvas Interface**

## **Goal:**
Create 2D drawing overlay that appears when region is selected.

## **Dependencies:** 
Module 1 complete (can build in parallel with Module 2)

## **Complexity:** 
Medium

## **AI Agent Prompt:**

```
Build a 2D drawing canvas component that overlays the 3D globe when a region is selected.

FILE: src/components/DrawCanvas.tsx

CORE FEATURES:
1. HTML Canvas element for drawing
2. Drawing tools:
   - Brush (variable size: 2-50px)
   - Eraser
   - Color picker (any hex color)
   - Clear canvas button

3. Canvas specs:
   - Resolution: 1024x1024px (fixed for MVP)
   - Transparent background
   - Anti-aliased strokes

4. Tool controls UI:
   - Floating toolbar (bottom-left corner)
   - Brush size slider
   - Color picker (native input type="color")
   - Tool selection buttons (brush/eraser)
   - Clear button with confirmation

TECHNICAL REQUIREMENTS:
- Use native HTML canvas API (not library)
- Smooth drawing (use quadratic curves between points)
- Pressure sensitivity NOT required (MVP)
- Export function: getCanvasAsBlob() → returns PNG

STATE MANAGEMENT:
Props:
- isVisible: boolean
- onComplete: (imageBlob: Blob) → void
- onCancel: () → void

Internal state:
- currentTool: 'brush' | 'eraser'
- brushSize: number
- brushColor: string
- isDrawing: boolean

VISUAL STYLE:
- Dark semi-transparent overlay around canvas
- Canvas area: white background with subtle grid
- Tools: Minimalist icons (lucide-react)
- Neon blue accents (#00f0ff)

USER FLOW:
1. Canvas appears with tools
2. User draws
3. User clicks "Stamp to Globe" → triggers onComplete with image
4. User clicks "Cancel" → triggers onCancel

PERFORMANCE:
- Debounce drawing updates
- Optimize for mobile (touch events)

OUTPUT:
A DrawCanvas component that:
- Appears on command
- Allows freehand drawing
- Exports high-quality PNG
- Has polished UI
```

## **Acceptance Criteria:**
- [ ] Canvas renders at 1024x1024px
- [ ] Drawing is smooth (no lag)
- [ ] Color picker works
- [ ] Brush size slider functional
- [ ] Clear button works with confirmation
- [ ] getCanvasAsBlob() returns valid PNG
- [ ] Mobile touch drawing works

---

# 🗺️ **MODULE 4: Coordinate System & UV Mapping**

## **Goal:**
Convert lat/long to 3D sphere coordinates and texture UV positions.

## **Dependencies:** 
Module 2 complete

## **Complexity:** 
Medium

## **AI Agent Prompt:**

```
Build utility functions for converting between geographic and 3D/texture coordinates.

FILE: src/lib/utils/coordinates.ts

REQUIRED FUNCTIONS:

1. latLongToXYZ(lat: number, long: number, radius: number)
   - Converts latitude/longitude to 3D Cartesian coordinates
   - Used for positioning drawings in 3D space
   - Returns: {x: number, y: number, z: number}

2. latLongToUV(lat: number, long: number)
   - Converts lat/long to UV texture coordinates (0-1 range)
   - Used for stamping drawings onto Earth texture
   - Returns: {u: number, v: number}

3. xyToLatLong(x: number, y: number, z: number, radius: number)
   - Reverse conversion from 3D point to lat/long
   - Used for raycasting results
   - Returns: {lat: number, long: number}

4. calculateDrawingBounds(lat: number, long: number, zoomLevel: number)
   - Determines the geographic bounds of a drawing canvas
   - Based on zoom level, calculate how many degrees the 1024x1024 canvas covers
   - Returns: {latMin, latMax, longMin, longMax}

MATH REQUIREMENTS:
- Use spherical coordinate conversion formulas
- Lat range: -90 to +90 (degrees)
- Long range: -180 to +180 (degrees)
- UV coordinates: (0,0) = top-left, (1,1) = bottom-right
- Handle edge cases (poles, date line)

ADDITIONAL UTILITIES:
- haversineDistance(lat1, long1, lat2, long2) → distance in km
- normalizeAngle(angle) → keeps angles in valid range

TESTING:
Include example values:
- (0°, 0°) should map to equator/prime meridian
- (90°, 0°) should map to north pole
- Verify roundtrip: latLong → XYZ → latLong returns same values

OUTPUT:
A coordinates.ts file with all functions, properly typed, tested with examples.
```

## **Acceptance Criteria:**
- [ ] All functions implement correct formulas
- [ ] Edge cases handled (poles, wraparound)
- [ ] Example conversions verified
- [ ] TypeScript types defined
- [ ] Functions are pure (no side effects)

---

# 📍 **MODULE 5: Stamping System**

## **Goal:**
Take drawing image + coordinates and apply it to the Earth texture.

## **Dependencies:** 
Modules 2, 3, 4 complete

## **Complexity:** 
High

## **AI Agent Prompt:**

```
Build the system that stamps user drawings onto the 3D Earth texture.

FILES:
- src/app/api/stamp/route.ts (API endpoint)
- src/lib/utils/textureManager.ts (texture manipulation)

STAMPING FLOW:
1. Client sends:
   - Drawing image (PNG blob)
   - Lat/long coordinates
   - Zoom level
   - User ID (for tracking)

2. Server:
   - Loads current Earth texture (from storage)
   - Converts lat/long + zoom → UV bounds
   - Composites drawing onto texture at correct position
   - Saves updated texture
   - Broadcasts update to all connected clients

TECHNICAL IMPLEMENTATION:

**API Route (stamp/route.ts):**
```typescript
POST /api/stamp
Body: {
  image: base64 string,
  lat: number,
  long: number,
  zoom: number,
  userId: string
}

Response: {
  success: boolean,
  stampId: string,
  textureVersion: number
}
```

**Texture Manager:**
- Use 'canvas' package for server-side image processing
- Earth texture stored as tiles (8x4 grid = 32 tiles of 2048x2048px each)
  - This prevents loading entire 16k texture each time
  - Only load/update affected tiles
- Drawing size on texture scales with zoom:
  - Zoom 1x (far): 256x256px stamp
  - Zoom 10x (close): 1024x1024px stamp

**Storage Strategy (MVP):**
- Store tiles in /public/textures/tiles/
- File naming: earth-tile-{x}-{y}.png
- Keep last 100 stamps in database (Supabase or JSON file)
- Each stamp record: {id, lat, long, timestamp, userId, tileAffected}

**Image Compositing:**
1. Determine which tile(s) the drawing affects
2. Load tile(s) from storage
3. Calculate exact pixel position using UV coords
4. Use Canvas API to composite drawing with alpha blending
5. Save updated tile(s)
6. Increment textureVersion counter

**Optimization:**
- Cache loaded tiles in memory (LRU cache, max 10 tiles)
- Compress tiles with PNG optimization
- Return textureVersion to client → client only re-fetches if version changed

EDGE CASES:
- Drawing spans multiple tiles → update all affected tiles
- Concurrent stamps → use mutex/lock to prevent race conditions
- Invalid coordinates → return error
- Image too large → reject or resize

OUTPUT:
- Working API endpoint that accepts drawings
- Texture manager that correctly composites images
- Tile-based storage system
- Error handling for all edge cases
```

## **Acceptance Criteria:**
- [ ] API endpoint accepts drawing + coordinates
- [ ] Drawing correctly positioned on texture
- [ ] Tile system works (only updates affected tiles)
- [ ] Multiple concurrent stamps handled safely
- [ ] Updated texture served to clients
- [ ] Performance: Stamp completes in <2 seconds

---

# ⚡ **MODULE 6: Real-time Updates System**

## **Goal:**
Broadcast new stamps to all connected users instantly.

## **Dependencies:** 
Module 5 complete

## **Complexity:** 
Medium

## **AI Agent Prompt:**

```
Build real-time update system so all users see new drawings immediately.

FILES:
- src/lib/utils/realtime.ts (WebSocket client)
- server/websocket.ts (WebSocket server, if not using Supabase)

APPROACH OPTIONS:
Choose ONE of these (recommend #2 for MVP):

**Option 1: Custom WebSocket Server**
- Node.js with 'ws' package
- Run alongside Next.js
- Manual connection management

**Option 2: Supabase Realtime (RECOMMENDED)**
- Use Supabase Realtime channels
- Zero infrastructure setup
- Built-in scaling

**Option 3: Firebase Realtime Database**
- Google Firebase
- Simple setup
- Good free tier

IMPLEMENTATION (using Supabase):

**Setup:**
1. Create Supabase project
2. Create 'stamps' table:
   ```sql
   create table stamps (
     id uuid primary key default uuid_generate_v4(),
     lat float not null,
     long float not null,
     texture_version int not null,
     user_id text,
     created_at timestamp default now()
   );
   ```
3. Enable Realtime for 'stamps' table

**Client (realtime.ts):**
```typescript
export function useRealtimeStamps(onNewStamp: (stamp: Stamp) => void) {
  // Subscribe to 'stamps' table changes
  // On INSERT → trigger onNewStamp callback
  // Return cleanup function
}
```

**Server Integration:**
- After successful stamp in Module 5:
  ```typescript
  // Insert record into Supabase
  await supabase.from('stamps').insert({
    lat, long, texture_version, user_id
  });
  // Supabase automatically broadcasts this to subscribers
  ```

**Client Updates:**
1. Globe3D component subscribes to useRealtimeStamps
2. On new stamp received:
   - Check if textureVersion > current version
   - If yes: Reload affected texture tile(s)
   - Show brief notification: "New drawing near [location]"

**Optimization:**
- Only reload tiles for stamps within current viewport
- Batch updates if many stamps arrive simultaneously
- Add 500ms debounce to prevent texture thrashing

**Activity Feed:**
Keep last 50 stamps in memory for feed display:
- "Drawing added in Tokyo" (2 seconds ago)
- "New art in Brazil" (15 seconds ago)

OUTPUT:
- Working realtime system
- All connected clients see updates within 1 second
- Efficient tile reloading
- Activity feed showing recent stamps
```

## **Acceptance Criteria:**
- [ ] New stamps broadcast to all clients
- [ ] Clients receive updates within 1 second
- [ ] Only affected tiles reload
- [ ] No memory leaks (cleanup on unmount)
- [ ] Activity feed displays recent stamps
- [ ] Works with 100+ concurrent users

---

# 🤖 **MODULE 7: AI Enhancement Feature**

## **Goal:**
Optional AI-powered drawing enhancement before stamping.

## **Dependencies:** 
Module 3 complete

## **Complexity:** 
Low

## **AI Agent Prompt:**

```
Build AI enhancement feature that stylizes user drawings using GPT-Vision.

FILES:
- src/components/AIEnhanceButton.tsx
- src/app/api/enhance/route.ts

FEATURE FLOW:
1. User finishes drawing
2. User clicks "AI Enhance" button
3. Modal appears with style options:
   - "Neon Glow"
   - "Oil Painting"
   - "Pixel Art"
   - "Sketch"
   - Or: Custom prompt (text input)
4. System sends drawing + style to API
5. API returns enhanced image
6. Enhanced image replaces canvas content
7. User can accept or revert

TECHNICAL IMPLEMENTATION:

**API Route (enhance/route.ts):**
```typescript
POST /api/enhance
Body: {
  image: base64 string,
  style: string (preset or custom prompt)
}

Process:
1. Convert image to GPT-Vision compatible format
2. Create prompt:
   "Transform this drawing into [STYLE]. 
    Keep the same composition and elements, 
    but apply the artistic style. 
    Output should be 1024x1024px."
3. Call OpenAI API:
   - Model: gpt-4-vision-preview OR dall-e-3
   - Include original image
   - Get enhanced image back
4. Return enhanced image as base64

Response: {
  success: boolean,
  enhancedImage: base64 string,
  cost: number (track for user limits)
}
```

**Cost Management (MVP):**
- Limit: 3 enhancements per user per day
- Track in localStorage or simple DB counter
- Show remaining uses in UI

**UI Component (AIEnhanceButton.tsx):**
- Button appears below drawing canvas
- Shows loading spinner during enhancement (can take 5-10 seconds)
- Preview enhanced result with Accept/Revert buttons
- Display error messages if API fails

**Style Presets:**
Define these prompts:
- Neon Glow: "vibrant neon colors with glowing edges"
- Oil Painting: "thick brushstrokes, impressionist style"
- Pixel Art: "8-bit retro pixel art style"
- Sketch: "pencil sketch with shading"

EDGE CASES:
- API timeout → show error, don't charge user quota
- NSFW content → API will reject, show appropriate error
- User spams button → debounce clicks

OPTIONAL UPGRADE:
- Add "Surprise Me" option that generates random style

OUTPUT:
- Working AI enhance button
- API integration with OpenAI
- Style selection UI
- Error handling
- Usage limits enforced
```

## **Acceptance Criteria:**
- [ ] AI Enhance button appears in drawing UI
- [ ] Style selection modal works
- [ ] API successfully enhances images
- [ ] Enhanced preview shows before accepting
- [ ] Usage limits enforced (3/day)
- [ ] Errors handled gracefully
- [ ] Average enhancement time <15 seconds

---

# 📱 **MODULE 8: Activity Feed & Polish**

## **Goal:**
Add activity feed sidebar and final UI polish.

## **Dependencies:** 
Modules 6, 7 complete

## **Complexity:** 
Low

## **AI Agent Prompt:**

```
Build the activity feed sidebar and apply final UI polish to complete MVP.

FILES:
- src/components/SidebarFeed.tsx
- src/components/Toolbar.tsx
- src/app/globals.css (polish)

ACTIVITY FEED (SidebarFeed.tsx):

**Layout:**
- Right sidebar (320px wide)
- Collapsible on mobile (hamburger menu)
- Scrollable list of recent activity

**Content:**
Display last 50 stamps in reverse chronological order:
```
┌─────────────────────────┐
│ 🌍 Recent Activity      │
├─────────────────────────┤
│ 🎨 Drawing in Tokyo     │
│    2 seconds ago        │
├─────────────────────────┤
│ 🖼️ New art in Paris     │
│    45 seconds ago       │
├─────────────────────────┤
│ ✨ Enhanced in NYC      │
│    2 minutes ago        │
└─────────────────────────┘
```

**Features:**
- Click entry → fly camera to that location on globe
- Show drawing thumbnail (small preview)
- Relative timestamps ("2 min ago", "1 hour ago")
- Auto-scroll to newest (with pause on user scroll)
- "Near You" indicator if within 500km of user location

**Data Source:**
- Subscribe to realtime stamps (from Module 6)
- Filter out user's own stamps (optional)
- Add location names using reverse geocoding (optional, can use lat/long labels for MVP)

TOOLBAR (Toolbar.tsx):

**Top Toolbar:**
Position: Top-right corner
Contains:
- Logo/Title: "PlanetCanvas 3D"
- "How to Use" button (opens tutorial modal)
- "Reset View" button (returns globe to default position)
- User indicator (guest ID or login button)

**Drawing Mode Toolbar:**
Already built in Module 3, but add:
- "Exit Drawing Mode" button
- Coordinates display showing current region

FINAL POLISH:

**Animations:**
- Fade-in for feed items
- Smooth globe rotation transitions
- Button hover states (scale 1.05)
- Drawing canvas slide-in animation

**Responsive Design:**
- Desktop: Feed sidebar + globe + drawing overlay
- Tablet: Collapsible sidebar
- Mobile: 
  - Hide sidebar by default (tap icon to show)
  - Simplified drawing tools
  - Touch-optimized controls

**Loading States:**
- Globe loading: Show spinning Earth icon
- Texture loading: Progressive enhancement (low-res → high-res)
- Stamp processing: Progress indicator

**Error States:**
- Failed to load texture: Retry button
- Lost connection: "Reconnecting..." banner
- API errors: Toast notifications (bottom-right)

**Accessibility:**
- All buttons have aria-labels
- Keyboard navigation support
- Focus indicators
- Color contrast passes WCAG AA

**Performance:**
- Lazy load texture tiles
- Virtualize feed (only render visible items)
- Optimize re-renders with React.memo

VISUAL THEME:
- Dark mode (#0a0a0a background)
- Neon blue accents (#00f0ff)
- Subtle glow effects
- Glassmorphism for panels (backdrop-blur)

OUTPUT:
- Polished, production-ready UI
- Activity feed fully functional
- All states handled (loading, error, empty)
- Responsive across devices
- Smooth animations
- Accessible
```

## **Acceptance Criteria:**
- [ ] Activity feed displays recent stamps
- [ ] Click stamp → camera flies to location
- [ ] Toolbar contains all specified elements
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] All loading states implemented
- [ ] Error states handled with user-friendly messages
- [ ] Animations smooth (60fps)
- [ ] Passes accessibility audit
- [ ] No console errors

---

# 🚀 **DEPLOYMENT CHECKLIST**

After all modules complete:

**Pre-Launch:**
- [ ] Load high-quality Earth texture (8K minimum)
- [ ] Set up Supabase/Firebase production environment
- [ ] Configure environment variables
- [ ] Test with 10+ concurrent users
- [ ] Mobile device testing (iOS + Android)
- [ ] Load testing (simulate 100 stamps in 1 minute)
- [ ] Add basic content moderation (NSFW filter on API)

**Launch Day:**
- [ ] Deploy to Vercel/Netlify
- [ ] Monitor error rates
- [ ] Watch realtime connection count
- [ ] Prepare for viral traffic (CDN for textures)

**Post-Launch:**
- [ ] Collect user feedback
- [ ] Monitor API costs (OpenAI usage)
- [ ] Track popular drawing locations
- [ ] Plan Phase 2 features based on usage data

---

# 📊 **SUCCESS METRICS**

Track these from day 1:

**Engagement:**
- Stamps per day
- Average drawings per user
- Return user rate

**Technical:**
- Average stamp processing time
- Realtime connection stability
- API error rate
- Page load time

**Viral Potential:**
- Shares on social media
- Geographic distribution of users
- Peak concurrent users

---

# 💡 **TIPS FOR USING THIS WITH AI AGENTS**

1. **Sequential Execution:** Build modules 1→2→3→4→5→6→7→8 in order unless you understand dependencies

2. **Parallel Tracks:** 
   - Track A: Modules 1→2→4→5→6
   - Track B: Modules 1→3→7
   - Track C: Module 8 (after A+B complete)

3. **Prompt Refinement:** If AI agent struggles with a module:
   - Break it into sub-tasks
   - Provide example code snippets
   - Reference similar open-source projects

4. **Testing Each Module:** After each module:
   - Ask AI to generate test cases
   - Manually verify acceptance criteria
   - Fix bugs before moving to next module

5. **Integration Points:** Pay special attention to:
   - Module 2→3 integration (globe triggers canvas)
   - Module 4→5 integration (coordinates to texture)
   - Module 5→6 integration (stamp to broadcast)

---

# 🎯 **READY TO BUILD?**

You now have a complete, modular plan to build PlanetCanvas 3D MVP using AI coding agents.

**Suggested workflow:**
1. Copy each module's "AI Agent Prompt" section
2. Paste into your AI coding agent (Cursor, GitHub Copilot, Claude, etc.)
3. Review generated code
4. Test acceptance criteria
5. Commit to git
6. Move to next module

**Estimated total development time:** 40-60 hours (with AI assistance)

**Next step:** Tell me "proceed with Module X" and I'll provide an even more detailed prompt with code examples and implementation specifics.

---

*Good luck building the future of collaborative digital art! 🌍✨*
