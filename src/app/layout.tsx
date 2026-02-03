import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "PlanetCanvas 3D - Collaborative Global Art",
  description: "Draw on a shared 3D Earth in real-time with people worldwide",
  keywords: ["art", "3D", "collaborative", "drawing", "earth", "globe"],
  authors: [{ name: "PlanetCanvas Team" }],
  openGraph: {
    title: "PlanetCanvas 3D",
    description: "Draw on a shared 3D Earth in real-time",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background min-h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
