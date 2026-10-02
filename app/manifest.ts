import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vaulted",
    short_name: "Vaulted",
    description: "Track investment, purchases, sales and profit for your card business.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f7fe",
    theme_color: "#1d7bf0",
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
