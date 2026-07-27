"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Leaf } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

type MenuCardProps = {
  title: string;
  originalPrice?: number;
  price: number;
  discount?: string;
  description?: string;
  items: string[];
  extras?: { name: string; price: number }[];
  image: string;
  badge?: string;
  isVeg?: boolean;
};

export function MenuCard({
  title, originalPrice, price, discount, description, items, extras, image, badge, isVeg = true
}: MenuCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart({ title, price });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-border/60 transition-all duration-300 flex flex-col h-full group"
    >
      {/* Image */}
      <div className="relative h-52 w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Veg/Non-veg indicator */}
        <div className={`absolute top-3 left-3 w-5 h-5 border-2 flex items-center justify-center rounded-sm z-10 bg-white ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
        </div>
        {badge && (
          <div className="absolute top-3 right-3 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
            {badge}
          </div>
        )}
        {discount && (
          <div className="absolute bottom-3 right-3 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-10">
            {discount} OFF
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      <div className="p-5 flex flex-col flex-grow">
        {/* Title & Price */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-heading font-bold text-foreground pr-2 leading-tight">{title}</h3>
          <div className="text-right shrink-0">
            {originalPrice && (
              <p className="text-xs text-muted-foreground line-through">₹{originalPrice}</p>
            )}
            <p className="text-xl font-heading font-black text-primary">₹{price}</p>
          </div>
        </div>

        {description && (
          <p className="text-xs text-muted-foreground mb-3 font-subheading leading-relaxed">{description}</p>
        )}

        {/* Included items */}
        <div className="mb-4 flex-grow">
          <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Leaf className="w-3 h-3 text-secondary" /> What's Included
          </p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-foreground/70 font-subheading">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Add-ons */}
        {extras && extras.length > 0 && (
          <div className="mb-4 pt-3 border-t border-dashed border-border">
            <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2">Add-ons</p>
            <div className="flex flex-wrap gap-2">
              {extras.map((extra, idx) => (
                <span key={idx} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full border border-border">
                  {extra.name} +₹{extra.price}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Add to Order Button */}
        <motion.button
          onClick={handleAdd}
          whileTap={{ scale: 0.95 }}
          className={`w-full mt-auto font-subheading font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
            added
              ? "bg-green-500 text-white"
              : "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg"
          }`}
        >
          <AnimatePresence mode="wait">
            {added ? (
              <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Added to Cart!
              </motion.span>
            ) : (
              <motion.span key="add" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add to Order
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}
