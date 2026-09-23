import { Header } from "@/components/Header";
import { HeroFilm } from "@/components/HeroFilm";
import { Intro } from "@/components/Intro";
import { Services } from "@/components/Services";
import { Collage } from "@/components/Collage";
import { Approach } from "@/components/Approach";
import { Reviews } from "@/components/Reviews";
import { Closing } from "@/components/Closing";
import { Footer } from "@/components/Footer";
import { ScrollAnimations } from "@/components/ScrollAnimations";

/**
 * The page follows the reference build: a scroll-scrubbed opening film, then a
 * cream sheet that slides over it, what's included beside a booking card, a
 * photo collage, the approach, reviews beside a moving image, and a close.
 */
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroFilm />
        <Intro />
        <Services />
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
