"use client";

import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { Region } from "@/lib/types/drawing";
import { xyzToLatLong } from "@/lib/utils/coordinates";

interface Globe3DProps {
  onRegionClick: (lat: number, long: number, zoom: number) => void;
  selectedRegion: Region | null;
  isDrawingMode: boolean;
}

interface EarthProps {
  onRegionClick: (lat: number, long: number, zoom: number) => void;
  selectedRegion: Region | null;
  isDrawingMode: boolean;
}

// GeoJSON types
interface GeoJSONFeature {
  type: string;
  properties: {
    NAME?: string;
    ADMIN?: string;
    CONTINENT?: string;
    POP_EST?: number;
    LABEL_X?: number;
    LABEL_Y?: number;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoJSONData {
  type: string;
  features: GeoJSONFeature[];
}

// Earth component inside Canvas
function Earth({ onRegionClick, selectedRegion, isDrawingMode }: EarthProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ lat: number; long: number } | null>(null);
  const [earthTexture, setEarthTexture] = useState<THREE.Texture | null>(null);
  const { camera, gl } = useThree();
  
  // Generate Earth texture from local GeoJSON
  useEffect(() => {
    const generateTexture = async () => {
      const canvas = document.createElement("canvas");
      const width = 8192;  // 8K resolution
      const height = 4096;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) return;

      // Helper: lat/long to canvas coordinates (Equirectangular projection)
      const toXY = (lat: number, lng: number): [number, number] => {
        const x = ((lng + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        return [x, y];
      };

      // Ocean background - natural light blue
      ctx.fillStyle = "#87CEEB";  // Sky blue - natural ocean color
      ctx.fillRect(0, 0, width, height);

      try {
        // Load local GeoJSON
        const response = await fetch("/data/countries.geojson");
        if (!response.ok) throw new Error("Failed to fetch GeoJSON");
        const geoData: GeoJSONData = await response.json();
        
        console.log("GeoJSON loaded successfully, features:", geoData.features.length);

        // Helper to draw a single polygon ring
        const drawPolygonRing = (coords: number[][]) => {
          if (coords.length < 3) return;
          ctx.beginPath();
          const [startX, startY] = toXY(coords[0][1], coords[0][0]);
          ctx.moveTo(startX, startY);
          for (let i = 1; i < coords.length; i++) {
            const [x, y] = toXY(coords[i][1], coords[i][0]);
            ctx.lineTo(x, y);
          }
          ctx.closePath();
        };

        // First pass: fill all countries with land color
        for (const feature of geoData.features) {
          const { geometry } = feature;
          
          // Google Maps roadmap style - light beige/tan for land
          ctx.fillStyle = "#f5f3ef";

          if (geometry.type === "Polygon") {
            const rings = geometry.coordinates as number[][][];
            drawPolygonRing(rings[0]);
            ctx.fill();
          } else if (geometry.type === "MultiPolygon") {
            const multiPolys = geometry.coordinates as number[][][][];
            for (const polygon of multiPolys) {
              drawPolygonRing(polygon[0]);
              ctx.fill();
            }
          }
        }

        // Second pass: draw country borders
        ctx.strokeStyle = "#a0a0a0";
        ctx.lineWidth = 3;  // Thicker for 8K
        
        for (const feature of geoData.features) {
          const { geometry } = feature;

          if (geometry.type === "Polygon") {
            const rings = geometry.coordinates as number[][][];
            drawPolygonRing(rings[0]);
            ctx.stroke();
          } else if (geometry.type === "MultiPolygon") {
            const multiPolys = geometry.coordinates as number[][][][];
            for (const polygon of multiPolys) {
              drawPolygonRing(polygon[0]);
              ctx.stroke();
            }
          }
        }

        // Third pass: draw country labels
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Country size categories for label sizing
        const largeCountries = new Set([
          "Russia", "China", "United States of America", "Canada", "Brazil", 
          "Australia", "India", "Argentina", "Kazakhstan", "Algeria"
        ]);
        const mediumCountries = new Set([
          "Saudi Arabia", "Mexico", "Indonesia", "Sudan", "Libya", "Iran", 
          "Mongolia", "Peru", "Chad", "Niger", "Angola", "Mali", "South Africa", 
          "Colombia", "Ethiopia", "Egypt", "Nigeria", "Dem. Rep. Congo", 
          "Greenland", "France", "Spain", "Ukraine", "Poland", "Germany",
          "Turkey", "Thailand", "Pakistan", "Japan", "Italy", "United Kingdom",
          "Philippines", "Vietnam", "Malaysia", "Tanzania", "Kenya", "Venezuela",
          "Chile", "Myanmar", "Afghanistan", "Somalia", "Bolivia", "Paraguay",
          "South Sudan", "Central African Rep.", "Zambia", "Mozambique", "Madagascar"
        ]);
        
        for (const feature of geoData.features) {
          const name = feature.properties?.NAME || feature.properties?.ADMIN;
          if (!name) continue;
          
          // Use LABEL_X and LABEL_Y from GeoJSON if available (better positioning)
          let labelLat = feature.properties?.LABEL_Y;
          let labelLng = feature.properties?.LABEL_X;
          
          // Fall back to centroid calculation if not available
          if (labelLat === undefined || labelLng === undefined) {
            const { geometry } = feature;
            let coords: number[][] = [];
            
            if (geometry.type === "Polygon") {
              coords = (geometry.coordinates as number[][][])[0];
            } else if (geometry.type === "MultiPolygon") {
              // Use the largest polygon
              let maxLen = 0;
              for (const poly of geometry.coordinates as number[][][][]) {
                if (poly[0].length > maxLen) {
                  maxLen = poly[0].length;
                  coords = poly[0];
                }
              }
            }
            
            if (coords.length === 0) continue;
            
            let sumX = 0, sumY = 0;
            for (const coord of coords) {
              sumX += coord[0];
              sumY += coord[1];
            }
            labelLng = sumX / coords.length;
            labelLat = sumY / coords.length;
          }
          
          const [labelX, labelY] = toXY(labelLat, labelLng);
          
          // Determine font size based on country importance
          let fontSize = 0;
          const pop = feature.properties?.POP_EST || 0;
          
          if (largeCountries.has(name)) {
            fontSize = 56;
          } else if (mediumCountries.has(name)) {
            fontSize = 40;
          } else if (pop > 30000000) {
            fontSize = 32;
          } else if (pop > 10000000) {
            fontSize = 24;
          } else if (pop > 1000000) {
            fontSize = 18;
          }
          // Skip very small countries
          
          if (fontSize > 0) {
            // Draw text with outline for readability
            ctx.font = `bold ${fontSize}px Arial, sans-serif`;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 5;  // Thicker outline for 8K
            ctx.strokeText(name, labelX, labelY);
            ctx.fillStyle = "#333333";
            ctx.fillText(name, labelX, labelY);
          }
        }

        // Draw ocean labels - positioned at center of each ocean
        ctx.fillStyle = "#6b95b8";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        
        const drawOceanLabel = (text: string, x: number, y: number, size: number) => {
          ctx.font = `italic ${size}px Georgia, serif`;
          ctx.strokeText(text, x, y);
          ctx.fillText(text, x, y);
        };
        
        // Pacific Ocean (two labels - west and east sides)
        drawOceanLabel("PACIFIC OCEAN", width * 0.12, height * 0.52, 64);
        drawOceanLabel("PACIFIC OCEAN", width * 0.88, height * 0.52, 64);
        // Atlantic Ocean - centered between Americas and Europe/Africa
        drawOceanLabel("ATLANTIC OCEAN", width * 0.42, height * 0.42, 56);
        // Indian Ocean - between Africa, Asia, and Australia  
        drawOceanLabel("INDIAN OCEAN", width * 0.72, height * 0.60, 56);
        // Arctic Ocean - top center
        drawOceanLabel("ARCTIC OCEAN", width * 0.5, height * 0.07, 48);
        // Southern Ocean - bottom center
        drawOceanLabel("SOUTHERN OCEAN", width * 0.5, height * 0.90, 48);

      } catch (error) {
        console.error("Failed to load GeoJSON:", error);
        // Draw a simple fallback earth
        ctx.fillStyle = "#4a9c59";
        // Simple continent shapes as fallback
        ctx.beginPath();
        ctx.arc(width * 0.3, height * 0.35, 200, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(width * 0.65, height * 0.35, 250, 0, Math.PI * 2);
        ctx.fill();
      }

      // Create texture from canvas with high quality settings
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      // Use maximum anisotropy from the renderer
      const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
      texture.anisotropy = maxAnisotropy;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
      
      console.log("Earth texture generated (8K) with anisotropy:", maxAnisotropy);
      setEarthTexture(texture);
    };

    generateTexture();
  }, [gl]);
  
  // Raycaster for click detection
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // Handle mouse move for hover effects
  const handlePointerMove = useCallback((event: THREE.Event) => {
    if (isDrawingMode || !meshRef.current) return;

    const intersects = (event as unknown as { intersections: THREE.Intersection[] }).intersections;
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const coords = xyzToLatLong(point.x, point.y, point.z, 1);
      setHoveredPoint(coords);
      setHovered(true);
    } else {
      setHovered(false);
      setHoveredPoint(null);
    }
  }, [isDrawingMode]);

  // Handle double click to select region
  const handleDoubleClick = useCallback((event: THREE.Event) => {
    if (isDrawingMode || !meshRef.current) return;

    const intersects = (event as unknown as { intersections: THREE.Intersection[] }).intersections;
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const coords = xyzToLatLong(point.x, point.y, point.z, 1);
      
      // Calculate zoom based on camera distance
      const distance = camera.position.length();
      const zoom = Math.max(1, Math.min(10, (4 / distance) * 5));
      
      onRegionClick(coords.lat, coords.long, zoom);
    }
  }, [camera, isDrawingMode, onRegionClick]);

  // Rotate earth slowly when not interacting
  useFrame((state, delta) => {
    if (meshRef.current && !hovered && !selectedRegion) {
      meshRef.current.rotation.y += delta * 0.03;
    }
    
    // Sync glow rotation
    if (glowRef.current && meshRef.current) {
      glowRef.current.rotation.y = meshRef.current.rotation.y;
    }
  });

  // Smooth camera animation to selected region
  useEffect(() => {
    if (selectedRegion && !isDrawingMode) {
      // Convert lat/long to camera position
      const phi = (90 - selectedRegion.lat) * (Math.PI / 180);
      const theta = (selectedRegion.long + 180) * (Math.PI / 180);
      
      const distance = 2.5 / selectedRegion.zoom;
      const x = distance * Math.sin(phi) * Math.cos(theta);
      const y = distance * Math.cos(phi);
      const z = distance * Math.sin(phi) * Math.sin(theta);
      
      // Animate camera
      const startPos = camera.position.clone();
      const endPos = new THREE.Vector3(x, y, z);
      
      let t = 0;
      const animate = () => {
        t += 0.02;
        if (t <= 1) {
          camera.position.lerpVectors(startPos, endPos, easeOutCubic(t));
          camera.lookAt(0, 0, 0);
          requestAnimationFrame(animate);
        }
      };
      animate();
    }
  }, [selectedRegion, isDrawingMode, camera]);

  return (
    <group>
      {/* Earth sphere */}
      <mesh
        ref={meshRef}
        onPointerMove={handlePointerMove}
        onPointerOut={() => {
          setHovered(false);
          setHoveredPoint(null);
        }}
        onDoubleClick={handleDoubleClick}
      >
        <sphereGeometry args={[1, 256, 256]} />
        <meshStandardMaterial 
          key={earthTexture ? "textured" : "plain"}
          map={earthTexture}
          color={earthTexture ? "#ffffff" : "#a8d5e5"}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Atmospheric glow - inner (light blue for roadmap style) */}
      <mesh ref={glowRef} scale={1.008}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#87ceeb"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Atmospheric glow - outer */}
      <mesh scale={1.03}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#5bb5e0"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Hover indicator */}
      {hovered && hoveredPoint && (
        <mesh
          position={[
            Math.cos(hoveredPoint.lat * Math.PI / 180) * Math.sin(hoveredPoint.long * Math.PI / 180) * 1.01,
            Math.sin(hoveredPoint.lat * Math.PI / 180) * 1.01,
            Math.cos(hoveredPoint.lat * Math.PI / 180) * Math.cos(hoveredPoint.long * Math.PI / 180) * 1.01,
          ]}
        >
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
      )}

      {/* Selected region marker */}
      {selectedRegion && (
        <mesh
          position={[
            Math.cos(selectedRegion.lat * Math.PI / 180) * Math.sin(selectedRegion.long * Math.PI / 180) * 1.01,
            Math.sin(selectedRegion.lat * Math.PI / 180) * 1.01,
            Math.cos(selectedRegion.lat * Math.PI / 180) * Math.cos(selectedRegion.long * Math.PI / 180) * 1.01,
          ]}
        >
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="#ff00ff" />
        </mesh>
      )}
    </group>
  );
}

// Lighting setup - even lighting for roadmap style
function Lighting() {
  return (
    <>
      {/* Strong ambient light for flat/even look */}
      <ambientLight intensity={2} color="#ffffff" />
      
      {/* Subtle directional for slight depth */}
      <directionalLight 
        position={[5, 3, 5]} 
        intensity={1} 
        color="#ffffff"
      />
      <directionalLight 
        position={[-5, -3, -5]} 
        intensity={0.5} 
        color="#ffffff"
      />
    </>
  );
}

// Camera controls
function CameraController({ isDrawingMode }: { isDrawingMode: boolean }) {
  const controlsRef = useRef<any>(null);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={!isDrawingMode}
      enableRotate={!isDrawingMode}
      minDistance={1.05}
      maxDistance={5}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      enableDamping
      dampingFactor={0.05}
    />
  );
}

// Fallback Earth texture generator
function FallbackEarthTexture() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        color="#1a4a7a"
        roughness={0.8}
        metalness={0.1}
        wireframe={false}
      />
    </mesh>
  );
}

// Main Globe3D component
export default function Globe3D({ onRegionClick, selectedRegion, isDrawingMode }: Globe3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 45 }}
      gl={{ 
        antialias: true, 
        alpha: true,
        powerPreference: "high-performance",
        pixelRatio: Math.min(window.devicePixelRatio, 2)
      }}
      style={{ background: "#0a0a0a" }}
      onCreated={({ gl }) => {
        // Enable maximum anisotropic filtering
        const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
        console.log("Max anisotropy:", maxAnisotropy);
      }}
    >
      <Suspense fallback={<FallbackEarthTexture />}>
        <Earth
          onRegionClick={onRegionClick}
          selectedRegion={selectedRegion}
          isDrawingMode={isDrawingMode}
        />
      </Suspense>
      <Lighting />
      <CameraController isDrawingMode={isDrawingMode} />
      <Stars radius={100} depth={50} count={5000} factor={4} fade speed={1} />
    </Canvas>
  );
}

// Easing function
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
