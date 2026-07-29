"use client";

import { useState } from "react";
import { MenuCard } from "@/components/shared/MenuCard";
import { motion } from "framer-motion";

const categories = ["All", "Veg Meals", "Food Combos", "Parathas", "Diet Foods", "Raitas & Sides", "Sweets & Desserts"];

const allItems = [
  // ─── Veg Meals ───────────────────────────────────────────────
  {
    category: "Veg Meals",
    title: "Standard Veg Thali",
    originalPrice: 90,
    price: 79,
    discount: "12%",
    image: "/images/regular veg thali.jpeg",
    badge: "Bestseller",
    items: ["4 Butter Roti", "Dal of the Day", "Jeera Rice", "Seasonal Sabzi", "Fresh Salad", "Pickle"],
    extras: [{ name: "Butter Roti", price: 10 }, { name: "Raita 100ml", price: 20 }],
  },
  {
    category: "Veg Meals",
    title: "Deluxe Veg Thali",
    originalPrice: 150,
    price: 135,
    discount: "10%",
    image: "/images/delux thali.jpeg",
    badge: "Premium",
    items: ["Paneer Sabzi", "Dal Makhani / Dal Fry", "Jeera Rice", "4 Butter Roti", "Fresh Salad", "Pickle", "Sweet of the Day"],
    extras: [{ name: "Extra Roti", price: 10 }, { name: "Raita 250ml", price: 20 }],
  },

  // ─── Food Combos ─────────────────────────────────────────────
  {
    category: "Food Combos",
    title: "Chhole Rice Combo",
    originalPrice: 99,
    price: 89,
    discount: "10%",
    image: "/images/chhole chawal combo.jpeg",
    items: ["Punjabi Style Chhole", "Steamed Rice", "Onion Salad", "Pickle"],
    extras: [{ name: "Extra Rice (Half)", price: 30 }],
  },
  {
    category: "Food Combos",
    title: "Rajma Rice Combo",
    originalPrice: 99,
    price: 89,
    discount: "10%",
    image: "/images/rajma chawal combo.jpeg",
    items: ["Home-style Rajma", "Steamed Rice", "Onion Salad", "Pickle"],
    extras: [{ name: "Extra Rice (Half)", price: 30 }],
  },

  // ─── Parathas ────────────────────────────────────────────────
  {
    category: "Parathas",
    title: "Stuffed Paratha (1 Pc)",
    price: 50,
    image: "/images/aalu parata comboo.jpeg",
    items: ["1 Large Aloo/Gobi/Onion Paratha", "Fresh Dahi (50ml)", "Achar"],
    extras: [{ name: "50ml Dahi", price: 15 }, { name: "Extra Achar", price: 10 }],
  },
  {
    category: "Parathas",
    title: "Stuffed Paratha (2 Pcs)",
    price: 80,
    badge: "Best Value",
    image: "/images/aalu parata comboo.jpeg",
    items: ["2 Large Aloo/Gobi/Onion Parathas", "Fresh Dahi (100ml)", "Achar"],
    extras: [{ name: "100ml Dahi", price: 25 }, { name: "Extra Achar", price: 10 }],
  },
  {
    category: "Parathas",
    title: "Paneer Paratha (1 Pc)",
    price: 70,
    image: "/images/paneer paratha.jpeg",
    items: ["1 Large Paneer Paratha", "Fresh Dahi (50ml)", "Achar"],
    extras: [{ name: "50ml Dahi", price: 15 }, { name: "Extra Achar", price: 10 }],
  },
  {
    category: "Parathas",
    title: "Paneer Paratha (2 Pcs)",
    price: 120,
    image: "/images/paneer paratha.jpeg",
    items: ["2 Large Paneer Parathas", "Fresh Dahi (100ml)", "Achar"],
    extras: [{ name: "100ml Dahi", price: 25 }, { name: "Extra Achar", price: 10 }],
  },

  // ─── Diet Foods ───────────────────────────────────────────────
  {
    category: "Diet Foods",
    title: "Classic Sprouts Salad",
    originalPrice: 90,
    price: 81,
    discount: "10%",
    badge: "High Protein",
    image: "/images/sprouts salad.jpeg",
    items: ["Mixed Sprouts (Moong, Chana)", "Cucumber & Tomato", "Lemon Dressing", "Black Salt", "Fresh Coriander"],
  },
  {
    category: "Diet Foods",
    title: "Masala Sprouts Bowl",
    originalPrice: 100,
    price: 90,
    discount: "10%",
    badge: "Bestseller",
    image: "/images/sprouts salad.jpeg",
    items: ["Mixed Sprouts", "Onion & Green Chilli", "Chaat Masala", "Sev Topping", "Mint Chutney"],
  },
  {
    category: "Diet Foods",
    title: "Seasonal Fruit Bowl",
    originalPrice: 100,
    price: 90,
    discount: "10%",
    image: "/images/fruit salad.jpeg",
    badge: "Refreshing",
    items: ["Seasonal Fruits (5 types)", "Apple & Banana", "Pomegranate", "Light Sugar Syrup", "Lemon Zest"],
  },
  {
    category: "Diet Foods",
    title: "Cream Fruit Salad",
    originalPrice: 100,
    price: 90,
    discount: "10%",
    image: "/images/fruit salad.jpeg",
    badge: "Kids Favourite",
    items: ["Mixed Fruits", "Fresh Cream", "Dry Fruits", "Chaat Masala", "Cherry on Top"],
  },

  // ─── Raitas & Sides ──────────────────────────────────────────
  {
    category: "Raitas & Sides",
    title: "Boondi Raita (100ml)",
    price: 10,
    image: "/images/raita rs 10 img.jpeg",
    items: ["Fresh Dahi", "Crispy Boondi", "Roasted Jeera", "Black Salt"],
  },
  {
    category: "Raitas & Sides",
    title: "Boondi Raita (250ml)",
    price: 20,
    badge: "Family Size",
    image: "/images/raita 20 img .jpeg",
    items: ["Fresh Dahi", "Crispy Boondi", "Roasted Jeera", "Black Salt"],
  },
  {
    category: "Raitas & Sides",
    title: "Roasted Papad (1 Pc)",
    price: 7,
    image: "/images/papad 7 rupee per piece.jpeg",
    items: ["Crispy Roasted Papad", "Perfect side for thalis"],
  },
  {
    category: "Raitas & Sides",
    title: "Butter Roti",
    price: 15,
    image: "/images/butter roti.jpeg",
    items: ["Soft Wheat Roti", "Amul Butter Spread"],
  },
  {
    category: "Raitas & Sides",
    title: "Ghee Roti",
    price: 20,
    image: "/images/ghee roti.jpeg",
    items: ["Soft Wheat Roti", "Pure Desi Ghee"],
  },

  // ─── Sweets & Desserts ────────────────────────────────────────
  {
    category: "Sweets & Desserts",
    title: "Gulab Jamun (2 Pcs)",
    price: 40,
    image: "/images/gulab jamun.jpeg",
    items: ["Soft & Spongy", "Sugar Syrup", "Cardamom Flavour"],
  },
  {
    category: "Sweets & Desserts",
    title: "Kheer / Phirni",
    price: 60,
    badge: "Weekend Special",
    image: "/images/rasgulla.jpeg",
    items: ["Basmati Rice", "Full Cream Milk", "Dry Fruits", "Saffron"],
  },
];

export default function FullMenuPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? allItems
    : allItems.filter((item) => item.category === activeCategory);

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
