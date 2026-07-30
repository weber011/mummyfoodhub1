"use client";

import { motion } from "framer-motion";
import { MenuCard } from "@/components/shared/MenuCard";
import { useSiteData } from "@/context/SiteContext";

export default function FoodCombosPage() {
  const { siteData } = useSiteData();
  const allItems = siteData.allMenuItems || [];
  const combos = allItems.filter((item: any) => item.section === "food-combos");

  return (
    <div className="pt-20 pb-20 bg-background min-h-screen">
      <div className="bg-primary/10 py-12 text-center border-b border-border">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">Rice Together</h1>
        <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-4" />
        <p className="text-muted-foreground font-subheading text-lg max-w-xl mx-auto px-4">
          Perfectly paired comfort meals for your cravings.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {combos.map((item: any) => (
            <MenuCard key={item.id} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
