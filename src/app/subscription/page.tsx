"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import {
  CheckCircle, Info, Loader2, X, Phone, MapPin,
  ChevronDown, ArrowLeft, ArrowRight, Clock, Send,
  Headphones, MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { useSiteData } from "@/context/SiteContext";
import { useAuth } from "@/context/AuthContext";

const SECTOR_OPTIONS = [
  { value: "106", label: "Sector 106" },
  { value: "104", label: "Sector 104" },
  { value: "107", label: "Sector 107" },
  { value: "108", label: "Sector 108" },
  { value: "82",  label: "Sector 82" },
  { value: "93",  label: "Sector 93" },
  { value: "133", label: "Sector 133" },
  { value: "101", label: "Sector 101" },
  { value: "135", label: "Sector 135" },
];

const DEFAULT_PLANS = [
  {
    id: "plan-lunch",
    name: "Lunch Plan",
    price: 2099,
    duration: "56 Days (26 Meals)",
    features: [
      "26 Fresh Homemade Lunches",
      "56 Days Extended Validity",
      "Skip before 4:00 AM IST",
      "Shift skipped lunch to dinner anytime",
      "Free Delivery within 4 KM",
    ],
    recommended: false,
    savings: "₹400",
  },
  {
    id: "plan-dinner",
    name: "Dinner Plan",
    price: 2500,
    duration: "60 Days (30 Meals)",
    features: [
      "30 Hot Homemade Dinners",
      "60 Days Extended Validity",
      "Skip before 3:00 PM IST",
      "Shift skipped dinner to lunch anytime",
      "Free Delivery within 4 KM",
    ],
    recommended: false,
    savings: "₹500",
  },
  {
    id: "plan-lunch-dinner",
    name: "Lunch and Dinner Plan",
    price: 4399,
    duration: "60 Days (56 Meals)",
    features: [
      "26 Lunches + 30 Dinners (56 Meals)",
      "60 Days Extended Validity",
      "Skip & shift lunch & dinner independently",
      "Priority On-Time Delivery",
      "Save over 20% on daily meal orders",
    ],
    recommended: false,
    savings: "₹1,000",
  },
  {
    id: "plan-complete",
    name: "Complete Plan",
    price: 5999,
    duration: "60 Days (82 Meals)",
    features: [
      "All 3 Meals Included (Breakfast + Lunch + Dinner)",
      "26 Breakfasts + 26 Lunches + 30 Dinners (82 Meals)",
      "Breakfast Automatically Included",
      "60 Days Extended Validity",
      "Skip & shift individual meals independently",
      "VIP Priority Support & Delivery",
    ],
    recommended: true,
    savings: "₹1,800",
  },
];

export default function SubscriptionPage() {
  const { siteData } = useSiteData();
  const { user } = useAuth();
  const plans = DEFAULT_PLANS;

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [addBreakfast, setAddBreakfast] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    sector: "106",
    landmark: "",
    deliveryType: "Office Gate",
    deliveryTime: "Lunch (12:30 - 2 PM)",
    notes: "",
    utr: "",
  });

  const [separateAddresses, setSeparateAddresses] = useState(false);
  const [breakfastForm, setBreakfastForm] = useState({
    address: "",
    sector: "106",
    landmark: "",
    deliveryType: "Doorstep",
    deliveryTime: "Morning (9:00 - 10:00 AM)",
    notes: "",
  });
  const [lunchForm, setLunchForm] = useState({
    address: "",
    sector: "106",
    landmark: "",
    deliveryType: "Office Gate",
    deliveryTime: "Lunch (12:30 - 2:00 PM)",
    notes: "",
  });
  const [dinnerForm, setDinnerForm] = useState({
    address: "",
    sector: "106",
    landmark: "",
    deliveryType: "Doorstep",
    deliveryTime: "Dinner (8:00 - 9:30 PM)",
    notes: "",
  });

  // Pre-fill from user when modal opens
  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, name: user.name || f.name, phone: user.phone || f.phone }));
    }
  }, [user]);

  const openPlan = (plan: any) => {
    setSelectedPlan(plan);
    setAddBreakfast(false);
    setSeparateAddresses(false);
    setStep(1);
    setError("");
  };

  const closeModal = () => {
    setSelectedPlan(null);
    setAddBreakfast(false);
    setSeparateAddresses(false);
    setStep(1);
    setError("");
  };

  const isCompletePlan = selectedPlan?.id === "plan-complete" || selectedPlan?.name?.toLowerCase().includes("complete") || selectedPlan?.price === 5999;
  const isLunchAndDinnerPlan = selectedPlan?.id === "plan-lunch-dinner" || selectedPlan?.name?.toLowerCase().includes("lunch and dinner");
  const isDinnerOnly = selectedPlan?.id === "plan-dinner" || (selectedPlan?.name?.toLowerCase().includes("dinner") && !isLunchAndDinnerPlan);
  const isLunchOnly = selectedPlan?.id === "plan-lunch" || (selectedPlan?.name?.toLowerCase().includes("lunch") && !isLunchAndDinnerPlan);

  const hasBreakfast = isCompletePlan || addBreakfast;
  const hasLunch = isCompletePlan || isLunchAndDinnerPlan || isLunchOnly;
  const hasDinner = isCompletePlan || isLunchAndDinnerPlan || isDinnerOnly;
  const isMultiMealPlan = (hasBreakfast && (hasLunch || hasDinner)) || (hasLunch && hasDinner);

  const validateStep1 = () => {
    if (!form.name.trim()) return "Please enter your name.";
    if (!form.phone.replace(/\D/g, "").length || form.phone.replace(/\D/g, "").length < 10) return "Please enter a valid 10-digit phone number.";
    if (!separateAddresses) {
      if (!form.address.trim()) return "Please enter your building / society name.";
    } else {
      if (hasBreakfast && !breakfastForm.address.trim()) return "Please enter your Breakfast delivery address.";
      if (hasLunch && !lunchForm.address.trim()) return "Please enter your Lunch delivery address.";
      if (hasDinner && !dinnerForm.address.trim()) return "Please enter your Dinner delivery address.";
    }
    return "";
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  };

  const currentPrice = isCompletePlan ? (selectedPlan?.price || 5999) : (selectedPlan?.price || 0) + (addBreakfast ? 1620 : 0);
  const currentPlanName = isCompletePlan ? selectedPlan?.name : addBreakfast ? `${selectedPlan?.name} + Breakfast` : selectedPlan?.name;

  const handleSubmit = async () => {
    if (!user) { window.location.href = "/login"; return; }
    if (!form.utr.trim()) { setError("Please enter your UPI Transaction ID (UTR) to confirm payment."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: currentPlanName,
          planPrice: currentPrice,
          hasBreakfastAddon: addBreakfast,
          separateAddresses,
          breakfastDelivery: hasBreakfast && separateAddresses ? breakfastForm : undefined,
          lunchDelivery: hasLunch && separateAddresses ? lunchForm : undefined,
          dinnerDelivery: hasDinner && separateAddresses ? dinnerForm : undefined,
          ...form,
          // If separate addresses, primary address defaults to lunch or dinner address
          address: separateAddresses
            ? (hasLunch ? lunchForm.address : hasDinner ? dinnerForm.address : breakfastForm.address)
            : form.address,
          sector: separateAddresses
            ? (hasLunch ? lunchForm.sector : hasDinner ? dinnerForm.sector : breakfastForm.sector)
            : form.sector,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const upiId = siteData.settings?.upiId || "anmol.srivastava01@kotak";
  const upiAmount = currentPrice;
  const upiUrl = `upi://pay?pa=${upiId}&pn=MUMMY%20FOOD%20HUB&am=${upiAmount}&cu=INR`;

  return (
    <div className="pt-20 pb-20 bg-background min-h-screen">
      <div className="bg-primary/10 py-16 text-center border-b border-border">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">Monthly Subscription</h1>
        <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-4" />
        <p className="text-muted-foreground font-subheading text-lg max-w-xl mx-auto px-4">
          Subscribe once, eat healthy every day. Say goodbye to the daily hassle of ordering food.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20 items-center">
          {plans.map((plan: any, idx: number) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`relative bg-white rounded-2xl p-8 border ${
                plan.recommended
                  ? "border-primary shadow-2xl scale-100 md:scale-105 z-10"
                  : "border-border shadow-lg"
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  Best Value
                </div>
              )}
              {plan.savings && (
                <div className="absolute top-4 right-4 bg-secondary text-white px-3 py-1 rounded-full text-xs font-bold">
                  Save {plan.savings}
                </div>
              )}
              <h3 className="text-xl font-heading font-bold text-foreground mb-2 text-center">{plan.name}</h3>
              <div className="text-center mb-6">
                <span className="text-4xl font-heading font-black text-primary">₹{plan.price}</span>
                <span className="text-muted-foreground text-sm">/{plan.duration}</span>
              </div>
              <div className="w-full h-px bg-border mb-6" />
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 font-subheading">
                    <CheckCircle className="w-5 h-5 text-secondary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openPlan(plan)}
                className={`w-full block text-center font-bold py-3 rounded-lg transition-colors ${
                  plan.recommended
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                }`}
              >
                Subscribe Now
              </button>
            </motion.div>
          ))}
        </div>

        {/* Benefits */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-3">Why Subscribe?</h2>
            <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "🍛", text: "Fresh, hygienic home-cooked meals every day" },
              { icon: "🫓", text: "Twice a week, you'll receive extra rotis, or raita once a week." },
              { icon: "🥗", text: "Daily changing menu (no repetition)" },
              { icon: "🚚", text: "Reliable service for office & home" },
              { icon: "💰", text: "Save up to 10–20% compared to daily orders" },
              { icon: "⏰", text: "On-time delivery for lunch and dinner" },
              { icon: "📅", text: "No need to order every day – automatic meal delivery" },
              { icon: "❤️", text: "Homemade taste just like your mother's cooking" },
              { icon: "🔄", text: "Flexible – pause or resume your subscription anytime" },
            ].map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 bg-white border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              >
                <span className="text-2xl shrink-0">{benefit.icon}</span>
                <p className="text-sm font-subheading text-foreground/80 leading-relaxed">{benefit.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* T&C */}
        <div className="max-w-4xl mx-auto bg-muted p-8 rounded-2xl border border-border mb-16">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-primary shrink-0 mt-1" />
            <div>
              <h4 className="text-xl font-heading font-bold text-foreground mb-2">Delivery Policy & Terms (T&C)</h4>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm font-subheading">
                <li><strong className="text-foreground">Meal Skip Cutoffs:</strong> Lunch skip requests must be placed before <strong className="text-primary">4:00 AM IST</strong>. Dinner skip requests must be placed before <strong className="text-primary">3:00 PM IST</strong>.</li>
                <li><strong className="text-foreground">Unused Meals Carry Forward:</strong> Skipped meals are NEVER deducted from your total balance. You can consume your meals anytime within your subscription validity (56–60 days).</li>
                <li><strong className="text-foreground">Meal Shifting:</strong> You can transfer a skipped Lunch meal to Dinner, or a skipped Dinner meal to Lunch right from your dashboard.</li>
                <li><strong className="text-foreground">Breakfast:</strong> Available as an exclusive add-on with 26 meals (56 days validity) attached to your Lunch, Dinner, or Complete plan.</li>
                <li>Delivery is free within 4 KM radius of Sector 110, Noida. Nominal charges apply up to 10 KM.</li>
                <li>Subscription amount is payable in advance via UPI / Bank Transfer / Cash.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Need Help / Have Doubts Support Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border-2 border-primary/30 p-8 shadow-lg mb-12 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Headphones className="w-4 h-4" /> Subscription Support
              </div>
              <h3 className="text-2xl font-heading font-black text-foreground">
                Have Doubts or Questions Before Subscribing?
              </h3>
              <p className="text-muted-foreground font-subheading text-sm max-w-xl">
                Need a trial meal, custom delivery timing, offline cash payment, or have queries about pausing meals? Speak directly with our owner or reach us on WhatsApp.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
              <a
                href="tel:+917065665988"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border-2 border-primary text-primary hover:bg-primary/5 font-bold py-3 px-5 rounded-2xl shadow-xs transition-all text-sm"
              >
                <Phone className="w-4 h-4" /> Call: +91 70656 65988
              </a>

              <a
                href="https://wa.me/917065665988?text=Hello%20Mummy%20Food%20Hub!%20I%20have%20a%20question%20regarding%20the%20monthly%20meal%20subscription."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white font-bold py-3 px-6 rounded-2xl shadow-md transition-all text-sm"
              >
                <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Bulk Orders */}
        <div className="mt-4 bg-primary/10 rounded-2xl border border-primary/20 p-8 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-foreground mb-4">Planning a Party or Corporate Event?</h2>
          <p className="text-muted-foreground font-subheading mb-6 max-w-2xl mx-auto">
            We accept bulk orders for parties, office lunches, and special occasions. Contact us to discuss.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-primary/90 transition-colors"
          >
            Contact Us for Bulk Orders
          </Link>
        </div>
      </div>

      {/* ── Subscription Modal ── */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-white z-10 rounded-t-3xl">
                {step > 1 && step < 3 ? (
                  <button onClick={() => { setStep(s => (s - 1) as 1 | 2 | 3); setError(""); }} className="p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                  </button>
                ) : <div className="w-9" />}
                <div className="text-center">
                  <h2 className="text-xl font-heading font-black text-foreground">
                    {step === 3 ? "Request Sent!" : "Subscribe"}
                  </h2>
                  {step < 3 && (
                    <p className="text-xs text-muted-foreground mt-0.5">Step {step} of 2</p>
                  )}
                </div>
                <button onClick={closeModal} className="p-2 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 pb-6 pt-4">
                {/* Plan Summary */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground font-heading">{currentPlanName}</p>
                      <p className="text-xs text-muted-foreground">{selectedPlan.duration} Validity</p>
                    </div>
                    <p className="text-primary font-black text-2xl">
                      ₹{currentPrice}
                    </p>
                  </div>

                  {/* Breakfast Add-On Option or Included Badge */}
                  {isCompletePlan ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Breakfast Included (All 3 Meals)</span>
                      </p>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Breakfast (26 meals), Lunch (26 meals), and Dinner (30 meals) are automatically included.
                      </p>
                    </div>
                  ) : (
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-primary/20 cursor-pointer hover:bg-amber-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={addBreakfast}
                        onChange={e => setAddBreakfast(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          🥐 Add Breakfast (+26 Meals, 56 Days) <span className="text-primary font-black">+₹1,620</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Fresh morning homemade breakfast delivered to your doorstep.
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {!user ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-4">Please login first to subscribe.</p>
                    <Link href="/login" className="block w-full bg-primary text-white font-bold py-3 rounded-xl text-center hover:bg-primary/90 transition-colors">
                      Login to Continue
                    </Link>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {/* ── STEP 1: Delivery Details ── */}
                    {step === 1 && (
                      <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">Delivery Details</p>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-foreground mb-1">Your Name *</label>
                            <input
                              type="text"
                              value={form.name}
                              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                              placeholder="e.g. Rahul"
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-subheading"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-foreground mb-1">Phone *</label>
                            <div className="relative">
                              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                              <input
                                type="tel"
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="9876543210"
                                className="w-full pl-8 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary font-subheading"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Separate Addresses Toggle for Multi-Meal Plans */}
                        {isMultiMealPlan && (
                          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-1.5">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={separateAddresses}
                                onChange={e => setSeparateAddresses(e.target.checked)}
                                className="w-4 h-4 rounded text-primary focus:ring-primary"
                              />
                              <span className="text-xs font-bold text-amber-950">
                                📍 Deliver meals to different addresses (e.g., Office for Lunch, Home for Dinner)
                              </span>
                            </label>
                            <p className="text-[11px] text-amber-800/90 pl-6.5">
                              Check this if you want morning breakfast, lunch, or dinner delivered to separate locations.
                            </p>
                          </div>
                        )}

                        {!separateAddresses ? (
                          <>
                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1">Building / Society Name *</label>
                              <input
                                type="text"
                                value={form.address}
                                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                placeholder="e.g. ATS Village, Logix City"
                                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-subheading"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-foreground mb-1">Sector *</label>
                                <div className="relative">
                                  <select
                                    value={form.sector}
                                    onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-subheading appearance-none"
                                  >
                                    {SECTOR_OPTIONS.map(s => (
                                      <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-foreground mb-1">Landmark</label>
                                <div className="relative">
                                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                  <input
                                    type="text"
                                    value={form.landmark}
                                    onChange={e => setForm(f => ({ ...f, landmark: e.target.value }))}
                                    placeholder="Near park..."
                                    className="w-full pl-8 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary font-subheading"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-foreground mb-1">Deliver To</label>
                                <div className="relative">
                                  <select
                                    value={form.deliveryType}
                                    onChange={e => setForm(f => ({ ...f, deliveryType: e.target.value }))}
                                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-subheading appearance-none"
                                  >
                                    <option>Office Gate</option>
                                    <option>Main Gate of House</option>
                                    <option>Doorstep</option>
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-foreground mb-1">Delivery Time</label>
                                <div className="relative">
                                  <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                  <select
                                    value={form.deliveryTime}
                                    onChange={e => setForm(f => ({ ...f, deliveryTime: e.target.value }))}
                                    className="w-full pl-8 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary font-subheading appearance-none"
                                  >
                                    <option>Lunch (12:30 - 2 PM)</option>
                                    <option>Dinner (8:00 - 9:30 PM)</option>
                                    <option>Morning (9 - 10 AM)</option>
                                  </select>
                                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none hidden" />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1">Special Notes</label>
                              <textarea
                                rows={2}
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Any special instructions for delivery..."
                                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-subheading resize-none"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="space-y-4 pt-1">
                            {/* Breakfast Delivery Card */}
                            {hasBreakfast && (
                              <div className="border-2 border-orange-200/80 bg-orange-50/30 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-2 pb-1 border-b border-orange-200/60">
                                  <span className="text-base">🥐</span>
                                  <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider">Breakfast Delivery Address</h4>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-foreground mb-1">Building / Society / House *</label>
                                  <input
                                    type="text"
                                    value={breakfastForm.address}
                                    onChange={e => setBreakfastForm({ ...breakfastForm, address: e.target.value })}
                                    placeholder="e.g. Tower B, Flat 402, Prateek Edifice"
                                    className="w-full border border-border bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary font-subheading"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] font-bold text-foreground mb-1">Sector *</label>
                                    <select
                                      value={breakfastForm.sector}
                                      onChange={e => setBreakfastForm({ ...breakfastForm, sector: e.target.value })}
                                      className="w-full border border-border bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary font-subheading"
                                    >
                                      {SECTOR_OPTIONS.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-foreground mb-1">Deliver To</label>
                                    <select
                                      value={breakfastForm.deliveryType}
                                      onChange={e => setBreakfastForm({ ...breakfastForm, deliveryType: e.target.value })}
                                      className="w-full border border-border bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary font-subheading"
                                    >
                                      <option>Doorstep</option>
                                      <option>Main Gate of House</option>
                                      <option>Office Gate</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Lunch Delivery Card */}
                            {hasLunch && (
                              <div className="border-2 border-amber-200/80 bg-amber-50/30 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-2 pb-1 border-b border-amber-200/60">
                                  <span className="text-base">🍱</span>
                                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">Lunch Delivery Address</h4>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-foreground mb-1">Building / Office / Tower *</label>
                                  <input
                                    type="text"
                                    value={lunchForm.address}
                                    onChange={e => setLunchForm({ ...lunchForm, address: e.target.value })}
                                    placeholder="e.g. Candor TechSpace, Tower 4, Gate 2"
                                    className="w-full border border-border bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary font-subheading"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] font-bold text-foreground mb-1">Sector *</label>
                                    <select
                                      value={lunchForm.sector}
                                      onChange={e => setLunchForm({ ...lunchForm, sector: e.target.value })}
                                      className="w-full border border-border bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary font-subheading"
                                    >
                                      {SECTOR_OPTIONS.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-foreground mb-1">Deliver To</label>
                                    <select
                                      value={lunchForm.deliveryType}
                                      onChange={e => setLunchForm({ ...lunchForm, deliveryType: e.target.value })}
                                      className="w-full border border-border bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary font-subheading"
                                    >
                                      <option>Office Gate</option>
                                      <option>Main Gate of House</option>
                                      <option>Doorstep</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Dinner Delivery Card */}
                            {hasDinner && (
                              <div className="border-2 border-indigo-200/80 bg-indigo-50/30 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-2 pb-1 border-b border-indigo-200/60">
                                  <span className="text-base">🍽️</span>
                                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Dinner Delivery Address</h4>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-foreground mb-1">Building / Society / Flat *</label>
                                  <input
                                    type="text"
                                    value={dinnerForm.address}
                                    onChange={e => setDinnerForm({ ...dinnerForm, address: e.target.value })}
                                    placeholder="e.g. Ridge Residency, Flat 1507, Tower M"
                                    className="w-full border border-border bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary font-subheading"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] font-bold text-foreground mb-1">Sector *</label>
                                    <select
                                      value={dinnerForm.sector}
                                      onChange={e => setDinnerForm({ ...dinnerForm, sector: e.target.value })}
                                      className="w-full border border-border bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary font-subheading"
                                    >
                                      {SECTOR_OPTIONS.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold text-foreground mb-1">Deliver To</label>
                                    <select
                                      value={dinnerForm.deliveryType}
                                      onChange={e => setDinnerForm({ ...dinnerForm, deliveryType: e.target.value })}
                                      className="w-full border border-border bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary font-subheading"
                                    >
                                      <option>Doorstep</option>
                                      <option>Main Gate of House</option>
                                      <option>Office Gate</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-bold text-foreground mb-1">General Delivery Notes</label>
                              <textarea
                                rows={2}
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Any special notes or dietary preferences..."
                                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-subheading resize-none"
                              />
                            </div>
                          </div>
                        )}

                        {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg">{error}</p>}

                        <button
                          onClick={handleNext}
                          className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                          Proceed to Payment <ArrowRight className="w-4 h-4" />
                        </button>

                        <div className="pt-2 text-center">
                          <p className="text-[11px] text-muted-foreground font-subheading flex items-center justify-center gap-2">
                            <span>Have doubts?</span>
                            <a href="tel:+917065665988" className="font-bold text-primary hover:underline flex items-center gap-0.5">
                              <Phone className="w-3 h-3" /> Call Support
                            </a>
                            <span>•</span>
                            <a href="https://wa.me/917065665988" target="_blank" rel="noopener noreferrer" className="font-bold text-[#25D366] hover:underline flex items-center gap-0.5">
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* ── STEP 2: Payment ── */}
                    {step === 2 && (
                      <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">Payment</p>
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center space-y-3">
                          <p className="text-sm font-bold text-foreground">
                            Scan to Pay: <span className="text-primary text-xl">₹{selectedPlan.price}</span>
                          </p>
                          <div className="bg-white p-3 inline-block rounded-xl shadow-sm border border-border">
                            <QRCode value={upiUrl} size={150} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-subheading mb-2">Or tap to pay via app (Mobile only):</p>
                            <div className="flex flex-wrap justify-center gap-2">
                              <a href={`gpay://upi/pay?pa=${upiId}&pn=MUMMY%20FOOD%20HUB&am=${upiAmount}&cu=INR`}
                                className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-border rounded-lg text-xs font-bold text-gray-700 shadow-sm transition-colors">
                                GPay
                              </a>
                              <a href={`phonepe://pay?pa=${upiId}&pn=MUMMY%20FOOD%20HUB&am=${upiAmount}&cu=INR`}
                                className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-border rounded-lg text-xs font-bold text-gray-700 shadow-sm transition-colors">
                                PhonePe
                              </a>
                              <a href={`paytmmp://pay?pa=${upiId}&pn=MUMMY%20FOOD%20HUB&am=${upiAmount}&cu=INR`}
                                className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-border rounded-lg text-xs font-bold text-gray-700 shadow-sm transition-colors">
                                Paytm
                              </a>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1">
                            Transaction ID / UTR No. (after payment) *
                          </label>
                          <input
                            type="text"
                            value={form.utr}
                            onChange={e => setForm(f => ({ ...f, utr: e.target.value }))}
                            placeholder="Enter 12-digit UTR / Reference No."
                            className="w-full border border-primary/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors font-subheading text-center"
                          />
                          <p className="text-[11px] text-muted-foreground mt-1.5 font-subheading">
                            Found in your UPI app under payment history / transaction details.
                          </p>
                        </div>

                        {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg">{error}</p>}

                        <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                          {submitting ? "Submitting..." : "Submit Subscription Request"}
                        </button>

                        <div className="pt-1 text-center">
                          <p className="text-[11px] text-muted-foreground font-subheading flex items-center justify-center gap-2">
                            <span>Payment query?</span>
                            <a href="tel:+917065665988" className="font-bold text-primary hover:underline flex items-center gap-0.5">
                              <Phone className="w-3 h-3" /> +91 70656 65988
                            </a>
                            <span>•</span>
                            <a href="https://wa.me/917065665988" target="_blank" rel="noopener noreferrer" className="font-bold text-[#25D366] hover:underline flex items-center gap-0.5">
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {/* ── STEP 3: Success ── */}
                    {step === 3 && (
                      <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-5">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-heading font-black text-foreground mb-2">Request Submitted!</h3>
                          <p className="text-muted-foreground font-subheading text-sm leading-relaxed">
                            We have received your subscription request for <strong>{selectedPlan.name}</strong>.
                            Our team will verify your payment and{" "}
                            <strong className="text-primary">contact you soon</strong> to activate your plan.
                          </p>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-1.5 text-sm">
                          <p className="font-bold text-amber-800">What happens next?</p>
                          <p className="text-amber-700 font-subheading">1. We verify your UTR payment reference</p>
                          <p className="text-amber-700 font-subheading">2. Admin activates your plan (usually within 2–4 hrs)</p>
                          <p className="text-amber-700 font-subheading">3. You receive a confirmation email + your dashboard unlocks</p>
                        </div>
                        <a
                          href={`https://wa.me/917065665988?text=Hi!%20I%20just%20submitted%20a%20subscription%20request%20for%20${encodeURIComponent(selectedPlan.name)}%20(₹${selectedPlan.price}).%20UTR:%20${encodeURIComponent(form.utr)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:bg-[#20b858] transition-colors"
                        >
                          💬 WhatsApp Us for Quick Confirmation
                        </a>
                        <button onClick={closeModal} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                          Close
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
