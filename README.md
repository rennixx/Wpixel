# 🌍 PlanetCanvas 3D

A collaborative 3D digital canvas where users can draw and stamp artwork onto a shared Earth globe in real-time.

![PlanetCanvas 3D](./docs/preview.png)

## ✨ Features

- **3D Interactive Globe** - Navigate a beautiful 3D Earth with smooth rotation and zoom
- **Drawing Canvas** - Create artwork with customizable brushes, colors, and sizes
- **AI Enhancement** - Transform your drawings with AI-powered style transfer
- **Real-time Updates** - See other users' drawings appear instantly
- **Activity Feed** - Track recent stamps from around the world

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/planetcanvas-3d.git
cd planetcanvas-3d
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:
- `OPENAI_API_KEY` - For AI enhancement feature (optional)
- `NEXT_PUBLIC_SUPABASE_URL` - For real-time features (optional)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

4. Add an Earth texture:
   - Download a high-quality Earth texture from [NASA Visible Earth](https://visibleearth.nasa.gov/)
   - Save it as `public/textures/earth-8k.jpg`

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🎮 How to Use

1. **Navigate** - Click and drag to rotate the Earth, scroll to zoom
2. **Select Region** - Double-click anywhere to open the drawing canvas
3. **Draw** - Use the brush tools to create your artwork
4. **Enhance** (Optional) - Apply AI styles to transform your drawing
5. **Stamp** - Your drawing is permanently added to the shared Earth!

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **3D Graphics**: Three.js + React Three Fiber
- **Styling**: Tailwind CSS
- **Real-time**: Supabase Realtime (or WebSocket)
- **AI**: OpenAI DALL-E 3
- **Language**: TypeScript

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main canvas page
│   ├── layout.tsx        # Root layout
│   └── api/
│       ├── stamp/        # Stamp API endpoint
│       └── enhance/      # AI enhancement endpoint
├── components/
│   ├── Globe3D.tsx       # 3D Earth component
│   ├── DrawCanvas.tsx    # Drawing canvas overlay
│   ├── SidebarFeed.tsx   # Activity feed sidebar
│   ├── AIEnhanceButton.tsx # AI enhancement modal
│   └── Toolbar.tsx       # Navigation toolbar
├── lib/
│   ├── utils/
│   │   ├── coordinates.ts # Lat/long conversions
│   │   ├── realtime.ts    # WebSocket utilities
│   │   └── textureManager.ts # Texture handling
│   └── types/
│       └── drawing.ts     # TypeScript types
└── styles/
    └── globals.css        # Global styles
```

## 🎨 Customization

### Earth Texture

For best results, use an 8K equirectangular Earth texture. Recommended sources:
- [NASA Visible Earth](https://visibleearth.nasa.gov/)
- [Solar System Scope Textures](https://www.solarsystemscope.com/textures/)

### AI Styles

Edit the style presets in `src/components/AIEnhanceButton.tsx`:

```typescript
const enhanceStyles = [
  { id: "neon", name: "Neon Glow", prompt: "..." },
  { id: "oil", name: "Oil Painting", prompt: "..." },
  // Add your own styles!
];
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Self-hosted with Docker

## 📊 API Reference

### POST /api/stamp

Stamp a drawing onto the globe.

```typescript
Request: {
  image: string;    // Base64 encoded PNG
  lat: number;      // Latitude (-90 to 90)
  long: number;     // Longitude (-180 to 180)
  zoom: number;     // Zoom level (1-10)
  userId: string;   // User identifier
}

Response: {
  success: boolean;
  stampId: string;
  textureVersion: number;
}
```

### POST /api/enhance

Enhance a drawing with AI.

```typescript
Request: {
  image: string;    // Base64 encoded PNG
  style: string;    // Style name or custom prompt
}

Response: {
  success: boolean;
  enhancedImage: string;  // Base64 encoded PNG
  cost: number;           // API cost
}
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🙏 Acknowledgments

- Earth textures from NASA
- Three.js community
- React Three Fiber team

---

Built with ❤️ for the global creative community
