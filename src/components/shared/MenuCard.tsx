"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Leaf, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { useSiteData } from "@/context/SiteContext";

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
  disabledText?: string;
};

export function MenuCard({
  title, originalPrice, price, discount, description, items, sabjiOptions, extras, image, badge, isVeg = true, disabled = false, disabledText
}: MenuCardProps) {
  const { addToCart } = useCart();
  const { siteData } = useSiteData();
  
  const isLunch = title.toLowerCase().includes("lunch") || badge?.toLowerCase().includes("lunch");
  const isDinner = title.toLowerCase().includes("dinner") || badge?.toLowerCase().includes("dinner");
  
  let paneerAvailable = false;
  let paneerName = "Paneer";
  
  if (isLunch) {
    paneerAvailable = siteData?.settings?.paneerAvailableLunch || false;
    paneerName = siteData?.settings?.paneerNameLunch || "Paneer";
  } else if (isDinner) {
    paneerAvailable = siteData?.settings?.paneerAvailableDinner || false;
    paneerName = siteData?.settings?.paneerNameDinner || "Paneer";
  } else {
    paneerAvailable = siteData?.settings?.paneerAvailableLunch || siteData?.settings?.paneerAvailableDinner || false;
    paneerName = siteData?.settings?.paneerNameLunch || siteData?.settings?.paneerNameDinner || "Paneer";
  }

  const finalSabjiOptions = sabjiOptions && paneerAvailable 
    ? (sabjiOptions.includes(paneerName) ? sabjiOptions : [...sabjiOptions, paneerName])
    : sabjiOptions;

  const [added, setAdded] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [showSabji, setShowSabji] = useState(false);
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number }[]>([]);
  const [selectedSabjis, setSelectedSabjis] = useState<string[]>([]);
  const [upgradedToCombo, setUpgradedToCombo] = useState(false);

  const isPaneerSelected = selectedSabjis.includes(paneerName);
  const effectiveBasePrice = isPaneerSelected ? 99 : price;

  const handleInitialAdd = () => {
    if (finalSabjiOptions && finalSabjiOptions.length > 0) {
      setShowSabji(true);
      return;
    }
    if (extras && extras.length > 0) {
      setShowExtras(true);
      return;
    }
    
    addToCart({ title, price: effectiveBasePrice, extras: [] });
    triggerAdded();
  };

  const handleSabjiContinue = () => {
    if (selectedSabjis.length !== 2) return;
    setShowSabji(false);
    if (extras && extras.length > 0) {
      setShowExtras(true);
    } else {
      const combinedExtras = selectedSabjis.map(s => ({ name: s, price: 0 }));
      addToCart({ title, price: effectiveBasePrice, extras: combinedExtras });
      triggerAdded();
    }
  };

  const handleExtrasFinish = () => {
    let finalTitle = title;
    let finalPrice = effectiveBasePrice;
    let finalExtras = [...selectedExtras];

    const hasRaita = selectedExtras.some(e => e.name.toLowerCase().includes("raita") && !e.name.toLowerCase().includes("250ml"));
    const hasSweet = selectedExtras.some(e => e.name.toLowerCase().includes("rasgulla") || e.name.toLowerCase().includes("gulab jamun"));

    if (effectiveBasePrice === 79 && hasRaita && hasSweet) {
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
    addToCart({ title, price: effectiveBasePrice, extras: combinedExtras });
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
        {finalSabjiOptions && finalSabjiOptions.length > 0 && (
          <div className="mb-4 pt-3 border-t border-dashed border-border">
            <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2 text-primary">Choice of 2 Sabjis Included</p>
            <div className="flex flex-wrap gap-2">
              {finalSabjiOptions.map((opt, idx) => (
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

        {/* OVERLAYS -> Upgraded to Smooth Fullscreen / Mobile Bottom Sheet */}
        <AnimatePresence>
          {(showSabji || showExtras) && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowSabji(false);
                  setShowExtras(false);
                }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0"
              />

              {/* Bottom Sheet on Mobile / Centered Modal on Desktop */}
              <motion.div
                initial={{ y: "100%", opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden border border-border/40"
              >
                {/* Mobile Drag Indicator */}
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                  <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                </div>

                {/* Modal Header */}
                <div className="px-5 pt-3 pb-4 border-b border-border/70 flex items-center justify-between">
                  <div className="flex items-center gap-3 pr-2">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-border/60 shadow-sm">
                      <Image src={image} alt={title} fill className="object-cover" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-base sm:text-lg text-foreground leading-snug line-clamp-1">{title}</h4>
                      <p className="text-xs font-semibold text-primary font-subheading">
                        {showSabji ? "Step 1 of 2: Select 2 Sabjis" : (finalSabjiOptions && finalSabjiOptions.length > 0) ? "Step 2 of 2: Add Extras" : "Customize Your Order"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSabji(false);
                      setShowExtras(false);
                    }}
                    className="w-9 h-9 rounded-full bg-muted/80 hover:bg-muted text-foreground flex items-center justify-center transition-colors shrink-0"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-5 overflow-y-auto space-y-4 flex-1">
                  {showSabji ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">Choose Any 2 Sabjis</p>
                          <p className="text-xs text-muted-foreground font-subheading">
                            {paneerAvailable ? `Selecting ${paneerName} updates Thali to ₹99` : "Included in your meal"}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${selectedSabjis.length === 2 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                          {selectedSabjis.length}/2 Selected
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {finalSabjiOptions?.map((opt, idx) => {
                          const isSelected = selectedSabjis.includes(opt);
                          const isMaxSelected = !isSelected && selectedSabjis.length >= 2;
                          const isPaneer = opt === paneerName;
                          
                          return (
                            <div
                              key={idx}
                              onClick={() => !isMaxSelected && toggleSabji(opt)}
                              className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none ${
                                isSelected
                                  ? 'border-primary bg-primary/5 shadow-sm'
                                  : isMaxSelected
                                    ? 'opacity-40 cursor-not-allowed border-border/50 bg-muted/20'
                                    : 'border-border/80 hover:border-primary/50 hover:bg-muted/30 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isSelected ? 'bg-primary border-primary' : 'border-gray-300 bg-white'
                                }`}>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                </div>
                                <span className={`text-sm font-subheading font-semibold ${isSelected ? 'text-primary font-bold' : 'text-foreground'}`}>
                                  {opt}
                                </span>
                              </div>
                              {isPaneer && (
                                <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                  ₹99 Thali
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-3">
                        <p className="text-sm font-bold text-foreground">Enhance Your Meal with Add-ons</p>
                        <p className="text-xs text-muted-foreground font-subheading">
                          Optional extras freshly prepared for you
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {extras?.map((extra, idx) => {
                          const count = selectedExtras.filter(e => e.name === extra.name).length;
                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                count > 0 ? 'border-primary bg-primary/5 shadow-sm' : 'border-border/80 bg-white'
                              }`}
                            >
                              <div className="flex flex-col pr-2">
                                <span className="text-sm font-subheading font-semibold text-foreground">{extra.name}</span>
                                <span className="text-xs font-bold text-primary">+₹{extra.price}</span>
                              </div>

                              <div className="flex items-center gap-2.5 bg-muted/60 border border-border/80 rounded-xl p-1 shadow-inner">
                                <button
                                  type="button"
                                  onClick={() => removeExtra(extra.name)}
                                  disabled={count === 0}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-foreground shadow-sm hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-foreground transition-all"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-bold w-5 text-center text-foreground">{count}</span>
                                <button
                                  type="button"
                                  onClick={() => addExtra(extra)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Combo upgrade notification */}
                      {price === 79 && 
                       selectedExtras.some(e => e.name.toLowerCase().includes("raita") && !e.name.toLowerCase().includes("250ml")) && 
                       selectedExtras.some(e => e.name.toLowerCase().includes("rasgulla") || e.name.toLowerCase().includes("gulab jamun")) && (
                        <div className="p-3 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 rounded-xl flex items-center gap-2 mt-3">
                          <span className="text-base">🎉</span>
                          <p className="text-xs font-bold text-amber-900">Combo unlocked! Raita & Sweet upgraded for just ₹99 total.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Sticky Footer */}
                <div className="p-4 bg-muted/30 border-t border-border/70 space-y-2">
                  {showSabji ? (
                    <motion.button
                      onClick={handleSabjiContinue}
                      disabled={selectedSabjis.length !== 2}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full font-subheading font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all ${
                        selectedSabjis.length === 2 ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer' : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      {extras && extras.length > 0 ? "Next: Choose Add-ons →" : "Add to Cart"}
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        onClick={handleExtrasFinish}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-subheading font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        Add to Order · ₹{
                          effectiveBasePrice === 79 && 
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
                          : effectiveBasePrice + selectedExtras.reduce((s, e) => s + e.price, 0)
                        }
                      </motion.button>
                      <button
                        type="button"
                        onClick={handleSkipExtras}
                        className="w-full text-center text-xs font-subheading font-medium text-muted-foreground hover:text-foreground py-1.5 transition-colors"
                      >
                        Skip add-ons & add basic thali (₹{effectiveBasePrice})
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
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
                : "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg"
          }`}
        >
          <AnimatePresence mode="wait">
            {disabled ? (
              <motion.span key="coming" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                {disabledText || "Sold Out"}
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

