"use client";

import { motion } from "framer-motion";
import { CheckCircle, Info } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    id: "lunch",
    name: "Lunch Only Plan",
    price: 2100,
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
    price: 4400,
    savings: "₹200",
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
    price: 2500,
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
                <li>Delivery is free within 5-7 KM radius of Sector 106, Noida.</li>
                <li>Beyond 7 KM, nominal delivery charges (₹5-₹20/day) may apply.</li>
                <li>Subscription amount is payable in advance at the start of the month.</li>
                <li>You can pause your subscription for up to 5 days in a month with 24 hours prior notice.</li>
                <li>Meals are delivered in high-quality food-grade disposable containers or reusable tiffins based on your preference.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bulk Orders Section */}
        <div className="mt-16 bg-primary/10 rounded-2xl border border-primary/20 p-8 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-foreground mb-4">Planning a Party or Corporate Event?</h2>
          <p className="text-muted-foreground font-subheading mb-6 max-w-2xl mx-auto">
            We accept bulk orders for parties, office lunches, and special occasions. Get customized menus, bulk discounts, and dedicated delivery.
          </p>
          <Link 
            href="https://wa.me/917065665988?text=Hi,%20I%20have%20an%20inquiry%20regarding%20a%20bulk%20order/party%20catering."
            target="_blank"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-[#20b858] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Inquire on WhatsApp
          </Link>
        </div>

      </div>
    </div>
  );
}
