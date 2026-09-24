import { Header } from "@/components/Header";
import { HeroFilm } from "@/components/HeroFilm";
import { Intro } from "@/components/Intro";
import { Marquee } from "@/components/Marquee";
import { Services } from "@/components/Services";
import { Materials } from "@/components/Materials";
import { Collage } from "@/components/Collage";
import { Approach } from "@/components/Approach";
import { Reviews } from "@/components/Reviews";
import { Closing } from "@/components/Closing";
import { Footer } from "@/components/Footer";
import { ScrollAnimations } from "@/components/ScrollAnimations";

/**
 * A scroll-scrubbed opening film, then sheets that slide over it in the
 * logo's black, yellow and ivory: the studio's crystal, the rooms it designs,
 * what's included beside a booking card, the material palette assembling in
 * 3D, a photo collage, a room that builds itself in 3D, reviews, and a close.
 */
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroFilm />
        <Intro />
        <Marquee />
        <Services />
        <Materials />
        <Collage />
        <Approach />
        <Reviews />
        <Closing />
      </main>
      <Footer />
      <ScrollAnimations />
    </>
  );
}
