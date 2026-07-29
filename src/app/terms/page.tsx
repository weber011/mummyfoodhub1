import Link from "next/link";

export default function Terms() {
  return (
    <div className="pt-32 pb-20 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl min-h-screen">
      <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-8">Terms of Service</h1>
      <div className="prose prose-lg text-muted-foreground font-subheading">
        <p>Welcome to Mummy Food Hub. By accessing or using our services, you agree to be bound by these terms.</p>
        <h2>Orders & Delivery</h2>
        <p>Orders are subject to availability and delivery radius. We currently deliver within 5-7 KM of Sector 106, Noida.</p>
        <h2>Subscriptions</h2>
        <p>Monthly subscriptions must be paid in advance. Cancellations require 24 hours prior notice to pause the service for up to 5 days in a month.</p>
        <Link href="/" className="text-primary hover:underline mt-8 inline-block">Return to Home</Link>
      </div>
    </div>
  );
}
