"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Leaf, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

type MenuCardProps = {
  title: string;
  originalPrice?: number;
  price: number;
  discount?: string;
  description?: string;
  items: string[];
  sabjiOptions?: string[];
  extras?: { name: string; price: number }[];
  image: string;
  badge?: string;
  isVeg?: boolean;
  disabled?: boolean;
};

export function MenuCard({
  title, originalPrice, price, discount, description, items, sabjiOptions, extras, image, badge, isVeg = true, disabled = false
}: MenuCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [showSabji, setShowSabji] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number }[]>([]);
  const [selectedSabjis, setSelectedSabjis] = useState<string[]>([]);
  const [upgradedToCombo, setUpgradedToCombo] = useState(false);

  const handleInitialAdd = () => {
    if (sabjiOptions && sabjiOptions.length > 0) {
      setShowSabji(true);
      return;
    }
    if (extras && extras.length > 0) {
      setShowExtras(true);
      return;
    }
    
    addToCart({ title, price, extras: [] });
    triggerAdded();
  };

  const handleSabjiContinue = () => {
    if (selectedSabjis.length !== 2) return;
    setShowSabji(false);
    if (extras && extras.length > 0) {
      setShowExtras(true);
    } else {
      const combinedExtras = selectedSabjis.map(s => ({ name: s, price: 0 }));
      addToCart({ title, price, extras: combinedExtras });
      triggerAdded();
    }
  };

  const handleExtrasFinish = () => {
    let finalTitle = title;
    let finalPrice = price;
    let finalExtras = [...selectedExtras];

    const hasRaita = selectedExtras.some(e => e.name.toLowerCase().includes("raita") && !e.name.toLowerCase().includes("250ml"));
    const hasSweet = selectedExtras.some(e => e.name.toLowerCase().includes("rasgulla") || e.name.toLowerCase().includes("gulab jamun"));

    if (price === 79 && hasRaita && hasSweet) {
      finalTitle = "Special Combo Thali (with FREE Raita & Rasgulla)";
      finalPrice = 99;
      
      let foundRaita = false;
      let foundSweet = false;
      finalExtras = finalExtras.map(e => {
        if (!foundRaita && e.name.toLowerCase().includes("raita")) {
          foundRaita = true;
          return { ...e, price: 0 };
        }
        if (!foundSweet && (e.name.toLowerCase().includes("rasgulla") || e.name.toLowerCase().includes("gulab jamun"))) {
          foundSweet = true;
          return { ...e, price: 0 };
        }
        return e;
      });
      
      setUpgradedToCombo(true);
      setTimeout(() => setUpgradedToCombo(false), 3000);
    }

    const combinedExtras = [
      ...selectedSabjis.map(s => ({ name: s, price: 0 })),
      ...finalExtras
    ];
    addToCart({ title: finalTitle, price: finalPrice, extras: combinedExtras });
    setShowExtras(false);
    triggerAdded();
  };

  const handleSkipExtras = () => {
    const combinedExtras = selectedSabjis.map(s => ({ name: s, price: 0 }));
    addToCart({ title, price, extras: combinedExtras });
    setShowExtras(false);
    triggerAdded();
  };

  const triggerAdded = () => {
    setAdded(true);
    setSelectedSabjis([]);
    setSelectedExtras([]);
    setTimeout(() => setAdded(false), 1500);
  };

  const addExtra = (extra: { name: string; price: number }) => {
    setSelectedExtras(prev => [...prev, extra]);
  };

  const removeExtra = (name: string) => {
    setSelectedExtras(prev => {
      const idx = prev.findIndex(e => e.name === name);
      if (idx !== -1) {
        const newExtras = [...prev];
        newExtras.splice(idx, 1);
        return newExtras;
      }
      return prev;
    });
  };

  const toggleSabji = (option: string) => {
    setSelectedSabjis(prev => {
      if (prev.includes(option)) {
        return prev.filter(s => s !== option);
      }
      if (prev.length < 2) {
        return [...prev, option];
      }
      return prev;
    });
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

        {/* Sabji Options Note */}
        {sabjiOptions && sabjiOptions.length > 0 && (
          <div className="mb-4 pt-3 border-t border-dashed border-border">
            <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2 text-primary">Choice of 2 Sabjis Included</p>
            <div className="flex flex-wrap gap-2">
              {sabjiOptions.map((opt, idx) => (
                <span key={idx} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-200">
                  {opt}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Add-ons Note */}
        {extras && extras.length > 0 && (
          <div className="mb-4 pt-3 border-t border-dashed border-border">
            <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2">Add-ons Available</p>
          </div>
        )}

        {/* OVERLAYS */}
        <AnimatePresence>
          {/* Sabji Selection Overlay */}
          {showSabji && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-x-0 bottom-0 bg-white border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4 rounded-t-2xl z-40 flex flex-col"
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="font-heading font-bold text-foreground">Select Sabjis</p>
                  <p className="text-xs text-primary font-bold">Pick exactly 2</p>
                </div>
                <button onClick={() => setShowSabji(false)} className="text-muted-foreground hover:text-foreground text-sm font-subheading">✕ Close</button>
              </div>
              <div className="flex flex-col gap-2 mb-4 overflow-y-auto max-h-48">
                {sabjiOptions?.map((opt, idx) => {
                  const isSelected = selectedSabjis.includes(opt);
                  const isDisabled = !isSelected && selectedSabjis.length >= 2;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => !isDisabled && toggleSabji(opt)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : isDisabled ? 'opacity-50 cursor-not-allowed bg-muted/30' : 'border-border hover:bg-muted/50'}`}
                    >
                      <span className="text-sm font-subheading font-medium text-foreground">{opt}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <motion.button
                onClick={handleSabjiContinue}
                disabled={selectedSabjis.length !== 2}
                whileTap={{ scale: 0.95 }}
                className={`w-full font-subheading font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all ${selectedSabjis.length === 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}
              >
                Continue
              </motion.button>
            </motion.div>
          )}

          {/* Extras Selection Overlay */}
          {showExtras && !showSabji && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-x-0 bottom-0 bg-white border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4 rounded-t-2xl z-30 flex flex-col"
            >
              <div className="flex justify-between items-center mb-3">
                <p className="font-heading font-bold text-foreground">Select Add-ons</p>
                <button onClick={() => setShowExtras(false)} className="text-muted-foreground hover:text-foreground text-sm font-subheading">✕ Close</button>
              </div>
              <div className="flex flex-col gap-2 mb-4 overflow-y-auto max-h-48">
                {extras?.map((extra, idx) => {
                  const count = selectedExtras.filter(e => e.name === extra.name).length;
                  return (
                    <div key={idx} className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${count > 0 ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                      <div className="flex flex-col">
                        <span className="text-sm font-subheading font-medium text-foreground">{extra.name}</span>
                        <span className="text-sm font-bold text-primary">+₹{extra.price}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white border border-border rounded-lg p-1 shadow-sm">
                        <button 
                          onClick={() => removeExtra(extra.name)} 
                          disabled={count === 0}
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-muted text-muted-foreground hover:bg-primary hover:text-white disabled:opacity-50 disabled:hover:bg-muted disabled:hover:text-muted-foreground transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-bold w-4 text-center text-foreground">{count}</span>
                        <button 
                          onClick={() => addExtra(extra)} 
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-muted text-muted-foreground hover:bg-primary hover:text-white transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col gap-2">
                <motion.button
                  onClick={handleExtrasFinish}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-primary text-white font-subheading font-bold py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add to Order · ₹{
                      price === 79 && 
                      selectedExtras.some(e => e.name.toLowerCase().includes("raita") && !e.name.toLowerCase().includes("250ml")) && 
                      selectedExtras.some(e => e.name.toLowerCase().includes("rasgulla") || e.name.toLowerCase().includes("gulab jamun"))
                      ? (() => {
                          let cost = 99;
                          let fR = false; let fS = false;
                          selectedExtras.forEach(e => {
                            if (!fR && e.name.toLowerCase().includes("raita")) fR = true;
                            else if (!fS && (e.name.toLowerCase().includes("rasgulla") || e.name.toLowerCase().includes("gulab jamun"))) fS = true;
                            else cost += e.price;
                          });
                          return cost;
                      })()
                      : price + selectedExtras.reduce((s, e) => s + e.price, 0)
                    }
                  </div>
                  {price === 79 && 
                   selectedExtras.some(e => e.name.toLowerCase().includes("raita") && !e.name.toLowerCase().includes("250ml")) && 
                   selectedExtras.some(e => e.name.toLowerCase().includes("rasgulla") || e.name.toLowerCase().includes("gulab jamun")) && (
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">🎉 Upgraded to Special Combo!</span>
                  )}
                </motion.button>
                <motion.button
                  onClick={handleSkipExtras}
                  whileTap={{ scale: 0.97 }}
                  className="w-full bg-muted border border-border text-foreground/70 font-subheading font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
                >
                  Proceed without Add-ons · ₹{price}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add to Order Button */}
        <motion.button
          onClick={handleInitialAdd}
          disabled={disabled}
          whileTap={disabled ? {} : { scale: 0.95 }}
          className={`w-full mt-auto font-subheading font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 relative z-20 ${
            disabled 
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : added
                ? "bg-green-500 text-white"
                : (showExtras || showSabji)
                  ? "bg-transparent border-2 border-primary text-primary opacity-0 pointer-events-none"
                  : "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg"
          }`}
        >
          <AnimatePresence mode="wait">
            {disabled ? (
              <motion.span key="coming" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                Coming Soon
              </motion.span>
            ) : added ? (
              <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                <Check className="w-4 h-4" /> {upgradedToCombo ? "Upgraded to Special Combo!" : "Added to Cart!"}
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

