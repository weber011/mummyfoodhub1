"use client";

import Link from "next/link";
import { Gift } from "lucide-react";

export function WelcomeOffer() {
  return (
    <div className="w-full bg-primary/5 border-y border-primary/20 py-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-subheading text-foreground">First order with us?</p>
              <p className="font-heading font-bold text-primary text-lg">Get ₹100 OFF!</p>
            </div>
          </div>
          <div className="hidden sm:block w-px h-10 bg-primary/20 mx-2" />
          <div>
            <p className="text-sm font-subheading text-muted-foreground mb-1">Use code <strong className="text-foreground bg-white px-2 py-0.5 rounded border border-border">WELCOME100</strong> at checkout</p>
            <p className="text-xs text-muted-foreground">* Valid on orders above ₹499</p>
          </div>
          <Link href="/menu" className="sm:ml-auto bg-primary text-white font-bold py-2 px-6 rounded-lg text-sm shadow-sm hover:bg-primary/90 transition-colors">
            Order Now
          </Link>
        </div>
      </div>
    </div>
  );
}
