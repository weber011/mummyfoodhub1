"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Info, Loader2, X, Phone } from "lucide-react";
import Link from "next/link";
import { useSiteData } from "@/context/SiteContext";
import { useAuth } from "@/context/AuthContext";

export default function SubscriptionPage() {
  const { siteData } = useSiteData();
  const { user } = useAuth();
  const plans = siteData.subscriptionPlans;

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleRequest = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          planPrice: selectedPlan.price,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");
      setSuccess(data.message || "Request submitted!");
      setSelectedPlan(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

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
        
        {/* Success Message */}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mb-10 bg-green-50 border border-green-200 text-green-800 p-5 rounded-2xl flex items-start gap-3 shadow-sm">
            <CheckCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-lg">Request Submitted!</p>
              <p className="text-sm mt-1">{success}</p>
            </div>
          </motion.div>
        )}

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
                  ? 'border-primary shadow-2xl scale-100 md:scale-105 z-10' 
                  : 'border-border shadow-lg'
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
                onClick={() => { setSelectedPlan(plan); setSuccess(""); setError(""); }}
                className={`w-full block text-center font-bold py-3 rounded-lg transition-colors ${
                  plan.recommended
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                }`}
              >
                Subscribe Now
              </button>
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
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

        {/* Info Section */}
        <div className="max-w-4xl mx-auto bg-muted p-8 rounded-2xl border border-border mb-16">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-primary shrink-0 mt-1" />
            <div>
              <h4 className="text-xl font-heading font-bold text-foreground mb-2">Delivery Policy & Terms (T&C)</h4>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm font-subheading">
                <li><strong className="text-foreground">Important Note:</strong> If you wish to skip any meal, please inform us at least one day in advance.</li>
                <li>If usage in a month is less than 26 days, the remaining meals will be carried forward to the next month.</li>
                <li>Delivery is free within 4 KM radius of Sector 110, Noida. Nominal charges apply up to 10 KM.</li>
                <li>Subscription amount is payable in advance at the start of the subscription.</li>
                <li>After submitting your request, our team will verify your payment and activate your subscription within a few hours.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bulk Orders Section */}
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

      {/* Subscription Request Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setSelectedPlan(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-heading font-black text-foreground">Subscribe</h2>
                <button onClick={() => setSelectedPlan(null)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                <p className="font-bold text-foreground font-heading text-lg">{selectedPlan.name}</p>
                <p className="text-primary font-black text-2xl mt-1">₹{selectedPlan.price} <span className="text-sm text-muted-foreground font-normal">/{selectedPlan.duration}</span></p>
              </div>

              {!user ? (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Please login first to subscribe.</p>
                  <Link href="/login" className="block w-full bg-primary text-white font-bold py-3 rounded-xl text-center hover:bg-primary/90 transition-colors">
                    Login to Continue
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Your Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:border-primary font-subheading"
                      />
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                    <strong>How it works:</strong> Submit your request, make the payment via UPI/cash to us, and our team will activate your subscription within a few hours.
                  </div>

                  {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg">{error}</p>}

                  <button
                    onClick={handleRequest}
                    disabled={submitting}
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Subscription Request"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
