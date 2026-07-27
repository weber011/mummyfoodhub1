import { Testimonials } from "@/components/home/Testimonials";

export default function TestimonialsPage() {
  return (
    <div className="pt-20">
      <div className="bg-primary/10 py-16 text-center border-b border-border">
        <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-4">Customer Reviews</h1>
        <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-4" />
        <p className="text-muted-foreground font-subheading text-lg max-w-xl mx-auto px-4">
          See what our extended family says about our food.
        </p>
      </div>
      <Testimonials />
    </div>
  );
}
