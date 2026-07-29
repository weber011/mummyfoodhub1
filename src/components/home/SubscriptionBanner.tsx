"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function SubscriptionBanner() {
  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl overflow-hidden shadow-xl border border-border flex flex-col lg:flex-row"
        >
          {/* Content Side */}
          <div className="p-8 md:p-12 lg:w-1/2 flex flex-col justify-center">
            <div className="inline-block px-4 py-1.5 bg-secondary/10 text-secondary font-bold text-sm rounded-full w-fit mb-6">
              Most Value for Money
            </div>

            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Daily Tiffin Subscription
            </h2>

            <p className="text-muted-foreground font-subheading mb-8">
              Tired of cooking daily? Get healthy, less oily, homemade food delivered every day across{" "}
              <strong>Noida Sectors 106, 133 &amp; 135</strong>. Perfect for students, PGs, and corporate employees.
            </p>

            <ul className="space-y-3 mb-8">
              {[
                "Different menu every day",
                "Fresh ingredients & hygienic kitchen",
                "Delivery in Sectors 106, 133 & 135",
                "Save up to ₹511 per month",
              ].map((benefit, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground font-subheading text-sm">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/subscription"
                className="bg-primary text-white text-center font-bold font-subheading px-8 py-3 rounded-xl shadow-lg hover:bg-primary/90 hover:scale-105 transition-all"
              >
                View Plans
              </Link>
              <Link
                href="https://wa.me/917065665988?text=Hi!%20I%20want%20to%20know%20more%20about%20the%20Monthly%20Tiffin%20Subscription."
                target="_blank"
                className="bg-white text-foreground text-center border-2 border-border font-bold font-subheading px-8 py-3 rounded-xl hover:border-primary hover:text-primary transition-all"
              >
                Chat on WhatsApp
              </Link>
            </div>
          </div>

          {/* Image Side — using Next.js Image properly */}
          <div className="lg:w-1/2 relative min-h-[300px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=2070&auto=format&fit=crop"
              alt="Homemade Tiffin Subscription"
              fill
              className="object-cover"
            />
            {/* Gradient Mask */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent hidden lg:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent lg:hidden" />

            {/* Price Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              whileInView={{ scale: 1, rotate: -5 }}
              viewport={{ once: true }}
              transition={{ type: "spring", delay: 0.3 }}
              className="absolute top-8 right-8 lg:top-12 lg:right-12 bg-white p-4 rounded-2xl shadow-2xl border-4 border-primary z-10"
            >
              <p className="text-muted-foreground text-xs font-bold uppercase text-center mb-1">Starts at</p>
              <p className="text-3xl font-heading font-black text-primary">₹1999</p>
              <p className="text-muted-foreground text-xs text-center font-medium">/ month</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
