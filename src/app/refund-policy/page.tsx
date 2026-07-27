import Link from "next/link";

export default function RefundPolicy() {
  return (
    <div className="pt-32 pb-20 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl min-h-screen">
      <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-8">Refund Policy</h1>
      <div className="prose prose-lg text-muted-foreground font-subheading">
        <p>We strive to provide the best food quality. If you are unsatisfied, here is our refund policy.</p>
        <h2>Cancellations</h2>
        <p>For daily orders, cancellations are allowed up to 2 hours before the delivery window.</p>
        <h2>Refunds</h2>
        <p>If you cancel a monthly subscription midway, the days consumed will be calculated at the non-discounted daily rate, and the remaining amount will be refunded within 5-7 working days.</p>
        <Link href="/" className="text-primary hover:underline mt-8 inline-block">Return to Home</Link>
      </div>
    </div>
  );
}
