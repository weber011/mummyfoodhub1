"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CheckCircle2, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Header Banner */}
      <div className="bg-primary/10 py-16 text-center border-b border-border">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">About Us</h1>
        <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-4" />
        <p className="text-primary font-heading text-2xl md:text-3xl font-black max-w-2xl mx-auto drop-shadow-sm uppercase tracking-wide mt-6">
          Simplicity is our Identity
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Image Grid */}
          <div className="lg:w-1/2 w-full grid grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative h-[300px] rounded-2xl overflow-hidden shadow-lg"
            >
              <Image 
                src="/images/delux thali.jpeg" 
                alt="Delicious Thali" 
                fill 
                className="object-cover" 
              />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative h-[250px] mt-12 rounded-2xl overflow-hidden shadow-lg"
            >
              <Image 
                src="/images/regular veg thali.jpeg" 
                alt="Fresh Meals" 
                fill 
                className="object-cover" 
              />
            </motion.div>
          </div>

          {/* Text Content */}
          <div className="lg:w-1/2 w-full">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6">
                Fresh, Homemade, <span className="text-primary">Made with Love</span>
              </h2>
              
              <div className="prose prose-lg text-muted-foreground font-subheading mb-8">
                <p>
                  At Mummy Food Hub, we believe healthy food doesn't need excess oil or heavy spices to taste good. Every meal is prepared just like home, keeping your health and taste buds in mind.
                </p>
                <p className="mt-4">
                  Whether you're a student missing home-cooked meals or a professional tired of eating out, our meals provide the perfect balance of nutrition, taste, and affordability.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Fresh ingredients",
                  "Homemade taste",
                  "Less Oil",
                  "Less Masala",
                  "Hygienic Kitchen",
                  "Affordable Pricing"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                    <span className="text-foreground font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-6 bg-primary/5 rounded-2xl border border-primary/20 flex items-start gap-4">
                <Heart className="w-8 h-8 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-heading font-bold text-lg text-foreground mb-1">Our Promise</h4>
                  <p className="text-sm text-muted-foreground">Every bite you take will remind you of the love and care of a mother's cooking.</p>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-8 flex gap-6">
                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 flex-1 text-center">
                  <p className="text-3xl font-heading font-black text-primary">100+</p>
                  <p className="text-sm font-subheading text-foreground font-medium">Happy Clients</p>
                </div>
                <div className="p-4 bg-secondary/10 rounded-xl border border-secondary/20 flex-1 text-center">
                  <p className="text-3xl font-heading font-black text-secondary">500+</p>
                  <p className="text-sm font-subheading text-foreground font-medium">Deliveries</p>
                </div>
              </div>
            </motion.div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
