"use client";

import { MenuCard } from "@/components/shared/MenuCard";

export default function FoodCombosPage() {
  return (
    <div className="pt-20 pb-20 bg-background min-h-screen">
      <div className="bg-primary/10 py-12 text-center border-b border-border">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">Rice Together</h1>
        <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-4" />
        <p className="text-muted-foreground font-subheading text-lg max-w-xl mx-auto">
          Classic North Indian combos — a plate of rice with your favourite curry, achar, and salad.
        </p>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* Chhole Rice — show chhole (chickpea curry) clearly */}
          <MenuCard
            title="Chhole Rice Combo"
            originalPrice={99}
            price={89}
            discount="10%"
            image="/images/chhole chawal combo.jpeg"
            items={["Home made chhola", "Steamed Rice", "Onion Salad", "Pickle"]}
            extras={[{ name: "Extra Rice (Half)", price: 30 }, { name: "Raita 100ml", price: 10 }]}
          />

          {/* Kadhi Chawal — newly added */}
          <MenuCard
            title="Kadhi Chawal Combo"
            originalPrice={99}
            price={89}
            discount="10%"
            image="/images/kadhi chawal.png"
            badge="New"
            items={["Punjabi Pakora Kadhi", "Steamed Rice", "Onion Salad", "Pickle"]}
            extras={[{ name: "Extra Rice (Half)", price: 30 }, { name: "Raita 100ml", price: 10 }]}
          />

          {/* Rajma Rice — show kidney beans curry with rice */}
          <MenuCard
            title="Rajma Rice Combo"
            originalPrice={99}
            price={89}
            discount="10%"
            image="/images/rajma chawal combo.jpeg"
            items={["Home-style Rajma", "Steamed Rice", "Onion Salad", "Pickle"]}
            extras={[{ name: "Extra Rice (Half)", price: 30 }, { name: "Raita 100ml", price: 10 }]}
          />

        </div>
      </div>
    </div>
  );
}
