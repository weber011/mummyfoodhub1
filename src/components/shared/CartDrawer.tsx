"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import { X, Minus, Plus, ShoppingBag, Trash2, MapPin, ChevronDown, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSiteData } from "@/context/SiteContext";
import { useAuth } from "@/context/AuthContext";
import { getDeliveryTimingState, validateOrderDeliveryTime, type TimingState } from "@/lib/delivery-timing";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function CartDrawer() {
  const { siteData } = useSiteData();
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState<"cart" | "form">("cart");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Real-time IST delivery timing state
  const [timingState, setTimingState] = useState<TimingState>(() => getDeliveryTimingState());

  // Track active subscription for 10% discount
  const [subscriptionDiscount, setSubscriptionDiscount] = useState<number>(0);
  const [hasSubscription, setHasSubscription] = useState(false);

  // Loyalty 5th meal reward state
  const [loyaltyAvailable, setLoyaltyAvailable] = useState(false);
  const [useLoyalty, setUseLoyalty] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "", phone: user?.phone || "", sector: "106", address: "", floor: "", landmark: "",
    deliveryType: "Office Gate", time: "Lunch (12:30 PM – 2:00 PM)", payment: "Cash on Delivery",
    notes: "", customFields: {} as Record<string, string>
  });

  const [distance, setDistance] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [isLocating, setIsLocating] = useState(false);

  // Live timer to update delivery time dynamically every 30 seconds
  useEffect(() => {
    const updateTiming = () => {
      const newState = getDeliveryTimingState();
      setTimingState(newState);
    };
    updateTiming();
    const interval = setInterval(updateTiming, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update default delivery slot selection based on live availability
  useEffect(() => {
    if (isCartOpen && timingState.defaultSlot) {
      const currentValidation = validateOrderDeliveryTime(form.time);
      if (!currentValidation.valid || !form.time) {
        setForm(f => ({ ...f, time: timingState.defaultSlot!.orderValue }));
      }
    }
  }, [isCartOpen, timingState]);

  // Fetch subscription status & loyalty reward to show discount in cart
  useEffect(() => {
    if (user && isCartOpen) {
      fetch("/api/account/subscription")
        .then(res => res.json())
        .then(data => {
          if (data.subscription && data.subscription.status === 'active') {
            setHasSubscription(true);
          }
        })
        .catch(() => {});

      fetch("/api/loyalty")
        .then(res => res.json())
        .then(data => {
          if (data.loyalty && data.loyalty.rewardAvailable && !data.loyalty.rewardRedeemed) {
            setLoyaltyAvailable(true);
            setUseLoyalty(true); // default to using reward if available
          } else {
            setLoyaltyAvailable(false);
            setUseLoyalty(false);
          }
        })
        .catch(() => {});
    }
  }, [user, isCartOpen]);

  useEffect(() => {
    if (step === "form" && distance === null && !locationError) {
      setIsLocating(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const dist = getDistance(28.5355, 77.3910, pos.coords.latitude, pos.coords.longitude);
            setDistance(dist);
            setIsLocating(false);
          },
          (err) => {
            setLocationError("Could not fetch location. Please select sector manually.");
            setIsLocating(false);
          }
        );
      } else {
        setLocationError("Geolocation not supported.");
        setIsLocating(false);
      }
    }
  }, [step, distance, locationError]);

  // Sector-based delivery charge lookup
  let sectorBaseCharge = SECTOR_CHARGES[form.sector] ?? 10;
  if (distance !== null) {
    if (distance <= 4) sectorBaseCharge = 5;
    else if (distance <= 7) sectorBaseCharge = 10;
    else if (distance <= 10) sectorBaseCharge = 15;
    else sectorBaseCharge = -1; // -1 indicates not deliverable
  }

  const isDeliverable = sectorBaseCharge !== -1;
  const perPlateCharge = isDeliverable ? sectorBaseCharge + (form.deliveryType === "Doorstep (+₹10/item)" ? 10 : 0) : 0;
  const deliveryBase = perPlateCharge * (totalItems > 0 ? totalItems : 1);

  let discountRatio = 0;
  let discountMsg = "";
  if (useLoyalty) {
    discountRatio = 1;
    discountMsg = "🎉 Loyalty 5th Meal Reward: FREE Delivery + 15% OFF!";
  } else if (totalPrice >= 400) {
    discountRatio = 1;
    discountMsg = "🚀 You unlocked FREE delivery!";
  } else if (totalPrice >= 200) {
    discountRatio = 0.5;
    discountMsg = "🎉 Wow! You get 50% off on delivery!";
  }

  const finalDeliveryCharge = useLoyalty ? 0 : Math.floor(deliveryBase * (1 - discountRatio));
  
  // Calculate subscription discount dynamically
  const calcSubDiscount = hasSubscription ? Math.floor(totalPrice * 0.1) : 0;
  
  // Calculate loyalty 15% discount
  const calcLoyaltyDiscount = useLoyalty ? Math.round(totalPrice * 0.15) : 0;
  
  const finalTotal = Math.max(0, totalPrice + finalDeliveryCharge - (appliedCoupon?.discount || 0) - calcSubDiscount - calcLoyaltyDiscount);

  const applyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal: totalPrice }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({ code: couponCode, discount: data.discount });
        toast.success(data.message || "Coupon applied!");
      } else {
        toast.error(data.reason || "Invalid coupon code");
        setAppliedCoupon(null);
      }
    } catch (e) {
      toast.error("Failed to validate coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleOrder = async () => {
    if (!user) {
      toast.error("Please login to place an order");
      return;
    }

    setIsSubmitting(true);
    const idempotencyKey = crypto.randomUUID();

    try {
      const addressDetails = form.deliveryType === "Doorstep (+₹10/item)" && form.floor 
        ? `${form.address}, ${form.floor}` 
        : form.address;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          subtotal: totalPrice,
          deliveryCharge: finalDeliveryCharge,
          discount: appliedCoupon?.discount || 0,
          couponCode: appliedCoupon?.code,
          totalAmount: finalTotal,
          customerName: form.name,
          customerPhone: form.phone,
          sector: form.sector,
          address: addressDetails,
          landmark: form.landmark,
          deliveryType: form.deliveryType,
          deliveryTime: form.time,
          paymentMethod: form.payment,
          notes: form.notes,
          useLoyaltyReward: useLoyalty,
          customFields: form.customFields,
          idempotencyKey
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      clearCart();
      setIsCartOpen(false);
      setStep("cart");
      
      // Redirect to success page
      router.push(`/orders/${data.orderId}`);
      
    } catch (e: any) {
      toast.error(e.message || "An error occurred while placing order");
    } finally {
      setIsSubmitting(false);
    }
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
                  {step === "cart" ? `Your Order (${totalItems})` : "Checkout"}
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
                    cart.map((item) => {
                      const extrasTotal = item.extras?.reduce((sum, ex) => sum + ex.price, 0) || 0;
                      const itemTotal = (item.price + extrasTotal) * item.quantity;
                      return (
                      <div key={item.id} className="flex flex-col gap-2 bg-muted/50 rounded-xl p-4 border border-border/50">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="font-heading font-bold text-foreground text-sm">{item.title}</p>
                            <p className="text-primary font-bold text-sm">₹{item.price + extrasTotal} each</p>
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
                          <p className="font-bold text-foreground text-sm w-16 text-right">₹{itemTotal}</p>
                        </div>
                        {item.extras && item.extras.length > 0 && (
                          <div className="pl-2 border-l-2 border-primary/20 flex flex-col gap-1 mt-1">
                            {item.extras.map((ex, idx) => (
                              <div key={idx} className="flex justify-between text-xs text-muted-foreground">
                                <span>+ {ex.name}</span>
                                {ex.price > 0 && <span>₹{ex.price * item.quantity}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )})
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

                    {/* Delivery Timing Indicator */}
                    {!timingState.isAnyOrderingOpen ? (
                      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 mb-4 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Ordering Closed for Today</p>
                          <p className="text-[11px] text-amber-800 mt-0.5">Lunch orders are accepted until 2:00 PM, Dinner orders until 9:30 PM.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-primary/5 border border-primary/20 text-foreground rounded-xl p-3 mb-4 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-bold text-xs">
                            {timingState.lunch.isAvailable ? "☀️ Lunch Open" : "🌙 Dinner Open"}
                          </span>
                        </div>
                        <span className="text-primary font-bold text-[11px]">
                          Delivery: {timingState.lunch.isAvailable ? timingState.lunch.expectedDelivery : timingState.dinner.expectedDelivery}
                        </span>
                      </div>
                    )}
                    
                    {!user ? (
                      <div className="space-y-3">
                        <p className="text-sm font-bold text-red-500 bg-red-50 p-2 rounded text-center border border-red-100">Please login or create an account to place your order.</p>
                        <div className="flex gap-2">
                          <button onClick={() => { setIsCartOpen(false); router.push("/login"); }} className="flex-1 bg-primary text-white font-bold py-3 rounded-xl shadow hover:bg-primary/90">Login</button>
                          <button onClick={() => { setIsCartOpen(false); router.push("/login?signup=1"); }} className="flex-1 bg-white border-2 border-primary text-primary font-bold py-3 rounded-xl hover:bg-primary/5">Create Account</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setStep("form")}
                        disabled={totalPrice < 79 || !timingState.isAnyOrderingOpen}
                        className={`w-full font-bold py-4 rounded-xl text-lg transition-all ${
                          totalPrice < 79 || !timingState.isAnyOrderingOpen
                            ? "bg-muted text-muted-foreground cursor-not-allowed border border-border" 
                            : "bg-primary text-white shadow-lg hover:bg-primary/90 active:scale-95"
                        }`}
                      >
                        {!timingState.isAnyOrderingOpen
                          ? "Ordering Closed for Today"
                          : totalPrice < 79 
                            ? "Minimum Order: ₹79" 
                            : "Proceed to Checkout →"}
                      </button>
                    )}
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
                      {cart.map((item) => {
                        const extrasTotal = item.extras?.reduce((sum, ex) => sum + ex.price, 0) || 0;
                        const itemTotal = (item.price + extrasTotal) * item.quantity;
                        return (
                          <div key={item.id} className="flex flex-col py-1 border-b border-primary/5 last:border-0">
                            <div className="flex justify-between text-sm text-foreground/80">
                              <span>{item.quantity}x {item.title}</span>
                              <span className="font-bold">₹{itemTotal}</span>
                            </div>
                            {item.extras && item.extras.length > 0 && (
                              <div className="pl-4 text-xs text-muted-foreground flex flex-col gap-0.5 mt-0.5">
                                {item.extras.filter(ex => ex.price > 0).map((ex, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>+ {ex.name}</span>
                                    <span>₹{ex.price * item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
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

                    {/* Subscription Discount */}
                    {hasSubscription && (
                      <div className="mx-4 border-t border-primary/10 py-2 flex justify-between text-sm font-bold text-[#647545]">
                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Sub. Discount (10%)</span>
                        <span>-₹{calcSubDiscount}</span>
                      </div>
                    )}

                    {/* Loyalty 5th Meal Reward */}
                    {loyaltyAvailable && (
                      <div className="mx-4 border-t border-primary/10 py-2.5">
                        <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-amber-50 border border-amber-200">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={useLoyalty}
                              onChange={(e) => setUseLoyalty(e.target.checked)}
                              className="w-4 h-4 rounded text-primary focus:ring-primary"
                            />
                            <span className="text-xs font-bold text-amber-900">
                              🎉 5th Meal Reward (15% OFF + Free Delivery)
                            </span>
                          </div>
                          {useLoyalty && (
                            <span className="text-xs font-black text-amber-900">-₹{calcLoyaltyDiscount}</span>
                          )}
                        </label>
                      </div>
                    )}

                    {/* Coupon Input Area */}
                    <div className="mx-4 border-t border-primary/10 py-3">
                      {appliedCoupon ? (
                        <div className="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          <span className="text-sm font-bold text-green-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> {appliedCoupon.code} applied!
                          </span>
                          <button onClick={() => setAppliedCoupon(null)} className="text-xs text-red-500 font-bold hover:underline">Remove</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Have a coupon?"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm uppercase focus:border-primary focus:outline-none bg-white"
                            disabled={validatingCoupon}
                          />
                          <button
                            onClick={applyCoupon}
                            disabled={!couponCode || validatingCoupon}
                            className="bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-lg text-sm disabled:opacity-50 hover:bg-primary hover:text-white transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </div>

                    {appliedCoupon && (
                      <div className="mx-4 border-t border-primary/10 py-2 flex justify-between text-sm font-bold text-green-600">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span>-₹{appliedCoupon.discount}</span>
                      </div>
                    )}

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

                  <div className="grid grid-cols-2 gap-3 pt-2">
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
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors font-subheading bg-white"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Sector Dropdown */}
                    <div>
                      <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 block">Location *</label>
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
                      {locationError ? (
                        <p className="text-[10px] text-red-500 mt-1">{locationError}</p>
                      ) : isLocating ? (
                        <p className="text-[10px] text-muted-foreground mt-1">Locating...</p>
                      ) : null}
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
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors font-subheading bg-white"
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
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors font-subheading bg-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 block">Landmark</label>
                    <input
                      type="text"
                      placeholder="Near school, park, etc."
                      value={form.landmark}
                      onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors font-subheading bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-primary" /> Delivery Time *
                      </label>
                      <span className="text-[10px] text-muted-foreground font-subheading">Current: {timingState.currentIstTime}</span>
                    </div>
                    
                    <div className="relative">
                      <select
                        value={form.time}
                        onChange={(e) => setForm({ ...form, time: e.target.value })}
                        className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary font-subheading bg-white appearance-none"
                      >
                        <option value={timingState.lunch.orderValue} disabled={!timingState.lunch.isAvailable}>
                          ☀️ Lunch ({timingState.lunch.isAvailable ? timingState.lunch.expectedDelivery : "Closed at 2:00 PM"})
                        </option>
                        <option value={timingState.dinner.orderValue} disabled={!timingState.dinner.isAvailable}>
                          🌙 Dinner ({timingState.dinner.isAvailable ? timingState.dinner.expectedDelivery : "Closed at 9:30 PM"})
                        </option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>

                    {/* Dynamic Availability / Warning Notice */}
                    {(() => {
                      const validation = validateOrderDeliveryTime(form.time);
                      if (!validation.valid) {
                        return (
                          <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2.5 text-xs flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="font-bold">{validation.reason}</span>
                          </div>
                        );
                      }
                      const isLunchSelected = form.time.toLowerCase().includes("lunch");
                      const expectedDel = isLunchSelected ? timingState.lunch.expectedDelivery : timingState.dinner.expectedDelivery;
                      return (
                        <div className="mt-2 text-[11px] text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                          <span>⚡ Expected Delivery:</span>
                          <span className="text-emerald-950 font-black">{expectedDel}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 block">Payment Mode</label>
                    <div className="relative">
                      <select
                        value={form.payment}
                        onChange={(e) => setForm({ ...form, payment: e.target.value })}
                        className="w-full border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary font-subheading bg-white appearance-none"
                      >
                        <option>Cash on Delivery</option>
                        <option>Online Payment (UPI)</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <AnimatePresence>
                    {form.payment === "Online Payment (UPI)" && (
                      <motion.div
                        key="qr-section"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-primary/5 p-4 border border-primary/20 rounded-xl text-center space-y-4 shadow-sm mb-4 mt-2">
                          <p className="text-sm font-bold text-foreground">Scan to Pay: <span className="text-primary text-lg">₹{finalTotal}</span></p>
                          <div className="bg-white p-3 inline-block rounded-xl shadow-sm border border-border">
                            <QRCode
                              value={`upi://pay?pa=${siteData.settings?.upiId || 'anmol.srivastava01@kotak'}&pn=ANMOL%20RANJAN%20SRIVASTAVA&am=${finalTotal}&cu=INR`}
                              size={150}
                            />
                          </div>
                          
                          <div className="pt-2">
                            <p className="text-xs text-muted-foreground font-subheading mb-2">Or tap to pay via app (Mobile only):</p>
                            <div className="flex flex-wrap justify-center gap-2 mb-2">
                              <a href={`gpay://upi/pay?pa=${siteData.settings?.upiId || 'anmol.srivastava01@kotak'}&pn=ANMOL%20RANJAN%20SRIVASTAVA&am=${finalTotal}&cu=INR`} className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-border rounded-lg text-xs font-bold text-gray-700 shadow-sm transition-colors">
                                GPay
                              </a>
                              <a href={`phonepe://pay?pa=${siteData.settings?.upiId || 'anmol.srivastava01@kotak'}&pn=ANMOL%20RANJAN%20SRIVASTAVA&am=${finalTotal}&cu=INR`} className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-border rounded-lg text-xs font-bold text-gray-700 shadow-sm transition-colors">
                                PhonePe
                              </a>
                              <a href={`paytmmp://pay?pa=${siteData.settings?.upiId || 'anmol.srivastava01@kotak'}&pn=ANMOL%20RANJAN%20SRIVASTAVA&am=${finalTotal}&cu=INR`} className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-border rounded-lg text-xs font-bold text-gray-700 shadow-sm transition-colors">
                                Paytm
                              </a>
                            </div>
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
                      className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary font-subheading resize-none bg-white"
                    />
                  </div>

                  {/* Custom Admin Fields */}
                  {siteData.orderForm?.fields?.filter((f: any) => !['name', 'phone', 'address', 'instructions', 'mealType'].includes(f.id)).map((field: any) => (
                    <div key={field.id}>
                      <label className="text-xs font-bold text-foreground uppercase tracking-wide mb-1 block">{field.label} {field.required && '*'}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          placeholder={field.placeholder}
                          value={form.customFields[field.label] || ""}
                          onChange={(e) => setForm({ ...form, customFields: { ...form.customFields, [field.label]: e.target.value } })}
                          className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary font-subheading resize-none bg-white"
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
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-subheading bg-white"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-6 py-5 border-t border-border space-y-3 bg-white">
                  {!isDeliverable && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm font-bold border border-red-200">
                      Sorry, delivery is not available for locations beyond 10 km.
                    </div>
                  )}
                  {(() => {
                    const validation = validateOrderDeliveryTime(form.time);
                    const isTimeAllowed = validation.valid && timingState.isAnyOrderingOpen;

                    return (
                      <button
                        onClick={handleOrder}
                        disabled={!form.name || !form.phone || !form.address || !isDeliverable || isSubmitting || !isTimeAllowed}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">Processing...</span>
                        ) : !isTimeAllowed ? (
                          <span className="flex items-center gap-2 text-base">
                            <AlertTriangle className="w-5 h-5" />
                            {validation.reason ? "Selected Slot Closed" : "Ordering Closed"}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5" />
                            Place Order (₹{finalTotal})
                          </span>
                        )}
                      </button>
                    );
                  })()}
                  <button onClick={() => setStep("cart")} className="w-full text-sm text-muted-foreground hover:text-primary transition-colors" disabled={isSubmitting}>
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
