"use client";

import { useState } from "react";
import { MenuCard } from "@/components/shared/MenuCard";
import { motion } from "framer-motion";

const categories = ["Today's Menu", "Tomorrow's Menu", "Breads & Extras"];

const allItems = [
  // ─── Today's Menu ───────────────────────────────────────────────
  {
    category: "Today's Menu",
    title: "Lunch - Premium Thali",
    price: 120,
    image: "/images/delux thali.jpeg",
    badge: "Lunch Menu",
    items: ["Menu updating soon..."],
    disabled: true,
  },
  {
    category: "Today's Menu",
    title: "Dinner - Light Thali",
    price: 100,
    image: "/images/regular veg thali.jpeg",
    badge: "Dinner Menu",
    items: ["Menu updating soon..."],
    disabled: true,
  },

  // ─── Tomorrow's Menu ───────────────────────────────────────────────
  {
    category: "Tomorrow's Menu",
    title: "Lunch - Premium Thali",
    price: 120,
    image: "/images/delux thali.jpeg",
    badge: "Lunch Menu",
    items: ["Menu updating soon..."],
    disabled: true,
  },
  {
    category: "Tomorrow's Menu",
    title: "Dinner - Light Thali",
    price: 100,
    image: "/images/regular veg thali.jpeg",
    badge: "Dinner Menu",
    items: ["Menu updating soon..."],
    disabled: true,
  },

  // ─── Breads & Extras ───────────────────────────────────────────────
  {
    category: "Breads & Extras",
    title: "Plain Roti",
    price: 10,
    image: "/images/plain rooti.jpeg",
    items: ["Soft Wheat Roti, freshly made"],
  },
  {
    category: "Breads & Extras",
    title: "Butter Roti",
    price: 15,
    image: "/images/butter roti.jpeg",
    items: ["Soft Wheat Roti", "Amul Butter Spread"],
  },
];

export default function FullMenuPage() {
  const [activeCategory, setActiveCategory] = useState("Today's Menu");

  const filtered = allItems.filter((item) => item.category === activeCategory);

  return (
    <div className="pt-20 pb-20 bg-background min-h-screen">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-background to-secondary/10 py-16 text-center border-b border-border">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">Full Menu</h1>
        <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-4" />
        <p className="text-muted-foreground font-subheading text-lg max-w-2xl mx-auto px-4">
          Browse our complete menu and add your favourite items to your order
        </p>
      </div>

      {/* Category Filter */}
      <div className="sticky top-20 z-30 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-4 overflow-x-auto scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-subheading font-bold transition-all shrink-0 ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-md"
                    : "bg-muted text-foreground/70 hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filtered.map((item) => (
            <MenuCard key={item.title} {...item} />
          ))}
        </motion.div>
      </div>

    </div>
  );
}
