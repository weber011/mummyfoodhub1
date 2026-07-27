"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const services = [
  {
    title: "Daily Tiffin",
    desc: "Wholesome meals delivered daily to your home. Perfect for families, students, and PGs.",
    image: "https://images.unsplash.com/photo-1546833998-877b37c2e5c4?q=80&w=1974&auto=format&fit=crop"
  },
  {
    title: "Office Lunch Supply",
    desc: "Keep your employees healthy and productive with our bulk office lunch subscriptions.",
    image: "https://images.unsplash.com/photo-1577906236962-d9611db93901?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Party & Birthday Catering",
    desc: "Delicious homemade food for your house parties, birthdays, and small gatherings.",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "Hostel & PG Food",
    desc: "Affordable and nutritious meal plans tailored specifically for students living away from home.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop"
  }
];

export default function ServicesPage() {
  return (
    <div className="pt-20 pb-20 bg-background min-h-screen">
      <div className="bg-primary/10 py-16 text-center border-b border-border">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">Our Services</h1>
        <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-4" />
        <p className="text-muted-foreground font-subheading text-lg max-w-2xl mx-auto px-4">
          From daily tiffins to bulk corporate orders, we cater to all your food needs with the same motherly love.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {services.map((service, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg border border-border/50 group flex flex-col sm:flex-row h-full"
            >
              <div className="relative h-48 sm:h-auto sm:w-2/5 overflow-hidden">
                <Image 
                  src={service.image} 
                  alt={service.title} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6 sm:w-3/5 flex flex-col justify-center">
                <h3 className="text-xl font-heading font-bold text-foreground mb-3">{service.title}</h3>
                <p className="text-muted-foreground text-sm font-subheading mb-6 flex-grow">{service.desc}</p>
                <Link 
                  href={`https://wa.me/917065665988?text=Hi,%20I%20want%20to%20inquire%20about%20your%20${encodeURIComponent(service.title)}%20service.`}
                  target="_blank"
                  className="inline-flex items-center text-primary font-bold font-subheading hover:translate-x-1 transition-transform w-fit"
                >
                  Inquire Now <span className="ml-2">→</span>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Why Choose Us for Bulk Orders */}
        <div className="mt-20 bg-muted rounded-3xl p-8 md:p-12 border border-border">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-8 text-center">
            Why choose us for Bulk & Corporate Orders?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              "Highly customizable menu",
              "Timely delivery guaranteed",
              "Special bulk pricing discounts",
              "Dedicated account manager"
            ].map((benefit, i) => (
              <div key={i} className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-secondary mb-3" />
                <span className="text-sm font-subheading font-medium text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link 
              href="https://wa.me/917065665988?text=Hi,%20I%20have%20a%20bulk%20order%20inquiry."
              target="_blank"
              className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
            >
              Get a Custom Quote
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
