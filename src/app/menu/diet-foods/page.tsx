"use client";

import { MenuCard } from "@/components/shared/MenuCard";
import { motion } from "framer-motion";
import { Leaf, Salad } from "lucide-react";

export default function DietFoodsPage() {
  return (
    <div className="pt-20 pb-20 bg-background min-h-screen">
      {/* Banner */}
      <div className="relative bg-gradient-to-r from-green-700 to-green-500 py-16 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070')" }} />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="w-6 h-6 text-white" />
            <span className="text-white/80 font-subheading text-sm uppercase tracking-widest">Healthy Choices</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4">Diet Foods</h1>
          <div className="w-24 h-1 bg-white/40 mx-auto rounded-full mb-4" />
          <p className="text-white/80 font-subheading text-lg max-w-xl mx-auto px-4">
            Nutritious, calorie-conscious meals for a healthier you. Made fresh daily with zero compromise on taste.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Sprouts Section */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-8"
          >
            <Salad className="w-6 h-6 text-secondary" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Sprouts Salad</h2>
            <div className="flex-1 h-px bg-border ml-4" />
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Classic Sprouts — moong & chana sprouts bowl with veggies */}
            <MenuCard
              title="Classic Sprouts Salad"
              originalPrice={90}
              price={81}
              discount="10%"
              image="/images/sprouts salad.jpeg"
              badge="High Protein"
              items={["Mixed Sprouts (Moong, Chana)", "Cucumber & Tomato", "Lemon Dressing", "Black Salt & Spices", "Fresh Coriander"]}
              description="Power-packed bowl of mixed sprouts loaded with plant-based protein and fiber."
            />

            {/* Masala Sprouts — chaat style sprouts bowl */}
            <MenuCard
              title="Masala Sprouts Bowl"
              originalPrice={100}
              price={90}
              discount="10%"
              image="/images/sprouts salad.jpeg"
              badge="Bestseller"
              items={["Mixed Sprouts", "Onion & Green Chilli", "Chaat Masala", "Sev Topping", "Lemon Squeeze", "Mint Chutney"]}
              description="Street-style masala sprouts that's healthy, filling, and absolutely delicious."
            />

            {/* Protein Power — sprouts with paneer and bell peppers */}
            <MenuCard
              title="Protein Power Sprouts"
              originalPrice={100}
              price={90}
              discount="10%"
              image="/images/sprouts salad.jpeg"
              badge="Best Value"
              items={["Moong Dal Sprouts", "Chickpea Sprouts", "Paneer Cubes", "Bell Peppers", "Olive Oil Dressing"]}
              description="Extra protein from paneer and chickpea sprouts. Gym-goers' favourite!"
            />

          </div>
        </div>

        {/* Fruit Salad Section */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-8"
          >
            <Salad className="w-6 h-6 text-primary" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Fruit Salad</h2>
            <div className="flex-1 h-px bg-border ml-4" />
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Seasonal Fruit Bowl — colourful bowl of mixed cut fruits */}
            <MenuCard
              title="Seasonal Fruit Bowl"
              originalPrice={100}
              price={90}
              discount="10%"
              image="/images/fruit salad.jpeg"
              badge="Refreshing"
              items={["Seasonal Fruits (5 types)", "Apple & Banana", "Pomegranate Seeds", "Light Sugar Syrup", "Lemon Zest"]}
              description="A colourful bowl of seasonal Indian fruits, freshly cut and chilled."
            />

            {/* Cream Fruit Salad — fruits topped with cream */}
            <MenuCard
              title="Cream Fruit Salad"
              originalPrice={100}
              price={90}
              discount="10%"
              image="/images/fruit salad.jpeg"
              badge="Kids Favourite"
              items={["Mixed Fruits", "Fresh Cream", "Dry Fruits", "Chaat Masala", "Cherry on Top"]}
              description="Classic cream fruit salad — indulgent yet nourishing. A dessert and snack in one!"
            />

            {/* Mango Fruit Salad — mango chunks with watermelon and mint */}
            <MenuCard
              title="Mango Fruit Salad"
              originalPrice={100}
              price={90}
              discount="10%"
              image="/images/fruit salad.jpeg"
              badge="Seasonal Special"
              items={["Alphonso Mango Chunks", "Mixed Berries", "Watermelon", "Fresh Mint Leaves", "Honey Drizzle"]}
              description="King of fruits meets a refreshing fruit salad! Available during mango season."
            />

          </div>
        </div>

      </div>
    </div>
  );
}
