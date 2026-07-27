import Link from "next/link";

export default function TrackOrderPage() {
  return (
    <div className="pt-32 pb-20 bg-background min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-lg border border-border">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2 text-center">Track Order</h1>
        <p className="text-muted-foreground font-subheading text-center mb-8">
          Enter your order ID or registered phone number.
        </p>
        
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Order ID / Phone Number</label>
            <input 
              type="text" 
              className="w-full p-3 border border-border rounded-lg focus:outline-none focus:border-primary"
              placeholder="e.g. 7065665988"
            />
          </div>
          <button 
            type="button" 
            className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Track Status
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Or track directly on WhatsApp</p>
          <Link 
            href="https://wa.me/917065665988?text=Hi,%20I%20want%20to%20track%20my%20order."
            target="_blank"
            className="text-primary font-bold hover:underline mt-2 inline-block"
          >
            Message Us
          </Link>
        </div>
      </div>
    </div>
  );
}
