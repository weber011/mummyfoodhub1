"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

const reviews = [
  {
    name: "Rahul Sharma",
    role: "IT Professional",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1287&auto=format&fit=crop",
    text: "Being away from home, I really missed my mom's cooking. Mummy Food Hub is a lifesaver. The food is perfectly spiced, not oily, and tastes exactly like home."
  },
  {
    name: "Priya Singh",
    role: "Student",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1287&auto=format&fit=crop",
    text: "I took their monthly subscription and it's the best decision I made. The daily delivery is always on time, and the packaging is very hygienic. Highly recommended!"
  },
  {
    name: "Amit Verma",
    role: "Business Owner",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1287&auto=format&fit=crop",
    text: "Ordered their Deluxe Veg Meal for my entire office staff. Everyone loved it. The paneer was fresh and the parathas were super soft. Great job!"
  }
];

export function Testimonials() {
  return (
    <section className="py-20 bg-background overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03]">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-secondary" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-14 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            Happy Customers
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-4" />
          <p className="text-muted-foreground font-subheading">Don't just take our word for it</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className="bg-white border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full rounded-2xl relative">
                <CardContent className="pt-10 px-8 pb-8">
                  {/* Rating */}
                  <div className="flex gap-1 mb-6 text-[#FFB800]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  
                  {/* Review Text */}
                  <p className="text-foreground/80 font-subheading text-sm mb-8 leading-relaxed italic">
                    "{review.text}"
                  </p>
                  
                  {/* User Info */}
                  <div className="flex items-center gap-4 mt-auto">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                      <Image 
                        src={review.image} 
                        alt={review.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-foreground">{review.name}</h4>
                      <p className="text-xs text-muted-foreground font-subheading">{review.role}</p>
                    </div>
                  </div>
                  
                  {/* Quote Icon Background */}
                  <div className="absolute top-6 right-6 text-primary/5">
                    <svg width="45" height="36" viewBox="0 0 45 36" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.5 36C6.04416 36 0 29.9558 0 22.5C0 15.0442 6.04416 9 13.5 9V0C25.9264 0 36 10.0736 36 22.5V36H13.5ZM31.5 36C24.0442 36 18 29.9558 18 22.5C18 15.0442 24.0442 9 31.5 9V0C43.9264 0 54 10.0736 54 22.5V36H31.5Z" />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
