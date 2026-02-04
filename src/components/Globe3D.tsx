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
    name?: string;
    admin?: string;
    iso_a2?: string;
    adm0_a3?: string;
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

// US Cities for state-level view
const US_CITIES = [
  // Major cities per state
  { name: "New York City", lat: 40.7128, lng: -74.006, state: "New York", pop: 8336817 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437, state: "California", pop: 3979576 },
  { name: "Chicago", lat: 41.8781, lng: -87.6298, state: "Illinois", pop: 2693976 },
  { name: "Houston", lat: 29.7604, lng: -95.3698, state: "Texas", pop: 2320268 },
  { name: "Phoenix", lat: 33.4484, lng: -112.074, state: "Arizona", pop: 1680992 },
  { name: "Philadelphia", lat: 39.9526, lng: -75.1652, state: "Pennsylvania", pop: 1584064 },
  { name: "San Antonio", lat: 29.4241, lng: -98.4936, state: "Texas", pop: 1547253 },
  { name: "San Diego", lat: 32.7157, lng: -117.1611, state: "California", pop: 1423851 },
  { name: "Dallas", lat: 32.7767, lng: -96.797, state: "Texas", pop: 1343573 },
  { name: "San Jose", lat: 37.3382, lng: -121.8863, state: "California", pop: 1021795 },
  { name: "Austin", lat: 30.2672, lng: -97.7431, state: "Texas", pop: 978908 },
  { name: "Jacksonville", lat: 30.3322, lng: -81.6557, state: "Florida", pop: 911507 },
  { name: "Fort Worth", lat: 32.7555, lng: -97.3308, state: "Texas", pop: 909585 },
  { name: "Columbus", lat: 39.9612, lng: -82.9988, state: "Ohio", pop: 898553 },
  { name: "Charlotte", lat: 35.2271, lng: -80.8431, state: "North Carolina", pop: 885708 },
  { name: "San Francisco", lat: 37.7749, lng: -122.4194, state: "California", pop: 883305 },
  { name: "Indianapolis", lat: 39.7684, lng: -86.1581, state: "Indiana", pop: 876384 },
  { name: "Seattle", lat: 47.6062, lng: -122.3321, state: "Washington", pop: 753675 },
  { name: "Denver", lat: 39.7392, lng: -104.9903, state: "Colorado", pop: 727211 },
  { name: "Washington D.C.", lat: 38.9072, lng: -77.0369, state: "District of Columbia", pop: 705749 },
  { name: "Boston", lat: 42.3601, lng: -71.0589, state: "Massachusetts", pop: 692600 },
  { name: "El Paso", lat: 31.7619, lng: -106.485, state: "Texas", pop: 681728 },
  { name: "Nashville", lat: 36.1627, lng: -86.7816, state: "Tennessee", pop: 670820 },
  { name: "Detroit", lat: 42.3314, lng: -83.0458, state: "Michigan", pop: 670031 },
  { name: "Portland", lat: 45.5152, lng: -122.6784, state: "Oregon", pop: 654741 },
  { name: "Memphis", lat: 35.1495, lng: -90.049, state: "Tennessee", pop: 651073 },
  { name: "Las Vegas", lat: 36.1699, lng: -115.1398, state: "Nevada", pop: 644644 },
  { name: "Louisville", lat: 38.2527, lng: -85.7585, state: "Kentucky", pop: 617638 },
  { name: "Baltimore", lat: 39.2904, lng: -76.6122, state: "Maryland", pop: 593490 },
  { name: "Milwaukee", lat: 43.0389, lng: -87.9065, state: "Wisconsin", pop: 577222 },
  { name: "Albuquerque", lat: 35.0844, lng: -106.6504, state: "New Mexico", pop: 560218 },
  { name: "Tucson", lat: 32.2226, lng: -110.9747, state: "Arizona", pop: 548073 },
  { name: "Fresno", lat: 36.7378, lng: -119.7871, state: "California", pop: 531576 },
  { name: "Sacramento", lat: 38.5816, lng: -121.4944, state: "California", pop: 513624 },
  { name: "Atlanta", lat: 33.749, lng: -84.388, state: "Georgia", pop: 506811 },
  { name: "Kansas City", lat: 39.0997, lng: -94.5786, state: "Missouri", pop: 495327 },
  { name: "Miami", lat: 25.7617, lng: -80.1918, state: "Florida", pop: 467963 },
  { name: "Raleigh", lat: 35.7796, lng: -78.6382, state: "North Carolina", pop: 467665 },
  { name: "Omaha", lat: 41.2565, lng: -95.9345, state: "Nebraska", pop: 478192 },
  { name: "Minneapolis", lat: 44.9778, lng: -93.265, state: "Minnesota", pop: 429954 },
  { name: "Cleveland", lat: 41.4993, lng: -81.6944, state: "Ohio", pop: 381009 },
  { name: "New Orleans", lat: 29.9511, lng: -90.0715, state: "Louisiana", pop: 383997 },
  { name: "Tampa", lat: 27.9506, lng: -82.4572, state: "Florida", pop: 399700 },
  { name: "Orlando", lat: 28.5383, lng: -81.3792, state: "Florida", pop: 307573 },
  { name: "Salt Lake City", lat: 40.7608, lng: -111.891, state: "Utah", pop: 200591 },
  { name: "Pittsburgh", lat: 40.4406, lng: -79.9959, state: "Pennsylvania", pop: 302407 },
  { name: "Cincinnati", lat: 39.1031, lng: -84.512, state: "Ohio", pop: 309317 },
  { name: "St. Louis", lat: 38.627, lng: -90.1994, state: "Missouri", pop: 301578 },
  { name: "Honolulu", lat: 21.3069, lng: -157.8583, state: "Hawaii", pop: 350395 },
  { name: "Anchorage", lat: 61.2181, lng: -149.9003, state: "Alaska", pop: 291247 },
];

// US State label positions (approximate centers)
const US_STATE_LABELS: { [key: string]: { lat: number; lng: number; abbr: string } } = {
  "Alabama": { lat: 32.8, lng: -86.8, abbr: "AL" },
  "Alaska": { lat: 64.0, lng: -153.0, abbr: "AK" },
  "Arizona": { lat: 34.3, lng: -111.7, abbr: "AZ" },
  "Arkansas": { lat: 34.8, lng: -92.4, abbr: "AR" },
  "California": { lat: 37.2, lng: -119.5, abbr: "CA" },
  "Colorado": { lat: 39.0, lng: -105.5, abbr: "CO" },
  "Connecticut": { lat: 41.6, lng: -72.7, abbr: "CT" },
  "Delaware": { lat: 39.0, lng: -75.5, abbr: "DE" },
  "Florida": { lat: 28.5, lng: -82.5, abbr: "FL" },
  "Georgia": { lat: 32.7, lng: -83.5, abbr: "GA" },
  "Hawaii": { lat: 20.5, lng: -157.5, abbr: "HI" },
  "Idaho": { lat: 44.4, lng: -114.7, abbr: "ID" },
  "Illinois": { lat: 40.0, lng: -89.2, abbr: "IL" },
  "Indiana": { lat: 39.9, lng: -86.3, abbr: "IN" },
  "Iowa": { lat: 42.0, lng: -93.5, abbr: "IA" },
  "Kansas": { lat: 38.5, lng: -98.4, abbr: "KS" },
  "Kentucky": { lat: 37.8, lng: -85.7, abbr: "KY" },
  "Louisiana": { lat: 31.0, lng: -92.0, abbr: "LA" },
  "Maine": { lat: 45.3, lng: -69.0, abbr: "ME" },
  "Maryland": { lat: 39.0, lng: -76.8, abbr: "MD" },
  "Massachusetts": { lat: 42.2, lng: -71.5, abbr: "MA" },
  "Michigan": { lat: 44.3, lng: -85.5, abbr: "MI" },
  "Minnesota": { lat: 46.3, lng: -94.3, abbr: "MN" },
  "Mississippi": { lat: 32.7, lng: -89.7, abbr: "MS" },
  "Missouri": { lat: 38.3, lng: -92.5, abbr: "MO" },
  "Montana": { lat: 47.0, lng: -109.6, abbr: "MT" },
  "Nebraska": { lat: 41.5, lng: -99.8, abbr: "NE" },
  "Nevada": { lat: 39.3, lng: -116.6, abbr: "NV" },
  "New Hampshire": { lat: 43.7, lng: -71.5, abbr: "NH" },
  "New Jersey": { lat: 40.1, lng: -74.7, abbr: "NJ" },
  "New Mexico": { lat: 34.4, lng: -106.0, abbr: "NM" },
  "New York": { lat: 43.0, lng: -75.5, abbr: "NY" },
  "North Carolina": { lat: 35.5, lng: -79.8, abbr: "NC" },
  "North Dakota": { lat: 47.4, lng: -100.3, abbr: "ND" },
  "Ohio": { lat: 40.4, lng: -82.8, abbr: "OH" },
  "Oklahoma": { lat: 35.6, lng: -97.5, abbr: "OK" },
  "Oregon": { lat: 44.0, lng: -120.5, abbr: "OR" },
  "Pennsylvania": { lat: 40.9, lng: -77.8, abbr: "PA" },
  "Rhode Island": { lat: 41.7, lng: -71.5, abbr: "RI" },
  "South Carolina": { lat: 33.9, lng: -80.9, abbr: "SC" },
  "South Dakota": { lat: 44.4, lng: -100.2, abbr: "SD" },
  "Tennessee": { lat: 35.8, lng: -86.3, abbr: "TN" },
  "Texas": { lat: 31.5, lng: -99.4, abbr: "TX" },
  "Utah": { lat: 39.3, lng: -111.7, abbr: "UT" },
  "Vermont": { lat: 44.0, lng: -72.7, abbr: "VT" },
  "Virginia": { lat: 37.5, lng: -78.8, abbr: "VA" },
  "Washington": { lat: 47.4, lng: -120.5, abbr: "WA" },
  "West Virginia": { lat: 38.9, lng: -80.5, abbr: "WV" },
  "Wisconsin": { lat: 44.6, lng: -89.7, abbr: "WI" },
  "Wyoming": { lat: 43.0, lng: -107.5, abbr: "WY" },
  "District of Columbia": { lat: 38.9, lng: -77.0, abbr: "DC" },
};

// Earth component inside Canvas
function Earth({ onRegionClick, selectedRegion, isDrawingMode }: EarthProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ lat: number; long: number } | null>(null);
  // 3-tier LOD textures
  const [countryTexture, setCountryTexture] = useState<THREE.Texture | null>(null);  // Far view
  const [stateTexture, setStateTexture] = useState<THREE.Texture | null>(null);      // Medium zoom (states)
  const [cityTexture, setCityTexture] = useState<THREE.Texture | null>(null);        // Close zoom (cities)
  const [lodLevel, setLodLevel] = useState(0); // 0 = country, 0.5 = blend to state, 1 = state, 1.5 = blend to city, 2 = city
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { camera, gl } = useThree();
  
  // Generate all three LOD textures from local GeoJSON
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
        // Load both GeoJSON files
        const [countryResponse, stateResponse] = await Promise.all([
          fetch("/data/countries.geojson"),
          fetch("/data/states.geojson")
        ]);
        
        if (!countryResponse.ok) throw new Error("Failed to fetch countries GeoJSON");
        const countryData: GeoJSONData = await countryResponse.json();
        
        let stateData: GeoJSONData | null = null;
        if (stateResponse.ok) {
          stateData = await stateResponse.json();
        }
        
        // Filter US states specifically
        const usStates = stateData?.features?.filter(f => {
          const admin = f.properties?.admin || f.properties?.ADMIN || "";
          const adm0 = f.properties?.adm0_a3 || "";
          return admin === "United States of America" || adm0 === "USA";
        }) || [];
        
        console.log("GeoJSON loaded - countries:", countryData.features.length, 
                    "all provinces:", stateData?.features?.length || 0,
                    "US states:", usStates.length);

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

        // Large and medium countries for labels
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
        for (const feature of countryData.features) {
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
        for (const feature of countryData.features) {
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

        // Country labels
        ctx1.textAlign = "center";
        ctx1.textBaseline = "middle";
        for (const feature of countryData.features) {
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
        const drawOceanLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) => {
          ctx.font = `italic ${size}px Georgia, serif`;
          ctx.strokeText(text, x, y);
          ctx.fillText(text, x, y);
        };
        drawOceanLabel(ctx1, "PACIFIC OCEAN", width * 0.12, height * 0.52, 64);
        drawOceanLabel(ctx1, "PACIFIC OCEAN", width * 0.88, height * 0.52, 64);
        drawOceanLabel(ctx1, "ATLANTIC OCEAN", width * 0.42, height * 0.42, 56);
        drawOceanLabel(ctx1, "INDIAN OCEAN", width * 0.72, height * 0.60, 56);
        drawOceanLabel(ctx1, "ARCTIC OCEAN", width * 0.5, height * 0.07, 48);
        drawOceanLabel(ctx1, "SOUTHERN OCEAN", width * 0.5, height * 0.90, 48);

        // ============ TEXTURE 2: State/Province View (Medium) ============
        const canvas2 = document.createElement("canvas");
        canvas2.width = width;
        canvas2.height = height;
        const ctx2 = canvas2.getContext("2d")!;
        
        // Ocean - same as country view
        ctx2.fillStyle = "#87CEEB";
        ctx2.fillRect(0, 0, width, height);

        // Fill ALL countries first (non-US countries)
        ctx2.fillStyle = "#e8e6e2";
        for (const feature of countryData.features) {
          const { geometry } = feature;
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

        // Draw US states with distinct colors
        if (usStates.length > 0) {
          // Distinct colors for US states - more vibrant
          const stateColors = [
            "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c",
            "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c",
            "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#084594",
            "#d4b9da", "#c994c7", "#df65b0", "#e7298a", "#ce1256", "#91003f",
            "#fee5d9", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d",
            "#ffffcc", "#d9f0a3", "#addd8e", "#78c679", "#41ab5d", "#238443",
            "#edf8fb", "#bfd3e6", "#9ebcda", "#8c96c6", "#8c6bb1", "#88419d",
            "#f7f7f7", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252",
          ];
          
          // Draw filled US states
          for (let i = 0; i < usStates.length; i++) {
            const feature = usStates[i];
            const { geometry } = feature;
            ctx2.fillStyle = stateColors[i % stateColors.length];
            
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
          
          // Draw US state borders - thick and dark
          ctx2.strokeStyle = "#333333";
          ctx2.lineWidth = 4;
          for (const feature of usStates) {
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
        }

        // Draw country borders (for non-US countries)
        ctx2.strokeStyle = "#888888";
        ctx2.lineWidth = 3;
        for (const feature of countryData.features) {
          const name = feature.properties?.NAME || feature.properties?.ADMIN || "";
          // Skip USA since we have state borders
          if (name === "United States of America") continue;
          
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

        // Draw US state labels - prominent
        ctx2.textAlign = "center";
        ctx2.textBaseline = "middle";
        for (const [stateName, info] of Object.entries(US_STATE_LABELS)) {
          const [x, y] = toXY(info.lat, info.lng);
          // Use abbreviation for small states, full name for large ones
          const largeStates = new Set(["Texas", "California", "Montana", "Alaska", "Nevada", "Arizona", "Colorado", "Oregon", "Utah", "New Mexico", "Wyoming", "Nebraska", "Kansas", "South Dakota", "North Dakota", "Oklahoma", "Minnesota", "Missouri", "Washington", "Idaho"]);
          const label = largeStates.has(stateName) ? stateName : info.abbr;
          const fontSize = largeStates.has(stateName) ? 32 : 24;
          
          ctx2.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx2.strokeStyle = "#ffffff";
          ctx2.lineWidth = 5;
          ctx2.strokeText(label, x, y);
          ctx2.fillStyle = "#1a1a1a";
          ctx2.fillText(label, x, y);
        }

        // Smaller country labels for state view (non-US)
        for (const feature of countryData.features) {
          const name = feature.properties?.NAME || feature.properties?.ADMIN;
          if (!name || name === "United States of America") continue;
          
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
          if (largeCountries.has(name)) fontSize = 40;
          else if (mediumCountries.has(name)) fontSize = 28;
          else if (pop > 30000000) fontSize = 22;
          else if (pop > 10000000) fontSize = 18;
          
          if (fontSize > 0) {
            ctx2.font = `bold ${fontSize}px Arial, sans-serif`;
            ctx2.strokeStyle = "#ffffff";
            ctx2.lineWidth = 4;
            ctx2.strokeText(name, labelX, labelY);
            ctx2.fillStyle = "#666666";
            ctx2.fillText(name, labelX, labelY);
          }
        }

        // ============ TEXTURE 3: City/Roadmap View (Close) ============
        const canvas3 = document.createElement("canvas");
        canvas3.width = width;
        canvas3.height = height;
        const ctx3 = canvas3.getContext("2d")!;
        
        // Copy state view as base
        ctx3.drawImage(canvas2, 0, 0);

        // Draw simulated major roads connecting cities
        ctx3.strokeStyle = "#e07830";
        ctx3.lineWidth = 3;
        ctx3.setLineDash([20, 10]);
        
        // US road connections
        const usRoadConnections = [
          ["New York City", "Philadelphia"], ["Philadelphia", "Washington D.C."], ["Washington D.C.", "Baltimore"],
          ["New York City", "Boston"], ["Boston", "Providence"], ["Chicago", "Detroit"],
          ["Chicago", "Indianapolis"], ["Chicago", "Milwaukee"], ["Los Angeles", "San Diego"],
          ["Los Angeles", "Las Vegas"], ["Los Angeles", "San Francisco"], ["San Francisco", "Sacramento"],
          ["San Francisco", "San Jose"], ["Seattle", "Portland"], ["Dallas", "Houston"],
          ["Dallas", "Austin"], ["Dallas", "San Antonio"], ["Atlanta", "Charlotte"],
          ["Atlanta", "Nashville"], ["Nashville", "Memphis"], ["Miami", "Orlando"],
          ["Miami", "Tampa"], ["Denver", "Salt Lake City"], ["Phoenix", "Tucson"],
          ["Minneapolis", "Milwaukee"], ["Cleveland", "Pittsburgh"], ["Pittsburgh", "Philadelphia"],
        ];
        
        const usCityMap = new Map(US_CITIES.map(c => [c.name, c]));
        for (const [city1Name, city2Name] of usRoadConnections) {
          const city1 = usCityMap.get(city1Name);
          const city2 = usCityMap.get(city2Name);
          if (city1 && city2) {
            const [x1, y1] = toXY(city1.lat, city1.lng);
            const [x2, y2] = toXY(city2.lat, city2.lng);
            ctx3.beginPath();
            ctx3.moveTo(x1, y1);
            ctx3.lineTo(x2, y2);
            ctx3.stroke();
          }
        }

        // World road connections
        const worldRoadConnections = [
          ["London", "Paris"], ["Paris", "Berlin"], ["Berlin", "Warsaw"], ["Madrid", "Barcelona"],
          ["Rome", "Vienna"], ["Vienna", "Prague"], ["Moscow", "Warsaw"], ["Amsterdam", "Berlin"],
          ["Tokyo", "Osaka"], ["Beijing", "Shanghai"], ["Hong Kong", "Taipei"], ["Singapore", "Kuala Lumpur"],
          ["Bangkok", "Singapore"], ["Delhi", "Mumbai"], ["Seoul", "Tokyo"], ["Dubai", "Mumbai"],
          ["São Paulo", "Rio de Janeiro"], ["Buenos Aires", "Santiago"], ["Lima", "Bogotá"],
          ["Cairo", "Nairobi"], ["Johannesburg", "Cape Town"], ["Sydney", "Melbourne"], ["Sydney", "Brisbane"],
        ];
        
        const worldCityMap = new Map(WORLD_CITIES.map(c => [c.name, c]));
        for (const [city1Name, city2Name] of worldRoadConnections) {
          const city1 = worldCityMap.get(city1Name);
          const city2 = worldCityMap.get(city2Name);
          if (city1 && city2) {
            const [x1, y1] = toXY(city1.lat, city1.lng);
            const [x2, y2] = toXY(city2.lat, city2.lng);
            ctx3.beginPath();
            ctx3.moveTo(x1, y1);
            ctx3.lineTo(x2, y2);
            ctx3.stroke();
          }
        }
        ctx3.setLineDash([]);

        // Draw US cities
        for (const city of US_CITIES) {
          const [x, y] = toXY(city.lat, city.lng);
          
          // City dot
          const radius = city.pop > 2000000 ? 10 : city.pop > 500000 ? 8 : 6;
          ctx3.beginPath();
          ctx3.arc(x, y, radius, 0, Math.PI * 2);
          ctx3.fillStyle = "#d43d3d";
          ctx3.fill();
          ctx3.strokeStyle = "#ffffff";
          ctx3.lineWidth = 2;
          ctx3.stroke();
          
          // City name
          const fontSize = city.pop > 2000000 ? 22 : city.pop > 500000 ? 18 : 14;
          ctx3.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx3.textAlign = "center";
          ctx3.textBaseline = "bottom";
          ctx3.strokeStyle = "#ffffff";
          ctx3.lineWidth = 3;
          ctx3.strokeText(city.name, x, y - radius - 3);
          ctx3.fillStyle = "#222222";
          ctx3.fillText(city.name, x, y - radius - 3);
        }

        // Draw world cities (for non-US areas)
        for (const city of WORLD_CITIES) {
          // Skip US cities (already drawn with more detail)
          if (city.lat > 24 && city.lat < 50 && city.lng > -130 && city.lng < -65) continue;
          
          const [x, y] = toXY(city.lat, city.lng);
          
          // City dot
          const radius = city.pop > 10000000 ? 12 : city.pop > 5000000 ? 10 : city.pop > 2000000 ? 8 : 6;
          ctx3.beginPath();
          ctx3.arc(x, y, radius, 0, Math.PI * 2);
          ctx3.fillStyle = "#d43d3d";
          ctx3.fill();
          ctx3.strokeStyle = "#ffffff";
          ctx3.lineWidth = 2;
          ctx3.stroke();
          
          // City name
          const fontSize = city.pop > 10000000 ? 26 : city.pop > 5000000 ? 22 : city.pop > 2000000 ? 18 : 14;
          ctx3.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx3.textAlign = "center";
          ctx3.textBaseline = "bottom";
          ctx3.strokeStyle = "#ffffff";
          ctx3.lineWidth = 3;
          ctx3.strokeText(city.name, x, y - radius - 3);
          ctx3.fillStyle = "#222222";
          ctx3.fillText(city.name, x, y - radius - 3);
        }

        // Create textures with max quality
        const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
        
        const createTexture = (canvas: HTMLCanvasElement) => {
          const tex = new THREE.CanvasTexture(canvas);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.anisotropy = maxAnisotropy;
          tex.generateMipmaps = true;
          tex.needsUpdate = true;
          return tex;
        };
        
        const tex1 = createTexture(canvas1);
        const tex2 = createTexture(canvas2);
        const tex3 = createTexture(canvas3);
        
        console.log("All 3 LOD textures generated (8K) with anisotropy:", maxAnisotropy);
        setCountryTexture(tex1);
        setStateTexture(tex2);
        setCityTexture(tex3);

      } catch (error) {
        console.error("Failed to load GeoJSON:", error);
      }
    };

    generateTextures();
  }, [gl]);

  // Update LOD level based on camera distance
  // LOD 0 = country view (far), LOD 1 = state view (medium), LOD 2 = city view (close)
  useFrame(() => {
    const distance = camera.position.length();
    
    // Distance thresholds - adjusted to show states earlier:
    // > 3.5: Country view only (LOD 0)
    // 3.5 - 2.5: Blend country -> state (LOD 0 -> 1)
    // 2.5 - 1.5: State view only (LOD 1)
    // 1.5 - 1.1: Blend state -> city (LOD 1 -> 2)
    // < 1.1: City view only (LOD 2)
    
    let lod = 0;
    if (distance > 3.5) {
      lod = 0;
    } else if (distance > 2.5) {
      // Blend from country to state
      lod = THREE.MathUtils.mapLinear(distance, 3.5, 2.5, 0, 1);
    } else if (distance > 1.5) {
      lod = 1;
    } else if (distance > 1.1) {
      // Blend from state to city
      lod = THREE.MathUtils.mapLinear(distance, 1.5, 1.1, 1, 2);
    } else {
      lod = 2;
    }
    
    setLodLevel(lod);
    
    if (materialRef.current) {
      materialRef.current.uniforms.lodLevel.value = lod;
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

  // Custom shader for 3-tier LOD texture blending
  const blendShader = useMemo(() => ({
    uniforms: {
      countryTex: { value: null },
      stateTex: { value: null },
      cityTex: { value: null },
      lodLevel: { value: 0 },
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
      uniform sampler2D stateTex;
      uniform sampler2D cityTex;
      uniform float lodLevel;
      varying vec2 vUv;
      void main() {
        vec4 country = texture2D(countryTex, vUv);
        vec4 state = texture2D(stateTex, vUv);
        vec4 city = texture2D(cityTex, vUv);
        
        vec4 result;
        if (lodLevel <= 1.0) {
          // Blend between country and state
          result = mix(country, state, lodLevel);
        } else {
          // Blend between state and city
          result = mix(state, city, lodLevel - 1.0);
        }
        gl_FragColor = result;
      }
    `,
  }), []);

  // Update shader uniforms when textures change
  useEffect(() => {
    if (materialRef.current && countryTexture && stateTexture && cityTexture) {
      materialRef.current.uniforms.countryTex.value = countryTexture;
      materialRef.current.uniforms.stateTex.value = stateTexture;
      materialRef.current.uniforms.cityTex.value = cityTexture;
      materialRef.current.needsUpdate = true;
    }
  }, [countryTexture, stateTexture, cityTexture]);

  return (
    <group>
      {/* Earth sphere with 3-tier LOD texture blending */}
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
        {countryTexture && stateTexture && cityTexture ? (
          <shaderMaterial
            ref={materialRef}
            uniforms={{
              countryTex: { value: countryTexture },
              stateTex: { value: stateTexture },
              cityTex: { value: cityTexture },
              lodLevel: { value: lodLevel },
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
