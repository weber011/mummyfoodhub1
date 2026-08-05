"use client";

import { useState } from "react";
import { MenuCard } from "@/components/shared/MenuCard";
import { motion } from "framer-motion";
import { useSiteData } from "@/context/SiteContext";

const categories = ["Yesterday's Menu", "Today's Menu", "Tomorrow's Menu", "Breads & Extras"];

export default function FullMenuPage() {
  const { siteData } = useSiteData();
  const [activeCategory, setActiveCategory] = useState("Today's Menu");

  // Combine items from siteData
  const allItems = [
    ...(siteData.yesterdayMenu || []).map((item: any) => ({ ...item, category: "Yesterday's Menu" })),
    ...(siteData.todayMenu || []).map((item: any) => ({ ...item, category: "Today's Menu" })),
    ...(siteData.tomorrowMenu || []).map((item: any) => ({ ...item, category: "Tomorrow's Menu" })),
    ...((siteData as any).menuSections?.breadsExtras || []).map((item: any) => ({ ...item, category: "Breads & Extras" }))
  ];

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
        {activeCategory === "Today's Menu" && (
          <div className="mb-8 bg-orange-50 border border-orange-200 rounded-xl p-4 text-center shadow-sm">
            <p className="text-orange-800 font-subheading font-bold">
              🎉 <span className="text-primary text-lg">Special Offer:</span> Add 100ml Raita and 1 Sweet to any Today's Menu Thali and get the Special Combo for exactly <span className="text-2xl font-heading text-primary">₹99</span>!
            </p>
          </div>
        )}

        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filtered.map((item) => (
            <MenuCard key={item.id || item.title} {...item} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
