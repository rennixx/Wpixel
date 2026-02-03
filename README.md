# 🌍 PlanetCanvas 3D

A collaborative 3D Earth drawing platform where users can draw on any location and share their artwork with the world in real-time.

## ✨ Features

- **Interactive 3D Globe** - Smooth rotation, zoom, and click-to-select using Three.js
- **Drawing Tools** - Pencil, brush, and eraser with customizable colors and sizes
- **Real-time Updates** - See drawings from around the world appear instantly
- **AI Enhancement** - Transform your artwork with various AI-powered styles
- **Activity Feed** - Live feed showing recent drawing activity globally
- **Location-Based** - Each drawing is pinned to its geographic coordinates

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 |
| **3D Graphics** | Three.js, @react-three/fiber, @react-three/drei |
| **Backend** | Supabase (Database, Storage, Realtime) |
| **AI** | OpenAI API (DALL-E) |
| **Styling** | Tailwind CSS, Framer Motion |
| **State** | Zustand |

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PlanetCanvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Fill in your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Set up Supabase**

   Create a new Supabase project and run the SQL from `planetcanvas_complete_guide.md`:
   - Create `users` table
   - Create `drawings` table
   - Create `activity` table
   - Enable Realtime on `drawings` and `activity` tables
   - Create a storage bucket named `drawings`

5. **Add Earth texture**

   Download an Earth texture and place it at:
   ```
   public/textures/earth-8k.jpg
   ```

   You can get high-quality Earth textures from:
   - [Solar System Scope](https://www.solarsystemscope.com/textures/)
   - [NASA Visible Earth](https://visibleearth.nasa.gov/)

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 Usage

### Drawing on the Globe

1. **Click anywhere** on the 3D globe to select a region
2. **Draw** using the canvas tools (pencil, brush, eraser)
3. **Customize** your brush color and size
4. **Click "Stamp to Globe"** to save your artwork

### AI Enhancement

1. Create a drawing
2. Click the **✨ AI Enhance** button
3. Choose a style (Natural, Watercolor, Pixel Art, Sketch, Vibrant)
4. Wait for the AI to transform your artwork

### Activity Feed

- View the **Live Activity** sidebar on the right
- Click on any activity to **fly to that location**
- Toggle **auto-scroll** to control the feed behavior

## 📁 Project Structure

```
PlanetCanvas/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes (stamp, enhance, activity)
│   │   ├── page.tsx        # Main page
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── Globe3D.tsx
│   │   ├── DrawingCanvas.tsx
│   │   ├── DrawingTools.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── AIEnhanceButton.tsx
│   │   └── StampButton.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useDrawing.ts
│   │   ├── useGlobe.ts
│   │   └── useRealtime.ts
│   ├── lib/               # Utility libraries
│   │   ├── supabase.ts
│   │   └── globe-utils.ts
│   └── types/             # TypeScript types
│       ├── drawing.ts
│       └── globe.ts
├── public/
│   └── textures/
│       └── earth-8k.jpg
└── package.json
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## 📝 Development Roadmap

- [x] Week 1: 3D Globe Foundation
- [x] Week 2: Drawing System Integration
- [x] Week 3: AI Enhancement & Polish
- [ ] Week 4: Production Deployment

### Future Features

- [ ] User authentication (Google, Discord)
- [ ] Drawing galleries and profiles
- [ ] Social features (like, comment, share)
- [ ] Advanced drawing tools (layers, shapes, text)
- [ ] Mobile app (React Native)
- [ ] VR/AR support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Earth textures from [NASA](https://visibleearth.nasa.gov/)
- Built with [Three.js](https://threejs.org/)
- Powered by [Supabase](https://supabase.com/)
- AI features by [OpenAI](https://openai.com/)

---

**Made with 🌍 and ❤️ by the PlanetCanvas team**
