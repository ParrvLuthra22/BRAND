import { Hero } from "@/components/sections/Hero";
import { SceneUnfold } from "@/components/sections/SceneUnfold";
import { SceneRail } from "@/components/sections/SceneRail";
import { Manifesto } from "@/components/sections/Manifesto";
import { Lookbook } from "@/components/sections/Lookbook";
import { TheDrop } from "@/components/sections/TheDrop";
import { ShopGrid } from "@/components/sections/ShopGrid";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <SceneUnfold />
      <SceneRail />
      <Manifesto />
      <Lookbook />
      <TheDrop />
      <ShopGrid />
      <Footer />
    </>
  );
}
