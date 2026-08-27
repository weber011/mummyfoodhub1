"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Package, ChefHat, Truck, CheckCircle, Clock } from "lucide-react";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !phone) {
      setError("Please enter both Order Number and Phone Number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to track order");
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const timeline = [
    { status: 'pending', label: 'Order Placed', icon: Clock },
    { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { status: 'preparing', label: 'Preparing', icon: ChefHat },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: Package }
  ];

  return (
    <div className="pt-32 pb-20 bg-background min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full mx-auto p-8 bg-white rounded-3xl shadow-xl border border-border">
        
        {!order ? (
          <>
            <h1 className="text-3xl font-heading font-black text-foreground mb-2 text-center">Track Order</h1>
            <p className="text-muted-foreground font-subheading text-center mb-8">
              Enter your Order Number and Phone Number to check status.
            </p>
            
            <form onSubmit={handleTrack} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Order Number</label>
                <input 
                  type="text" 
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  className="w-full p-3 border border-border rounded-xl focus:outline-none focus:border-primary font-heading"
                  placeholder="e.g. MFH-20260828-001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Phone Number</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 border border-border rounded-xl focus:outline-none focus:border-primary font-heading"
                  placeholder="e.g. 9876543210"
                />
              </div>
              
              {error && <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg">{error}</p>}
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Track Status"}
              </button>
            </form>
          </>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-heading font-black text-foreground">{order.orderNumber}</h2>
              <button onClick={() => setOrder(null)} className="text-sm font-bold text-primary hover:underline">Track Another</button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-border mb-6">
               <p className="text-sm text-muted-foreground font-bold uppercase mb-1">Status</p>
               <h3 className="text-2xl font-heading font-black text-primary capitalize">{order.status.replace(/_/g, ' ')}</h3>
            </div>

            <div className="relative mb-8 px-4">
              <div className="absolute left-10 top-6 bottom-6 w-0.5 bg-gray-200" />
              <div className="space-y-6 relative">
                {timeline.map((step, idx) => {
                  const currentStatusIndex = order.status === 'cancelled' ? -1 : timeline.findIndex(t => t.status === order.status);
                  const isCompleted = currentStatusIndex >= idx;
                  const isCurrent = currentStatusIndex === idx;
                  const Icon = step.icon;
                  return (
                    <div key={step.status} className="flex gap-4 items-start">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                        isCompleted ? 'bg-primary text-white' : 'bg-white text-gray-400 border-2 border-gray-200'
                      } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="pt-3">
                        <p className={`font-bold ${isCompleted ? 'text-foreground' : 'text-gray-400'}`}>{step.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Link href="/login" className="w-full bg-white border-2 border-primary text-primary font-bold py-4 rounded-xl shadow-sm hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
              Login to view full order details <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
