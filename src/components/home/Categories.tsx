"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { useSiteData } from "@/context/SiteContext";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export function Categories() {
  const { siteData } = useSiteData();
  const categories = siteData.categories;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            Explore Our Menu
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-4" />
          <p className="text-muted-foreground font-subheading">Authentic homemade taste in every bite</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-5"
        >
          {categories.map((category) => (
            <motion.div key={category.title} variants={itemVariants} className="h-full">
              <Link href={category.href} className="block group h-full">
                <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-border/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                  
                  {/* Image Container */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image 
                      src={category.image}
                      alt={category.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    
                    {/* Badge */}
                    {category.badge && (
                      <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                        {category.badge}
                      </div>
                    )}
                    
                    {/* Disabled Overlay */}
                    {category.disabled && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-white/90 text-foreground px-4 py-1.5 rounded-full font-bold text-sm shadow-lg">
                          Coming Soon
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                      {category.title}
                    </h3>
                    <p className="text-muted-foreground text-sm font-subheading mb-4 flex-grow">
                      {category.desc}
                    </p>
                    <div className="flex items-center text-primary text-sm font-bold font-subheading group-hover:translate-x-1 transition-transform">
                      {category.disabled ? "Notify Me" : "View Menu"} <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>

                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
