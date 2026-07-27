"use client";

import { motion } from "framer-motion";
import { ChefHat } from "lucide-react";
import Link from "next/link";

type ComingSoonProps = {
  title: string;
  description: string;
};

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="pt-20 pb-20 bg-background min-h-[80vh] flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-secondary blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="relative z-10 text-center px-4 max-w-2xl mx-auto"
      >
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <ChefHat className="w-12 h-12 text-primary" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-6">
          {title}
        </h1>
        
        <p className="text-xl text-muted-foreground font-subheading mb-10">
          {description}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href={`https://wa.me/917065665988?text=Hi,%20please%20notify%20me%20when%20${encodeURIComponent(title)}%20is%20available.`}
            target="_blank"
            className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-bold rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          >
            Notify Me on WhatsApp
          </Link>
          <Link 
            href="/menu/veg-meals" 
            className="w-full sm:w-auto px-8 py-3 bg-white text-foreground border border-border font-bold rounded-full hover:border-primary hover:text-primary transition-all"
          >
            Explore Veg Menu
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
