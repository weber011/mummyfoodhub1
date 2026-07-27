import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="pt-32 pb-20 container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl min-h-screen">
      <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-8">Privacy Policy</h1>
      <div className="prose prose-lg text-muted-foreground font-subheading">
        <p>At Mummy Food Hub, we take your privacy seriously. This privacy policy describes how we collect, use, and protect your personal information.</p>
        <h2>Information Collection</h2>
        <p>When you place an order via WhatsApp or our website, we collect your name, phone number, and delivery address to fulfill your order.</p>
        <h2>Data Security</h2>
        <p>We do not share your personal information with any third parties except for delivery partners to successfully deliver your food.</p>
        <Link href="/" className="text-primary hover:underline mt-8 inline-block">Return to Home</Link>
      </div>
    </div>
  );
}
