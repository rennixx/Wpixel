"use client";

import { useRef, useState, useEffect, useCallback, Suspense, useMemo } from "react";
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

// Major world cities data for roadmap detail
const WORLD_CITIES = [
  // North America
  { name: "New York", lat: 40.7128, lng: -74.006, pop: 8336817 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437, pop: 3979576 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298, pop: 2693976 },
  { name: "Houston", lat: 29.7604, lng: -95.3698, pop: 2320268 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832, pop: 2731571 },
  { name: "Mexico City", lat: 19.4326, lng: -99.1332, pop: 9209944 },
  { name: "Miami", lat: 25.7617, lng: -80.1918, pop: 467963 },
  { name: "San Francisco", lat: 37.7749, lng: -122.4194, pop: 883305 },
  { name: "Vancouver", lat: 49.2827, lng: -123.1207, pop: 675218 },
  { name: "Washington D.C.", lat: 38.9072, lng: -77.0369, pop: 705749 },
  // South America
  { name: "São Paulo", lat: -23.5505, lng: -46.6333, pop: 12325232 },
  { name: "Buenos Aires", lat: -34.6037, lng: -58.3816, pop: 3075646 },
  { name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729, pop: 6748000 },
  { name: "Lima", lat: -12.0464, lng: -77.0428, pop: 9751717 },
  { name: "Bogotá", lat: 4.711, lng: -74.0721, pop: 7181469 },
  { name: "Santiago", lat: -33.4489, lng: -70.6693, pop: 6158080 },
  // Europe
  { name: "London", lat: 51.5074, lng: -0.1278, pop: 8982000 },
  { name: "Paris", lat: 48.8566, lng: 2.3522, pop: 2161000 },
  { name: "Berlin", lat: 52.52, lng: 13.405, pop: 3748148 },
  { name: "Madrid", lat: 40.4168, lng: -3.7038, pop: 3223334 },
  { name: "Rome", lat: 41.9028, lng: 12.4964, pop: 2860009 },
  { name: "Moscow", lat: 55.7558, lng: 37.6173, pop: 12537954 },
  { name: "Istanbul", lat: 41.0082, lng: 28.9784, pop: 15462452 },
  { name: "Amsterdam", lat: 52.3676, lng: 4.9041, pop: 872680 },
  { name: "Vienna", lat: 48.2082, lng: 16.3738, pop: 1911191 },
  { name: "Barcelona", lat: 41.3851, lng: 2.1734, pop: 1620343 },
  { name: "Munich", lat: 48.1351, lng: 11.582, pop: 1471508 },
  { name: "Warsaw", lat: 52.2297, lng: 21.0122, pop: 1790658 },
  { name: "Prague", lat: 50.0755, lng: 14.4378, pop: 1309000 },
  { name: "Athens", lat: 37.9838, lng: 23.7275, pop: 664046 },
  // Asia
  { name: "Tokyo", lat: 35.6762, lng: 139.6503, pop: 13960000 },
  { name: "Beijing", lat: 39.9042, lng: 116.4074, pop: 21540000 },
  { name: "Shanghai", lat: 31.2304, lng: 121.4737, pop: 24870000 },
  { name: "Mumbai", lat: 19.076, lng: 72.8777, pop: 12478447 },
  { name: "Delhi", lat: 28.6139, lng: 77.209, pop: 16787941 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198, pop: 5685807 },
  { name: "Hong Kong", lat: 22.3193, lng: 114.1694, pop: 7482500 },
  { name: "Seoul", lat: 37.5665, lng: 126.978, pop: 9776000 },
  { name: "Bangkok", lat: 13.7563, lng: 100.5018, pop: 10539000 },
  { name: "Jakarta", lat: -6.2088, lng: 106.8456, pop: 10562088 },
  { name: "Dubai", lat: 25.2048, lng: 55.2708, pop: 3331420 },
  { name: "Taipei", lat: 25.033, lng: 121.5654, pop: 2646204 },
  { name: "Osaka", lat: 34.6937, lng: 135.5023, pop: 2750995 },
  { name: "Kuala Lumpur", lat: 3.139, lng: 101.6869, pop: 1768000 },
  { name: "Manila", lat: 14.5995, lng: 120.9842, pop: 1780148 },
  // Africa
  { name: "Cairo", lat: 30.0444, lng: 31.2357, pop: 9500000 },
  { name: "Lagos", lat: 6.5244, lng: 3.3792, pop: 14862000 },
  { name: "Johannesburg", lat: -26.2041, lng: 28.0473, pop: 5635127 },
  { name: "Nairobi", lat: -1.2921, lng: 36.8219, pop: 4397073 },
  { name: "Cape Town", lat: -33.9249, lng: 18.4241, pop: 4618000 },
  { name: "Casablanca", lat: 33.5731, lng: -7.5898, pop: 3359818 },
  { name: "Addis Ababa", lat: 9.0054, lng: 38.7636, pop: 3352000 },
  // Oceania
  { name: "Sydney", lat: -33.8688, lng: 151.2093, pop: 5312163 },
  { name: "Melbourne", lat: -37.8136, lng: 144.9631, pop: 5078193 },
  { name: "Auckland", lat: -36.8509, lng: 174.7645, pop: 1657200 },
  { name: "Brisbane", lat: -27.4698, lng: 153.0251, pop: 2514184 },
  { name: "Perth", lat: -31.9505, lng: 115.8605, pop: 2085973 },
];

// Earth component inside Canvas
function Earth({ onRegionClick, selectedRegion, isDrawingMode }: EarthProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ lat: number; long: number } | null>(null);
  const [countryTexture, setCountryTexture] = useState<THREE.Texture | null>(null);
  const [roadmapTexture, setRoadmapTexture] = useState<THREE.Texture | null>(null);
  const [blendFactor, setBlendFactor] = useState(0);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { camera, gl } = useThree();
  
  // Generate both textures from local GeoJSON
  useEffect(() => {
    const generateTextures = async () => {
      const width = 8192;  // 8K resolution
      const height = 4096;
      
      // Helper: lat/long to canvas coordinates (Equirectangular projection)
      const toXY = (lat: number, lng: number): [number, number] => {
        const x = ((lng + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        return [x, y];
      };

      try {
        // Load local GeoJSON
        const response = await fetch("/data/countries.geojson");
        if (!response.ok) throw new Error("Failed to fetch GeoJSON");
        const geoData: GeoJSONData = await response.json();
        
        console.log("GeoJSON loaded successfully, features:", geoData.features.length);

        // Helper to draw a single polygon ring
        const drawPolygonRing = (ctx: CanvasRenderingContext2D, coords: number[][]) => {
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

        // ============ TEXTURE 1: Country View (Far) ============
        const canvas1 = document.createElement("canvas");
        canvas1.width = width;
        canvas1.height = height;
        const ctx1 = canvas1.getContext("2d")!;
        
        // Ocean
        ctx1.fillStyle = "#87CEEB";
        ctx1.fillRect(0, 0, width, height);

        // Fill countries
        ctx1.fillStyle = "#f5f3ef";
        for (const feature of geoData.features) {
          const { geometry } = feature;
          if (geometry.type === "Polygon") {
            drawPolygonRing(ctx1, (geometry.coordinates as number[][][])[0]);
            ctx1.fill();
          } else if (geometry.type === "MultiPolygon") {
            for (const polygon of geometry.coordinates as number[][][][]) {
              drawPolygonRing(ctx1, polygon[0]);
              ctx1.fill();
            }
          }
        }

        // Country borders
        ctx1.strokeStyle = "#a0a0a0";
        ctx1.lineWidth = 3;
        for (const feature of geoData.features) {
          const { geometry } = feature;
          if (geometry.type === "Polygon") {
            drawPolygonRing(ctx1, (geometry.coordinates as number[][][])[0]);
            ctx1.stroke();
          } else if (geometry.type === "MultiPolygon") {
            for (const polygon of geometry.coordinates as number[][][][]) {
              drawPolygonRing(ctx1, polygon[0]);
              ctx1.stroke();
            }
          }
        }

        // Country labels (large only)
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

        ctx1.textAlign = "center";
        ctx1.textBaseline = "middle";
        
        for (const feature of geoData.features) {
          const name = feature.properties?.NAME || feature.properties?.ADMIN;
          if (!name) continue;
          
          let labelLat = feature.properties?.LABEL_Y;
          let labelLng = feature.properties?.LABEL_X;
          
          if (labelLat === undefined || labelLng === undefined) {
            const { geometry } = feature;
            let coords: number[][] = [];
            if (geometry.type === "Polygon") {
              coords = (geometry.coordinates as number[][][])[0];
            } else if (geometry.type === "MultiPolygon") {
              let maxLen = 0;
              for (const poly of geometry.coordinates as number[][][][]) {
                if (poly[0].length > maxLen) { maxLen = poly[0].length; coords = poly[0]; }
              }
            }
            if (coords.length === 0) continue;
            let sumX = 0, sumY = 0;
            for (const coord of coords) { sumX += coord[0]; sumY += coord[1]; }
            labelLng = sumX / coords.length;
            labelLat = sumY / coords.length;
          }
          
          const [labelX, labelY] = toXY(labelLat, labelLng);
          const pop = feature.properties?.POP_EST || 0;
          
          let fontSize = 0;
          if (largeCountries.has(name)) fontSize = 56;
          else if (mediumCountries.has(name)) fontSize = 40;
          else if (pop > 30000000) fontSize = 32;
          else if (pop > 10000000) fontSize = 24;
          else if (pop > 1000000) fontSize = 18;
          
          if (fontSize > 0) {
            ctx1.font = `bold ${fontSize}px Arial, sans-serif`;
            ctx1.strokeStyle = "#ffffff";
            ctx1.lineWidth = 5;
            ctx1.strokeText(name, labelX, labelY);
            ctx1.fillStyle = "#333333";
            ctx1.fillText(name, labelX, labelY);
          }
        }

        // Ocean labels
        ctx1.fillStyle = "#6b95b8";
        ctx1.strokeStyle = "#ffffff";
        ctx1.lineWidth = 4;
        const drawOceanLabel = (text: string, x: number, y: number, size: number) => {
          ctx1.font = `italic ${size}px Georgia, serif`;
          ctx1.strokeText(text, x, y);
          ctx1.fillText(text, x, y);
        };
        drawOceanLabel("PACIFIC OCEAN", width * 0.12, height * 0.52, 64);
        drawOceanLabel("PACIFIC OCEAN", width * 0.88, height * 0.52, 64);
        drawOceanLabel("ATLANTIC OCEAN", width * 0.42, height * 0.42, 56);
        drawOceanLabel("INDIAN OCEAN", width * 0.72, height * 0.60, 56);
        drawOceanLabel("ARCTIC OCEAN", width * 0.5, height * 0.07, 48);
        drawOceanLabel("SOUTHERN OCEAN", width * 0.5, height * 0.90, 48);

        // ============ TEXTURE 2: Roadmap Detail View (Close) ============
        const canvas2 = document.createElement("canvas");
        canvas2.width = width;
        canvas2.height = height;
        const ctx2 = canvas2.getContext("2d")!;
        
        // Ocean - slightly different shade for detail view
        ctx2.fillStyle = "#a8d8ea";
        ctx2.fillRect(0, 0, width, height);

        // Fill countries with subtle gradient feel
        for (const feature of geoData.features) {
          const { geometry } = feature;
          ctx2.fillStyle = "#f8f6f2";
          
          if (geometry.type === "Polygon") {
            drawPolygonRing(ctx2, (geometry.coordinates as number[][][])[0]);
            ctx2.fill();
          } else if (geometry.type === "MultiPolygon") {
            for (const polygon of geometry.coordinates as number[][][][]) {
              drawPolygonRing(ctx2, polygon[0]);
              ctx2.fill();
            }
          }
        }

        // Thicker country borders for detail view
        ctx2.strokeStyle = "#888888";
        ctx2.lineWidth = 4;
        for (const feature of geoData.features) {
          const { geometry } = feature;
          if (geometry.type === "Polygon") {
            drawPolygonRing(ctx2, (geometry.coordinates as number[][][])[0]);
            ctx2.stroke();
          } else if (geometry.type === "MultiPolygon") {
            for (const polygon of geometry.coordinates as number[][][][]) {
              drawPolygonRing(ctx2, polygon[0]);
              ctx2.stroke();
            }
          }
        }

        // Draw simulated major roads connecting cities
        ctx2.strokeStyle = "#e07830";
        ctx2.lineWidth = 3;
        ctx2.setLineDash([20, 10]);
        
        // Connect nearby cities with roads
        const cityConnections = [
          // North America
          ["New York", "Washington D.C."], ["New York", "Chicago"], ["Los Angeles", "San Francisco"],
          ["Chicago", "Toronto"], ["Houston", "Miami"], ["Mexico City", "Houston"],
          // Europe
          ["London", "Paris"], ["Paris", "Berlin"], ["Berlin", "Warsaw"], ["Madrid", "Barcelona"],
          ["Rome", "Vienna"], ["Vienna", "Prague"], ["Moscow", "Warsaw"], ["Amsterdam", "Berlin"],
          // Asia
          ["Tokyo", "Osaka"], ["Beijing", "Shanghai"], ["Hong Kong", "Taipei"], ["Singapore", "Kuala Lumpur"],
          ["Bangkok", "Singapore"], ["Delhi", "Mumbai"], ["Seoul", "Tokyo"], ["Dubai", "Mumbai"],
          // South America
          ["São Paulo", "Rio de Janeiro"], ["Buenos Aires", "Santiago"], ["Lima", "Bogotá"],
          // Africa
          ["Cairo", "Nairobi"], ["Johannesburg", "Cape Town"], ["Lagos", "Nairobi"],
          // Oceania
          ["Sydney", "Melbourne"], ["Sydney", "Brisbane"],
        ];
        
        const cityMap = new Map(WORLD_CITIES.map(c => [c.name, c]));
        for (const [city1Name, city2Name] of cityConnections) {
          const city1 = cityMap.get(city1Name);
          const city2 = cityMap.get(city2Name);
          if (city1 && city2) {
            const [x1, y1] = toXY(city1.lat, city1.lng);
            const [x2, y2] = toXY(city2.lat, city2.lng);
            ctx2.beginPath();
            ctx2.moveTo(x1, y1);
            ctx2.lineTo(x2, y2);
            ctx2.stroke();
          }
        }
        ctx2.setLineDash([]);

        // Draw cities
        for (const city of WORLD_CITIES) {
          const [x, y] = toXY(city.lat, city.lng);
          
          // City dot
          const radius = city.pop > 10000000 ? 12 : city.pop > 5000000 ? 10 : city.pop > 2000000 ? 8 : 6;
          ctx2.beginPath();
          ctx2.arc(x, y, radius, 0, Math.PI * 2);
          ctx2.fillStyle = "#d43d3d";
          ctx2.fill();
          ctx2.strokeStyle = "#ffffff";
          ctx2.lineWidth = 2;
          ctx2.stroke();
          
          // City name
          const fontSize = city.pop > 10000000 ? 28 : city.pop > 5000000 ? 24 : city.pop > 2000000 ? 20 : 16;
          ctx2.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx2.textAlign = "center";
          ctx2.textBaseline = "bottom";
          ctx2.strokeStyle = "#ffffff";
          ctx2.lineWidth = 4;
          ctx2.strokeText(city.name, x, y - radius - 4);
          ctx2.fillStyle = "#222222";
          ctx2.fillText(city.name, x, y - radius - 4);
        }

        // Smaller country labels for detail view
        ctx2.textAlign = "center";
        ctx2.textBaseline = "middle";
        for (const feature of geoData.features) {
          const name = feature.properties?.NAME || feature.properties?.ADMIN;
          if (!name) continue;
          
          let labelLat = feature.properties?.LABEL_Y;
          let labelLng = feature.properties?.LABEL_X;
          
          if (labelLat === undefined || labelLng === undefined) {
            const { geometry } = feature;
            let coords: number[][] = [];
            if (geometry.type === "Polygon") {
              coords = (geometry.coordinates as number[][][])[0];
            } else if (geometry.type === "MultiPolygon") {
              let maxLen = 0;
              for (const poly of geometry.coordinates as number[][][][]) {
                if (poly[0].length > maxLen) { maxLen = poly[0].length; coords = poly[0]; }
              }
            }
            if (coords.length === 0) continue;
            let sumX = 0, sumY = 0;
            for (const coord of coords) { sumX += coord[0]; sumY += coord[1]; }
            labelLng = sumX / coords.length;
            labelLat = sumY / coords.length;
          }
          
          const [labelX, labelY] = toXY(labelLat, labelLng);
          const pop = feature.properties?.POP_EST || 0;
          
          let fontSize = 0;
          if (largeCountries.has(name)) fontSize = 44;
          else if (mediumCountries.has(name)) fontSize = 32;
          else if (pop > 30000000) fontSize = 26;
          else if (pop > 10000000) fontSize = 20;
          else if (pop > 1000000) fontSize = 16;
          else if (pop > 100000) fontSize = 12;
          
          if (fontSize > 0) {
            ctx2.font = `${fontSize}px Arial, sans-serif`;
            ctx2.strokeStyle = "#ffffff";
            ctx2.lineWidth = 3;
            ctx2.strokeText(name.toUpperCase(), labelX, labelY + 40);
            ctx2.fillStyle = "#666666";
            ctx2.fillText(name.toUpperCase(), labelX, labelY + 40);
          }
        }

        // Create textures
        const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
        
        const tex1 = new THREE.CanvasTexture(canvas1);
        tex1.colorSpace = THREE.SRGBColorSpace;
        tex1.minFilter = THREE.LinearMipmapLinearFilter;
        tex1.magFilter = THREE.LinearFilter;
        tex1.anisotropy = maxAnisotropy;
        tex1.generateMipmaps = true;
        tex1.needsUpdate = true;
        
        const tex2 = new THREE.CanvasTexture(canvas2);
        tex2.colorSpace = THREE.SRGBColorSpace;
        tex2.minFilter = THREE.LinearMipmapLinearFilter;
        tex2.magFilter = THREE.LinearFilter;
        tex2.anisotropy = maxAnisotropy;
        tex2.generateMipmaps = true;
        tex2.needsUpdate = true;
        
        console.log("Both textures generated (8K) with anisotropy:", maxAnisotropy);
        setCountryTexture(tex1);
        setRoadmapTexture(tex2);

      } catch (error) {
        console.error("Failed to load GeoJSON:", error);
      }
    };

    generateTextures();
  }, [gl]);

  // Update blend factor based on camera distance
  useFrame(() => {
    const distance = camera.position.length();
    // Transition between 2.0 (far - country view) and 1.3 (close - roadmap view)
    const t = THREE.MathUtils.clamp((2.0 - distance) / 0.7, 0, 1);
    setBlendFactor(t);
    
    if (materialRef.current) {
      materialRef.current.uniforms.blend.value = t;
    }
  });
  
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

  // Custom shader for LOD texture blending
  const blendShader = useMemo(() => ({
    uniforms: {
      countryTex: { value: null },
      roadmapTex: { value: null },
      blend: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D countryTex;
      uniform sampler2D roadmapTex;
      uniform float blend;
      varying vec2 vUv;
      void main() {
        vec4 country = texture2D(countryTex, vUv);
        vec4 roadmap = texture2D(roadmapTex, vUv);
        gl_FragColor = mix(country, roadmap, blend);
      }
    `,
  }), []);

  // Update shader uniforms when textures change
  useEffect(() => {
    if (materialRef.current && countryTexture && roadmapTexture) {
      materialRef.current.uniforms.countryTex.value = countryTexture;
      materialRef.current.uniforms.roadmapTex.value = roadmapTexture;
      materialRef.current.needsUpdate = true;
    }
  }, [countryTexture, roadmapTexture]);

  return (
    <group>
      {/* Earth sphere with LOD texture blending */}
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
        {countryTexture && roadmapTexture ? (
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              countryTex: { value: countryTexture },
              roadmapTex: { value: roadmapTexture },
              blend: { value: blendFactor },
            }}
            vertexShader={blendShader.vertexShader}
            fragmentShader={blendShader.fragmentShader}
          />
        ) : (
          <meshBasicMaterial color="#a8d5e5" />
        )}
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
