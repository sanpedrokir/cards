import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vaulted",
    short_name: "Vaulted",
    description: "Track investment, purchases, sales and profit for your card business.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f5",
    theme_color: "#d97706",
    icons: [
      {
        src: "/vaulted-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
