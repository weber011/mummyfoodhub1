"use client";

import { MenuCard } from "@/components/shared/MenuCard";

export default function ParathasPage() {
  return (
    <div className="pt-20 pb-20 bg-background min-h-screen">
      <div className="bg-secondary/10 py-12 text-center border-b border-border">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">Stuffed Parathas</h1>
        <div className="w-24 h-1 bg-secondary mx-auto rounded-full mb-4" />
        <p className="text-muted-foreground font-subheading text-lg max-w-xl mx-auto">
          Hot, buttery, and fully stuffed parathas served with fresh Dahi and Achar.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Aloo / Gobi / Onion Parathas */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground border-l-4 border-primary pl-4 mb-8">
            Regular Parathas (Aloo / Gobi / Onion)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Aloo Paratha — golden stuffed paratha on tawa with dahi & pickle */}
            <MenuCard
              title="1 Piece Combo"
              price={50}
              image="/images/aalu parata comboo.jpeg"
              items={["1 Large Stuffed Paratha", "Fresh Dahi (50ml)", "Homemade Achar"]}
              extras={[{ name: "50ml Dahi", price: 15 }, { name: "100ml Dahi", price: 25 }, { name: "Extra Achar", price: 10 }]}
            />

            {/* 2 Aloo Parathas with dahi and achar */}
            <MenuCard
              title="2 Pieces Combo"
              price={80}
              badge="Best Value"
              image="/images/aalu parata comboo.jpeg"
              items={["2 Large Stuffed Parathas", "Fresh Dahi (100ml)", "Homemade Achar"]}
              extras={[{ name: "50ml Dahi", price: 15 }, { name: "100ml Dahi", price: 25 }, { name: "Extra Achar", price: 10 }]}
            />

          </div>
        </div>

        {/* Paneer Parathas */}
        <div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground border-l-4 border-secondary pl-4 mb-8">
            Paneer Parathas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Paneer Paratha — paneer stuffed golden paratha */}
            <MenuCard
              title="1 Piece Paneer Combo"
              price={70}
              image="/images/paneer paratha.jpeg"
              items={["1 Large Paneer Paratha", "Fresh Dahi (50ml)", "Homemade Achar"]}
              extras={[{ name: "50ml Dahi", price: 15 }, { name: "100ml Dahi", price: 25 }, { name: "Extra Achar", price: 10 }]}
            />

            {/* 2 Paneer Parathas */}
            <MenuCard
              title="2 Pieces Paneer Combo"
              price={120}
              image="/images/paneer paratha.jpeg"
              items={["2 Large Paneer Parathas", "Fresh Dahi (100ml)", "Homemade Achar"]}
              extras={[{ name: "50ml Dahi", price: 15 }, { name: "100ml Dahi", price: 25 }, { name: "Extra Achar", price: 10 }]}
            />

          </div>
        </div>

      </div>
    </div>
  );
}
