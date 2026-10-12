"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const CinematicHomeHero = dynamic(() => import("./cinematic-home-hero").then(module => module.CinematicHomeHero));

export function HomeHeroShell() {
  return usePathname() === "/" ? <CinematicHomeHero /> : null;
}
