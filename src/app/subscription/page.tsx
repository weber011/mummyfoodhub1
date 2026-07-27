"use client";

import { motion } from "framer-motion";
import { CheckCircle, Info } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    id: "lunch",
    name: "Lunch Only Plan",
    price: 1999,
    duration: "Monthly",
    features: [
      "Daily Lunch Delivery",
      "Different menu every day",
      "Freshly prepared by 11 AM",
      "Delivery between 12:30 PM - 2:00 PM"
    ],
    recommended: false,
  },
  {
    id: "complete",
    name: "Complete Monthly Plan",
    price: 5999,
    savings: "₹511",
    duration: "Monthly",
    features: [
      "Lunch & Dinner Delivery",
      "Different menu for both meals",
      "Maximum nutritional balance",
      "Priority delivery",
      "Special weekend surprise meal"
    ],
    recommended: true,
  },
  {
    id: "dinner",
    name: "Dinner Only Plan",
    price: 2299,
    duration: "Monthly",
    features: [
      "Daily Dinner Delivery",
      "Lighter, digestion-friendly meals",
      "Freshly prepared by 6 PM",
      "Delivery between 8:00 PM - 9:30 PM"
    ],
    recommended: false,
  }
];

export default function SubscriptionPage() {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20 items-center">
          {plans.map((plan, idx) => (
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
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 font-subheading">
                    <CheckCircle className="w-5 h-5 text-secondary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Link 
                href={`https://wa.me/917065665988?text=Hi,%20I'm%20interested%20in%20subscribing%20to%20the%20${encodeURIComponent(plan.name)}.`}
                target="_blank"
                className={`w-full block text-center font-bold py-3 rounded-lg transition-colors ${
                  plan.recommended
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                }`}
              >
                Subscribe Now
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Info Section */}
        <div className="max-w-4xl mx-auto bg-muted p-8 rounded-2xl border border-border">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-primary shrink-0 mt-1" />
            <div>
              <h4 className="text-xl font-heading font-bold text-foreground mb-2">Delivery Policy & Terms</h4>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm font-subheading">
                <li>Delivery is free within 5-7 KM radius of Sector 110, Noida.</li>
                <li>Beyond 7 KM, nominal delivery charges (₹5-₹20/day) may apply.</li>
                <li>Subscription amount is payable in advance at the start of the month.</li>
                <li>You can pause your subscription for up to 5 days in a month with 24 hours prior notice.</li>
                <li>Meals are delivered in high-quality food-grade disposable containers or reusable tiffins based on your preference.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
