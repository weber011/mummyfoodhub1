"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "Is the food strictly homemade?",
    answer: "Yes, absolutely! Our food is cooked in a hygienic home kitchen environment using fresh ingredients, just like how mothers prepare meals for their families. We strictly avoid excess oil, artificial colors, and heavy commercial spices."
  },
  {
    question: "Do you deliver daily?",
    answer: "Yes, we deliver daily. You can order single meals or subscribe to our monthly tiffin service where we deliver lunch and/or dinner daily to your doorstep."
  },
  {
    question: "How much are the delivery charges?",
    answer: "Delivery charges range between ₹5 to ₹20 depending on your exact distance from our kitchen in Sector 106, Noida."
  },
  {
    question: "How can I pay for my order?",
    answer: "You can pay via UPI (Google Pay, PhonePe, Paytm) or Cash on Delivery. For monthly subscriptions, payment is required in advance."
  },
  {
    question: "Can I customize my meal?",
    answer: "We offer some customization options like extra rotis or swapping rice for rotis. However, the core sabzi and dal of the day remain the same to ensure fresh bulk preparation."
  }
];

export function FAQ() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        
        <div className="mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
            Frequently Asked Questions
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-4" />
          <p className="text-muted-foreground font-subheading">Everything you need to know about our service</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-border"
        >
          <Accordion className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b-border/50 px-2">
                <AccordionTrigger className="text-left font-subheading font-medium text-[15px] hover:text-primary hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-[14px] leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
        
      </div>
    </section>
  );
}
