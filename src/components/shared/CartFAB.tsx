"use client";

import { ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";

export function CartFAB() {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.button
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 20 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-24 right-6 z-50 bg-primary text-white px-5 py-3 rounded-full shadow-[0_4px_20px_rgba(178,58,58,0.4)] flex items-center gap-2 font-bold hover:bg-primary/90 transition-all hover:scale-105"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>{totalItems} item{totalItems > 1 ? "s" : ""}</span>
          <span className="bg-white text-primary text-xs font-black px-2 py-0.5 rounded-full">View Cart</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
