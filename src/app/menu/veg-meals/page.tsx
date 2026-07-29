"use client";

import { motion } from "framer-motion";
import { MenuCard } from "@/components/shared/MenuCard";

export default function VegMealsPage() {
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
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground border-l-4 border-primary pl-4 mb-8">
            Pocket Friendly Meals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <MenuCard
              title="Pocket Friendly Thali"
              originalPrice={90}
              price={79}
              discount="12%"
              image="/images/regular veg thali.jpeg"
              badge="Bestseller"
              items={["4 Butter Roti", "Dal of the day", "Jeera Rice", "Seasonal Sabzi", "Fresh Salad", "Pickle"]}
              extras={[{ name: "Butter Roti", price: 10 }, { name: "Ghee Roti", price: 15 }, { name: "250ml Raita", price: 20 }, { name: "Rasgulla", price: 10 }]}
            />
            <MenuCard
              title="Special Combo Thali"
              originalPrice={129}
              price={99}
              discount="23%"
              image="/images/regular veg thali.jpeg"
              badge="Must Try"
              items={["Pocket Friendly Thali", "250ml Boondi Raita", "1 Rasgulla"]}
              extras={[{ name: "Butter Roti", price: 10 }, { name: "Ghee Roti", price: 15 }]}
            />
          </div>
        </div>

        {/* Deluxe */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground border-l-4 border-secondary pl-4 mb-8">
            Deluxe Meals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <MenuCard
              title="Deluxe Veg Thali"
              originalPrice={150}
              price={135}
              discount="10%"
              image="/images/delux thali.jpeg"
              badge="Premium"
              disabled={true}
              items={["Paneer Sabzi", "Dal Makhani / Dal Fry", "Jeera Rice", "4 Butter Roti", "Fresh Salad", "Pickle", "Sweet of the day"]}
              extras={[{ name: "Butter Roti", price: 10 }, { name: "Ghee Roti", price: 15 }]}
            />
          </div>
        </div>

        {/* Raitas */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground border-l-4 border-orange-500 pl-4 mb-8">
            Breads, Raitas & Sides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <MenuCard
              title="Boondi Raita (100ml)"
              price={10}
              image="/images/raita rs 10 img.jpeg"
              items={["Fresh Dahi", "Crispy Boondi", "Roasted Jeera", "Black Salt"]}
            />
            <MenuCard
              title="Boondi Raita (250ml)"
              price={20}
              badge="Family Size"
              image="/images/raita 20 img .jpeg"
              items={["Fresh Dahi", "Crispy Boondi", "Roasted Jeera", "Black Salt"]}
            />
            <MenuCard
              title="Roasted Papad (1 Pc)"
              price={7}
              image="/images/papad 7 rupee per piece.jpeg"
              items={["Crispy Roasted Papad", "Perfect side for thalis"]}
            />
            <MenuCard
              title="Plain Roti"
              price={7}
              image="/images/butter roti.jpeg"
              items={["Soft Wheat Roti", "Freshly baked"]}
            />
            <MenuCard
              title="Butter Roti"
              price={15}
              image="/images/butter roti.jpeg"
              items={["Soft Wheat Roti", "Amul Butter Spread"]}
            />
            <MenuCard
              title="Ghee Roti"
              price={20}
              image="/images/ghee roti.jpeg"
              items={["Soft Wheat Roti", "Pure Desi Ghee"]}
            />
          </div>
        </div>

        {/* Sweets */}
        <div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground border-l-4 border-pink-500 pl-4 mb-8">
            Sweets & Desserts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <MenuCard
              title="Gulab Jamun (2 Pcs)"
              price={40}
              image="/images/gulab jamun.jpeg"
              items={["Soft & Spongy", "Sugar Syrup", "Cardamom Flavour"]}
            />
            <MenuCard
              title="Rasgulla (1 Pc)"
              price={10}
              image="/images/rasgulla.jpeg"
              items={["Soft & Spongy", "Sugar Syrup"]}
            />

          </div>
        </div>

      </div>
    </div>
  );
}
