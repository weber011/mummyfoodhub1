"use client";

import { motion } from "framer-motion";
import { MenuCard } from "@/components/shared/MenuCard";
import { useSiteData } from "@/context/SiteContext";

export default function DietFoodsPage() {
  const { siteData } = useSiteData();
  const allItems = siteData.allMenuItems || [];
  const items = allItems.filter((item: any) => item.section === "diet-foods");

  return (
    <div className="pt-20 pb-20 bg-background min-h-screen">
      <div className="bg-green-500/10 py-12 text-center border-b border-border">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">Diet Foods</h1>
        <div className="w-24 h-1 bg-green-500 mx-auto rounded-full mb-4" />
        <p className="text-muted-foreground font-subheading text-lg max-w-xl mx-auto px-4">
          Healthy and nutritious meals.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item: any) => (
            <MenuCard key={item.id} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
