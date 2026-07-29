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
  disabled?: boolean;
};

export function MenuCard({
  title, originalPrice, price, discount, description, items, extras, image, badge, isVeg = true, disabled = false
}: MenuCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number }[]>([]);

  const handleAdd = () => {
    if (extras && extras.length > 0 && !showExtras) {
      setShowExtras(true);
      return;
    }
    
    addToCart({ title, price, extras: selectedExtras });
    setAdded(true);
    setShowExtras(false);
    setSelectedExtras([]);
    setTimeout(() => setAdded(false), 1500);
  };

  const toggleExtra = (extra: { name: string; price: number }) => {
    setSelectedExtras(prev => 
      prev.some(e => e.name === extra.name)
        ? prev.filter(e => e.name !== extra.name)
        : [...prev, extra]
    );
  };

  return (
    <motion.div
      whileHover={disabled ? {} : { y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
      className={`bg-white rounded-2xl overflow-hidden shadow-md border border-border/60 transition-all duration-300 flex flex-col h-full group ${disabled ? "opacity-75 grayscale-[0.3]" : ""}`}
    >
      {/* Image */}
      <div className="relative h-52 w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className={`object-cover transition-transform duration-500 ${!disabled && "group-hover:scale-105"}`}
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
        {discount && !disabled && (
          <div className="absolute bottom-3 right-3 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md z-10">
            {discount} OFF
          </div>
        )}
        {disabled && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="bg-white/95 text-foreground px-4 py-1.5 rounded-full font-bold text-sm shadow-lg">
              Coming Soon
            </span>
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

        {/* Add-ons Selector Overlay */}
        <AnimatePresence>
          {showExtras && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-x-0 bottom-0 bg-white border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4 rounded-t-2xl z-30 flex flex-col"
            >
              <div className="flex justify-between items-center mb-3">
                <p className="font-heading font-bold text-foreground">Select Add-ons</p>
                <button onClick={() => setShowExtras(false)} className="text-muted-foreground hover:text-foreground text-sm font-subheading">Skip</button>
              </div>
              <div className="flex flex-col gap-2 mb-4 overflow-y-auto max-h-32">
                {extras?.map((extra, idx) => {
                  const isSelected = selectedExtras.some(e => e.name === extra.name);
                  return (
                    <label key={idx} className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleExtra(extra)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-subheading text-foreground">{extra.name}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">+₹{extra.price}</span>
                    </label>
                  );
                })}
              </div>
              <motion.button
                onClick={handleAdd}
                whileTap={{ scale: 0.95 }}
                className="w-full bg-primary text-white font-subheading font-bold py-2.5 rounded-xl flex items-center justify-center shadow-md"
              >
                Confirm & Add
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add to Order Button */}
        <motion.button
          onClick={handleAdd}
          disabled={disabled}
          whileTap={disabled ? {} : { scale: 0.95 }}
          className={`w-full mt-auto font-subheading font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 relative z-20 ${
            disabled 
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : added
                ? "bg-green-500 text-white"
                : showExtras
                  ? "bg-transparent border-2 border-primary text-primary opacity-0 pointer-events-none"
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
