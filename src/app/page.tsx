import { MainframeHero } from "@/components/landing/mainframe-hero";
import { TrustSection } from "@/components/landing/trust-section";
import {
  Differentiator,
  Features,
  AgentsShowcase,
  HowItWorks,
  FinalCTA,
} from "@/components/landing/sections";
import LoadingScreen from "@/components/landing/loading-screen";
import { Footer } from "@/components/layout/footer";

export default function LandingPage() {
  return (
    <>
      <LoadingScreen />
      <MainframeHero />

      {/* Landing content below the hero — opaque so it covers the fixed video on scroll */}
      <div className="relative z-10 bg-[#fbfbfd]">
        <TrustSection />
        <Differentiator />
        <Features />
        <AgentsShowcase />
        <HowItWorks />
        <FinalCTA />
        <Footer />
      </div>
    </>
  );
}
