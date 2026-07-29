"use client";

import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="pt-20 pb-20 bg-background min-h-screen">
      <div className="bg-primary/10 py-16 text-center border-b border-border">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">Contact Us</h1>
        <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-4" />
        <p className="text-muted-foreground font-subheading text-lg max-w-xl mx-auto px-4">
          We'd love to hear from you. Get in touch for orders, feedback, or bulk inquiries.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          
          {/* Contact Details */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-2xl font-heading font-bold text-foreground">Get In Touch</h2>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-subheading font-bold text-foreground mb-1">Phone / WhatsApp</h3>
                <p className="text-muted-foreground font-subheading">7065665988</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-subheading font-bold text-foreground mb-1">Email</h3>
                <p className="text-muted-foreground font-subheading">mummyfoodhub@gmail.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-subheading font-bold text-foreground mb-1">Location</h3>
                <p className="text-muted-foreground font-subheading">Sector 106, Noida, UP</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-subheading font-bold text-foreground mb-1">Working Hours</h3>
                <p className="text-muted-foreground font-subheading">Morning 9:00 AM – Night 10:00 PM</p>
              </div>
            </div>
          </motion.div>

          {/* Map Placeholder */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="h-full min-h-[400px] bg-muted rounded-3xl overflow-hidden border border-border relative flex items-center justify-center"
          >
            <div className="text-center p-8">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
              <h3 className="font-heading font-bold text-xl text-foreground mb-2">Mummy Food Hub</h3>
              <p className="text-muted-foreground font-subheading text-sm">Sector 106, Noida</p>
              <p className="text-xs text-muted-foreground/60 mt-4">(Google Maps integration placeholder)</p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
