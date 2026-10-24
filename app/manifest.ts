import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vaulted",
    short_name: "Vaulted",
    description: "Track purchases, sales and profit for your card business.",
    start_url: "/",
    display: "standalone",
    background_color: "#060d13",
    theme_color: "#060d13",
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
