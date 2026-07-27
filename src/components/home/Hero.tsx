"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { gsap } from "gsap";
import { motion } from "framer-motion";
import { MapPin, Clock, ChevronDown, Star } from "lucide-react";

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Gentle floating for the logo
      gsap.to(".logo-float", {
        y: -14,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      // Slow pulse for the glow ring
      gsap.to(".logo-glow", {
        scale: 1.08,
        opacity: 0.6,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      // Text entrance
      gsap.fromTo(
        ".hero-text-block",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out", stagger: 0.15, delay: 0.2 }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* ── BACKGROUND ── */}
      <div className="absolute inset-0 z-0">
        {/* Food plate hero background image */}
        <Image
          src="/images/hero section background.png"
          alt="Delicious homemade food"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Heavy dark overlay — left side for text clarity, right slightly lighter */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/75 to-black/55" />
        {/* Top & bottom fade for polish */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
      </div>

      {/* ── SPLIT LAYOUT ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 mt-20 lg:mt-0">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8 min-h-[80vh] py-16">

          {/* ── LEFT: ALL TEXT CONTENT ── */}
          <div className="flex-1 max-w-2xl text-left">

            {/* Location & Hours badges */}
            <div className="hero-text-block flex flex-wrap gap-3 mb-8">
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-white/10 border border-white/25 text-white text-xs font-subheading font-medium backdrop-blur-sm">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                Sectors 110 • 133 • 135, Noida
              </span>
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-white/10 border border-white/25 text-white text-xs font-subheading font-medium backdrop-blur-sm">
                <Clock className="w-3.5 h-3.5 text-green-400" />
                Open 9 AM – 10 PM Daily
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-text-block font-heading font-bold text-white leading-[1.08] mb-6 drop-shadow-2xl"
              style={{ fontSize: "clamp(2.4rem, 5.5vw, 5rem)" }}
            >
              Har Bite Me{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-primary">
                Maa Ka Pyaar
              </span>{" "}
              <span style={{ fontSize: "0.7em" }}>❤️</span>
            </h1>

            {/* Tagline */}
            <p className="hero-text-block text-white/85 font-subheading text-lg md:text-xl leading-relaxed mb-3">
              Fresh • Less Oily • Hygienic • Homemade
            </p>
            <p className="hero-text-block text-white/85 font-subheading text-base md:text-lg leading-relaxed mb-3">
              Meals Delivered Daily to Your Doorstep
            </p>

            {/* Delivery charge */}
            <p className="hero-text-block text-white/50 text-sm font-subheading mb-10">
              Delivery: ₹5 – ₹20 depending on distance
            </p>

            {/* CTA Buttons */}
            <div className="hero-text-block flex flex-col sm:flex-row gap-4 mb-14">
              <Link
                href="/menu"
                className="group w-full sm:w-auto px-8 py-4 bg-primary text-white font-subheading font-bold rounded-full text-base shadow-[0_0_30px_rgba(178,58,58,0.5)] hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                🍱 View Full Menu
                <ChevronDown className="w-4 h-4 rotate-[-90deg] group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="https://wa.me/917065665988"
                target="_blank"
                className="w-full sm:w-auto px-8 py-4 bg-[#25D366] text-white font-subheading font-bold rounded-full text-base shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:bg-[#20b858] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Order on WhatsApp
              </Link>
            </div>

            {/* Stats */}
            <div className="hero-text-block flex gap-10">
              {[
                { num: "500+", label: "Happy Families" },
                { num: "Daily", label: "Fresh Cooking" },
                { num: "5 KM", label: "Delivery Radius" },
              ].map((stat) => (
                <div key={stat.label} className="text-left">
                  <p className="text-2xl font-heading font-black text-orange-400 drop-shadow">{stat.num}</p>
                  <p className="text-xs text-white/55 font-subheading mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: LOGO ── */}
          <div className="flex-shrink-0 flex items-center justify-center lg:justify-end">
            {/* Outer glow ring */}
            <div className="relative">
              {/* Animated glow behind logo */}
              <div className="logo-glow absolute inset-0 rounded-full bg-gradient-to-br from-orange-400/40 via-primary/30 to-yellow-400/20 blur-3xl scale-110 opacity-70" />

              {/* Gold decorative ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-12px] rounded-full border-2 border-dashed border-orange-400/30"
              />

              {/* Logo container */}
              <motion.div
                className="logo-float relative w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden border-4 border-white/20 shadow-[0_0_60px_rgba(255,165,0,0.25)]"
              >
                {/* Soft white bg so cream logo is visible on dark hero */}
                <div className="absolute inset-0 bg-[#FAF3E0] rounded-full" />
                <Image
                  src="/logo.png"
                  alt="Mummy Food Hub Logo"
                  fill
                  priority
                  className="object-contain p-4"
                />
              </motion.div>

              {/* Floating badge: Rating */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1, type: "spring" }}
                className="absolute -top-4 -right-4 bg-white rounded-2xl px-3 py-2 shadow-xl border border-orange-100 flex items-center gap-1.5"
              >
                <Star className="w-4 h-4 fill-orange-400 text-orange-400" />
                <span className="text-sm font-heading font-black text-foreground">4.9</span>
                <span className="text-xs text-muted-foreground font-subheading">Rated</span>
              </motion.div>

              {/* Floating badge: Orders */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.3, type: "spring" }}
                className="absolute -bottom-4 -left-4 bg-primary text-white rounded-2xl px-3 py-2 shadow-xl"
              >
                <p className="text-xs font-subheading font-medium">🍱 Fresh Today</p>
                <p className="text-sm font-heading font-black">Homemade</p>
              </motion.div>
            </div>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-white/40"
      >
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  );
}
