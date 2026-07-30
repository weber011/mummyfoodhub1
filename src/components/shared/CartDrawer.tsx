"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import { X, Minus, Plus, ShoppingBag, Trash2, MapPin, ChevronDown, CheckCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSiteData } from "@/context/SiteContext";

// Sector → base delivery charge mapping
const SECTOR_CHARGES: Record<string, number> = {
  "106": 5,
  "104": 7,
  "107": 7,
  "108": 10,
  "82":  10,
  "93":  10,
  "133": 10,
  "101": 12,
  "135": 15,
};

const SECTOR_OPTIONS = [
  { value: "106", label: "Sector 106", charge: 5 },
  { value: "104", label: "Sector 104", charge: 7 },
  { value: "107", label: "Sector 107", charge: 7 },
  { value: "108", label: "Sector 108", charge: 10 },
  { value: "82",  label: "Sector 82",  charge: 10 },
  { value: "93",  label: "Sector 93",  charge: 10 },
  { value: "133", label: "Sector 133", charge: 10 },
  { value: "101", label: "Sector 101", charge: 12 },
  { value: "135", label: "Sector 135", charge: 15 },
];

export function CartDrawer() {
  const { siteData } = useSiteData();
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
  const [step, setStep] = useState<"cart" | "form">("cart");
  const [form, setForm] = useState({
    name: "", phone: "", sector: "106", address: "", floor: "", landmark: "",
    deliveryType: "Office Gate", time: "Lunch (12:30 - 2 PM)", payment: "Cash on Delivery",
    notes: "", isBulkOrder: false,
    customFields: {} as Record<string, string>
  });

  // Sector-based delivery charge lookup
  const sectorBaseCharge = SECTOR_CHARGES[form.sector] ?? 10;
  const perPlateCharge = sectorBaseCharge + (form.deliveryType === "Doorstep (+₹10/item)" ? 10 : 0);
  const deliveryBase = perPlateCharge * (totalItems > 0 ? totalItems : 1);

  let discountRatio = 0;
  let discountMsg = "";
  if (totalPrice >= 400) {
    discountRatio = 1;
    discountMsg = "🚀 You unlocked FREE delivery!";
  } else if (totalPrice >= 200) {
    discountRatio = 0.5;
    discountMsg = "🎉 Wow! You get 50% off on delivery!";
  }

  const finalDeliveryCharge = Math.floor(deliveryBase * (1 - discountRatio));
  const finalTotal = totalPrice + finalDeliveryCharge;

  const handleOrder = () => {
    const itemLines = cart.map((i) => `  • ${i.quantity}x ${i.title}${i.extras && i.extras.length > 0 ? ` (+ ${i.extras.map(e => e.name).join(', ')})` : ''} — ₹${(i.price + (i.extras?.reduce((s, e) => s + e.price, 0) || 0)) * i.quantity}`).join("\n");
    const sectorLabel = SECTOR_OPTIONS.find(s => s.value === form.sector)?.label ?? `Sector ${form.sector}`;
    const deliveryTypeLabel = form.deliveryType;
    const addressDetails = `${form.address}, ${sectorLabel}${form.deliveryType === "Doorstep (+₹10/item)" ? `, Floor/Flat: ${form.floor}` : ''}`;
    
    // Add custom fields to message
    const customFieldsText = Object.entries(form.customFields).filter(([_, v]) => v).map(([k, v]) => `\n🔹 *${k}:* ${v}`).join('');

    const msg = `🍱 *New Order - Mummy Food Hub*\n${form.isBulkOrder ? '\n📦 *BULK ORDER*' : ''}\n\n👤 *Name:* ${form.name}\n📞 *Phone:* ${form.phone}\n📍 *Deliver To:* ${deliveryTypeLabel}\n🏠 *Address:* ${addressDetails}\n🏢 *Landmark:* ${form.landmark}\n⏰ *Delivery Time:* ${form.time}\n💳 *Payment:* ${form.payment}${customFieldsText}\n\n🛒 *Items:*\n${itemLines}\n\n🚚 *Delivery Charge:* ₹${finalDeliveryCharge}\n💰 *Total to Pay:* ₹${finalTotal}\n\n📝 *Notes:* ${form.notes || "None"}`;
    const url = `https://wa.me/${siteData.settings?.whatsapp || "917065665988"}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    clearCart();
    setIsCartOpen(false);
    setStep("cart");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setIsCartOpen(false); setStep("cart"); }}
            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-primary text-white">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6" />
                <h2 className="font-heading font-bold text-xl">
                  {step === "cart" ? `Your Order (${totalItems})` : "Confirm & Send"}
                </h2>
              </div>
              <button onClick={() => { setIsCartOpen(false); setStep("cart"); }} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {step === "cart" ? (
              <>
                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20">
                      <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground font-subheading">Your order is empty</p>
                      <p className="text-sm text-muted-foreground/70">Add items from the menu to get started</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-muted/50 rounded-xl p-4 border border-border/50">
                        <div className="flex-1">
                          <p className="font-heading font-bold text-foreground text-sm">{item.title}</p>
                          <p className="text-primary font-bold text-sm">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold w-5 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                          <button onClick={() => removeFromCart(item.id)} className="ml-1 text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="font-bold text-foreground text-sm w-16 text-right">₹{item.price * item.quantity}</p>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="px-6 py-5 border-t border-border bg-muted/30">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-subheading text-muted-foreground">Total ({totalItems} items)</span>
                      <span className="text-2xl font-heading font-black text-primary">₹{totalPrice}</span>
                    </div>
                    {discountMsg ? (
                      <p className="text-xs text-[#25D366] font-bold mb-4">{discountMsg}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mb-4">+ Delivery charge calculates at checkout</p>
                    )}
                    <button
                      onClick={() => setStep("form")}
                      className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:bg-primary/90 transition-all active:scale-95"
                    >
                      Proceed to Order →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Order Form */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {/* Order Summary Card */}
                  <div className="bg-primary/5 rounded-xl border border-primary/20 overflow-hidden">
                    <div className="px-4 pt-4 pb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Order Summary</p>
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm text-foreground/80 py-0.5">
                          <span>{item.quantity}x {item.title}</span>
                          <span className="font-bold">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    {/* Live Delivery Charge Row */}
                    <div className="mx-4 border-t border-primary/10 py-2 flex justify-between text-sm text-foreground/70">
                      <span>Delivery Charge</span>
                      <motion.span
                        key={finalDeliveryCharge}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-bold"
                      >
                        {discountRatio > 0 && (
                          <span className="line-through text-muted-foreground mr-1 text-xs">₹{deliveryBase}</span>
                        )}
                        ₹{finalDeliveryCharge}
                      </motion.span>
                    </div>
                    <div className="mx-4 border-t border-primary/20 py-2 flex justify-between text-sm font-bold text-primary">
                      <span>Total to Pay</span>
                      <motion.span
                        key={finalTotal}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        ₹{finalTotal}
                      </motion.span>
                    </div>
                    {discountMsg && (
                      <div className="bg-[#25D366]/10 text-[#25D366] px-4 py-2 text-xs font-bold text-center border-t border-[#25D366]/20">
                        {discountMsg}
                      </div>
                    )}
                  </div>

                  {/* Bulk Order Checkbox */}
                  <label className="flex items-center gap-2 p-3 bg-secondary/5 border border-secondary/20 rounded-lg cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.isBulkOrder}
                      onChange={(e) => setForm({...form, isBulkOrder: e.target.checked})}
                      className="w-4 h-4 text-secondary focus:ring-secondary rounded border-gray-300"
                    />
                    <span className="text-sm font-bold text-foreground">Is this a Bulk/Party Order?</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Your Name *", key: "name", type: "text", placeholder: "e.g. Rahul" },
                      { label: "Phone *", key: "phone", type: "tel", placeholder: "e.g. 9876543210" },
                    ].map(({ label, key, type, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 block">{label}</label>
                        <input
                          type={type}
                          placeholder={placeholder}
                          value={form[key as keyof typeof form] as string}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors font-subheading"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Sector Dropdown */}
                    <div>
                      <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 block">Sector *</label>
                      <div className="relative">
                        <select
                          value={form.sector}
                          onChange={(e) => setForm({ ...form, sector: e.target.value })}
                          className="w-full appearance-none border border-border rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-primary font-subheading bg-white transition-colors"
                        >
                          {SECTOR_OPTIONS.map(s => (
                            <option key={s.value} value={s.value}>
                              {s.label} — ₹{s.charge}/item
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-primary font-semibold mt-1 pl-0.5">
                        Base Delivery: ₹{SECTOR_CHARGES[form.sector] ?? 10}/item
                      </p>
                    </div>
                    {/* Deliver To */}
                    <div>
                      <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 block">Deliver To</label>
                      <div className="relative">
                        <select
                          value={form.deliveryType}
                          onChange={(e) => setForm({ ...form, deliveryType: e.target.value })}
                          className="w-full appearance-none border border-border rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-primary font-subheading bg-white transition-colors"
                        >
                          <option value="Office Gate">Office Gate</option>
                          <option value="Main Gate of House">Main Gate of House</option>
                          <option value="Doorstep (+₹10/item)">Doorstep (+₹10/item)</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {form.deliveryType === "Doorstep (+₹10/item)" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-1">
                          <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-primary" /> Floor & Tower / Flat No. *
                          </label>
                          <input
                            type="text"
                            placeholder="E.g., 3rd Floor, Flat 302"
                            value={form.floor}
                            onChange={(e) => setForm({ ...form, floor: e.target.value })}
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors font-subheading"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 block">Building / Society Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. ATS Village"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors font-subheading"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 block">Landmark</label>
                    <input
                      type="text"
                      placeholder="Near school, park, etc."
                      value={form.landmark}
                      onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors font-subheading"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 block">Delivery Time</label>
                    <select
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary font-subheading bg-white"
                    >
                      <option>Lunch (12:30 - 2 PM)</option>
                      <option>Dinner (8:00 - 9:30 PM)</option>
                      <option>Morning (9 - 10 AM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 block">Payment Mode</label>
                    <select
                      value={form.payment}
                      onChange={(e) => setForm({ ...form, payment: e.target.value })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary font-subheading bg-white"
                    >
                      <option>Cash on Delivery</option>
                      <option>Online Payment (UPI)</option>
                    </select>
                  </div>

                  <AnimatePresence>
                    {form.payment === "Online Payment (UPI)" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-primary/5 p-4 border border-primary/20 rounded-xl text-center space-y-4 shadow-sm mb-4">
                          <p className="text-sm font-bold text-foreground">Scan to Pay: <span className="text-primary text-lg">₹{finalTotal}</span></p>
                          <div className="bg-white p-3 inline-block rounded-xl shadow-sm border border-border">
                            <QRCode
                              value={`upi://pay?pa=${siteData.settings?.upiId || 'mummyfoodhubnoida@okicici'}&pn=Mummy%20Food%20Hub&am=${finalTotal}&cu=INR`}
                              size={150}
                            />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-subheading mb-2">After payment, enter your Transaction ID (UTR):</p>
                            <input
                              type="text"
                              placeholder="Enter 12-digit UTR No."
                              value={form.customFields["UTR Number"] || ""}
                              onChange={(e) => setForm({ ...form, customFields: { ...form.customFields, ["UTR Number"]: e.target.value } })}
                              className="w-full border border-primary/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors font-subheading text-center bg-white"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 block">Special Notes</label>
                    <textarea
                      placeholder="Any special instructions..."
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary font-subheading resize-none"
                    />
                  </div>
                  
                  {/* Custom Admin Fields */}
                  {siteData.orderForm?.fields?.filter(f => !['name', 'phone', 'address', 'instructions', 'mealType'].includes(f.id)).map((field: any) => (
                    <div key={field.id}>
                      <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 block">{field.label} {field.required && '*'}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          placeholder={field.placeholder}
                          value={form.customFields[field.label] || ""}
                          onChange={(e) => setForm({ ...form, customFields: { ...form.customFields, [field.label]: e.target.value } })}
                          className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary font-subheading resize-none"
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={form.customFields[field.label] || ""}
                          onChange={(e) => setForm({ ...form, customFields: { ...form.customFields, [field.label]: e.target.value } })}
                          className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary font-subheading bg-white"
                        >
                          <option value="">Select option</option>
                          {field.options?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={form.customFields[field.label] || ""}
                          onChange={(e) => setForm({ ...form, customFields: { ...form.customFields, [field.label]: e.target.value } })}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-subheading"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-6 py-5 border-t border-border space-y-3">
                  <button
                    onClick={handleOrder}
                    disabled={!form.name || !form.phone || !form.address}
                    className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:bg-[#20b858] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Send Order on WhatsApp
                  </button>
                  <button onClick={() => setStep("cart")} className="w-full text-sm text-muted-foreground hover:text-primary transition-colors">
                    ← Back to Cart
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
