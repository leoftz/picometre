import type { MetadataRoute } from "next";
import { colors } from "@/lib/brand/tokens";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Picomètre",
    short_name: "Picomètre",
    description: "On s'amuse, la jauge veille. Réservé aux 18 ans et plus.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: colors.nuit,
    theme_color: colors.nuit,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
