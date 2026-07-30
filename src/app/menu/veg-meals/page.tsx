"use client";

import { motion } from "framer-motion";
import { MenuCard } from "@/components/shared/MenuCard";
import { useSiteData } from "@/context/SiteContext";

export default function VegMealsPage() {
  const { siteData } = useSiteData();
  const allItems = siteData.allMenuItems || [];
  const vegMeals = allItems.filter((item: any) => item.section === "veg-meals");

  // Group by subcategory
  const pocketFriendly = vegMeals.filter((item: any) => item.subcategory === "Pocket Friendly Meals");
  const deluxe = vegMeals.filter((item: any) => item.subcategory === "Deluxe Meals");
  const sides = vegMeals.filter((item: any) => item.subcategory === "Breads, Raitas & Sides");
  const sweets = vegMeals.filter((item: any) => item.subcategory === "Sweets & Desserts");

  return (
    <div className="pt-20 pb-20 bg-background min-h-screen">
      <div className="bg-secondary/10 py-12 text-center border-b border-border">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">Veg Meals</h1>
        <div className="w-24 h-1 bg-secondary mx-auto rounded-full mb-4" />
        <p className="text-muted-foreground font-subheading text-lg max-w-xl mx-auto">
          Wholesome, healthy, and delicious vegetarian thalis made with love.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Pocket Friendly */}
        {pocketFriendly.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground border-l-4 border-primary pl-4 mb-8">
              Pocket Friendly Meals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pocketFriendly.map((item: any) => (
                <MenuCard key={item.id} {...item} />
              ))}
            </div>
          </div>
        )}

        {/* Deluxe */}
        {deluxe.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground border-l-4 border-secondary pl-4 mb-8">
              Deluxe Meals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {deluxe.map((item: any) => (
                <MenuCard key={item.id} {...item} />
              ))}
            </div>
          </div>
        )}

        {/* Breads, Raitas & Sides */}
        {sides.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground border-l-4 border-orange-500 pl-4 mb-8">
              Breads, Raitas & Sides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sides.map((item: any) => (
                <MenuCard key={item.id} {...item} />
              ))}
            </div>
          </div>
        )}

        {/* Sweets & Desserts */}
        {sweets.length > 0 && (
          <div>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground border-l-4 border-pink-500 pl-4 mb-8">
              Sweets & Desserts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sweets.map((item: any) => (
                <MenuCard key={item.id} {...item} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
