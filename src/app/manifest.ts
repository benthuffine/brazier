import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Migrately MVP",
    short_name: "Migrately",
    description:
      "Visa matching and pathway tracking MVP for cross-platform mobile and desktop use.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f5efe1",
    theme_color: "#0f5f63",
    icons: [
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
      {
        src: "/apple-touch-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  };
}
