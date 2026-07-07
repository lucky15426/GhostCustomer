"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ghost, LayoutDashboard, Swords, LineChart, Eye, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/auth/user-menu";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/roast", label: "UI Roast", icon: Eye },
  { href: "/arena", label: "Battle Arena", icon: Swords },
  { href: "/pricing-lab", label: "Pricing Lab", icon: LineChart },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hideForLandingLoading, setHideForLandingLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return pathname === "/" && !sessionStorage.getItem("ghostai_loading_complete");
    }
    return pathname === "/";
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (pathname !== "/") {
      setHideForLandingLoading(false);
      return;
    }

    if (sessionStorage.getItem("ghostai_loading_complete")) {
      setHideForLandingLoading(false);
      return;
    }

    setHideForLandingLoading(true);
    const onLoadingComplete = () => setHideForLandingLoading(false);
    
    // Support both event types depending on which loader version is active
    window.addEventListener("landing-loading-complete", onLoadingComplete);
    window.addEventListener("ghostloader:complete", onLoadingComplete);
    
    return () => {
      window.removeEventListener("landing-loading-complete", onLoadingComplete);
      window.removeEventListener("ghostloader:complete", onLoadingComplete);
    };
  }, [pathname]);

  // Close mobile menu on path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isLanding = pathname === "/";

  // The homepage now uses the full-screen Mainframe hero, which ships its own
  // navbar — so the global navbar is hidden there to avoid a double header.
  if (pathname === "/") return null;

  return (
    <motion.header
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-slate-200/70 bg-white/80 backdrop-blur-xl" : "border-b border-transparent bg-transparent",
        hideForLandingLoading && "invisible pointer-events-none"
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 sm:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="text-[19px] font-medium tracking-tight text-black sm:text-[22px]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            GhostCustomer
            <span className="align-super text-[0.5em] font-normal">®</span>
          </span>
          <span className="select-none text-[20px] leading-none text-black sm:text-[24px]" style={{ letterSpacing: "-0.02em" }}>
            ✳︎
          </span>
        </Link>

        {/* Center nav */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-[15px] font-medium text-black md:flex lg:gap-9">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-opacity hover:opacity-50",
                  active ? "font-semibold opacity-100" : "opacity-80"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <UserMenu />
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex flex-col gap-[5px] md:hidden"
            aria-label="Menu"
          >
            <span
              className="h-[2px] w-6 bg-black transition-all duration-300"
              style={isMobileMenuOpen ? { transform: "translateY(7px) rotate(45deg)" } : undefined}
            />
            <span className="h-[2px] w-6 bg-black transition-all duration-300" style={isMobileMenuOpen ? { opacity: 0 } : undefined} />
            <span
              className="h-[2px] w-6 bg-black transition-all duration-300"
              style={isMobileMenuOpen ? { transform: "translateY(-7px) rotate(-45deg)" } : undefined}
            />
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, pointerEvents: "none" }}
            animate={{ opacity: 1, pointerEvents: "auto" }}
            exit={{ opacity: 0, pointerEvents: "none" }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-[60px] z-[9] flex flex-col justify-start gap-6 bg-white/95 px-8 pt-10 backdrop-blur-sm md:hidden"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[32px] font-medium text-black"
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

