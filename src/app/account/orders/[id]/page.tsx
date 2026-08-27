"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, MapPin, Clock, CreditCard, CheckCircle, Package, Truck, ChefHat, AlertCircle } from "lucide-react";
import type { Order } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/types";

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && params.id) {
      fetch(`/api/orders/${params.id}`)
        .then(res => {
          if (!res.ok) throw new Error("Order not found or unauthorized");
          return res.json();
        })
        .then(data => {
          if (data.order) setOrder(data.order);
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [user, params.id]);

  if (isLoading || !user) return <div className="min-h-screen" />;

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen py-32 text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-heading font-bold text-foreground">Order not found</h2>
        <p className="text-muted-foreground mt-2">The order you are looking for does not exist or you don't have access to it.</p>
        <Link href="/account/orders" className="text-primary mt-4 inline-block hover:underline font-bold">Return to Orders</Link>
      </div>
    );
  }

  const timeline = [
    { status: 'pending', label: 'Order Placed', icon: Clock },
    { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { status: 'preparing', label: 'Preparing', icon: ChefHat },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { status: 'delivered', label: 'Delivered', icon: Package }
  ];

  const currentStatusIndex = order.status === 'cancelled' 
    ? -1 
    : timeline.findIndex(t => t.status === order.status);

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-6 mt-10">
        
        <div className="flex items-center gap-4 mb-6">
          <Link href="/account/orders" className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-border hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-heading font-bold text-foreground">{order.orderNumber || `Order #${order.id.slice(-8).toUpperCase()}`}</h1>
            <p className="text-xs text-muted-foreground font-subheading mt-1">
              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
        </div>

        {/* Timeline Status */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
           <h3 className="font-heading font-bold text-foreground mb-6">Order Status</h3>
           {order.status === 'cancelled' ? (
             <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100">
               <AlertCircle className="w-6 h-6" />
               <div>
                 <p className="font-bold">Order Cancelled</p>
                 <p className="text-sm opacity-80">This order has been cancelled.</p>
               </div>
             </div>
           ) : (
             <div className="relative">
                {/* Connecting Line */}
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-100" />
                
                <div className="space-y-6 relative">
                  {timeline.map((step, idx) => {
                    const isCompleted = currentStatusIndex >= idx;
                    const isCurrent = currentStatusIndex === idx;
                    const Icon = step.icon;
                    return (
                      <div key={step.status} className="flex gap-4 items-start">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                          isCompleted ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="pt-3">
                          <p className={`font-bold ${isCompleted ? 'text-foreground' : 'text-gray-400'}`}>{step.label}</p>
                          {isCurrent && (
                            <p className="text-sm text-primary font-medium mt-1">
                              {step.status === 'pending' && 'Awaiting confirmation from kitchen.'}
                              {step.status === 'confirmed' && 'Order confirmed! Kitchen will start preparing soon.'}
                              {step.status === 'preparing' && 'Your food is being prepared.'}
                              {step.status === 'out_for_delivery' && 'Order is on the way!'}
                              {step.status === 'delivered' && 'Enjoy your meal!'}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
             </div>
           )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border bg-gray-50">
            <h3 className="font-heading font-bold text-foreground">Items Ordered</h3>
          </div>
          <div className="p-4 divide-y divide-border">
            {order.items.map((item, idx) => {
              const extrasTotal = item.extras?.reduce((s, e) => s + e.price, 0) || 0;
              const itemTotal = (item.price + extrasTotal) * item.quantity;
              return (
                <div key={idx} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex justify-between font-subheading text-sm">
                    <span className="text-foreground"><span className="font-bold">{item.quantity}x</span> {item.title}</span>
                    <span className="font-bold text-foreground">₹{itemTotal}</span>
                  </div>
                  {item.extras && item.extras.length > 0 && (
                    <div className="pl-6 mt-1 text-xs text-muted-foreground space-y-0.5">
                      {item.extras.map((ex, eIdx) => (
                        <div key={eIdx} className="flex justify-between">
                          <span>+ {ex.name}</span>
                          {ex.price > 0 && <span>₹{ex.price * item.quantity}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-4 bg-gray-50 border-t border-border space-y-2 text-sm font-subheading">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Charge</span>
              <span>₹{order.deliveryCharge}</span>
            </div>
            {order.subscriptionDiscount > 0 && (
              <div className="flex justify-between text-green-600 font-bold">
                <span>Subscription Discount (10%)</span>
                <span>-₹{order.subscriptionDiscount}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600 font-bold">
                <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                <span>-₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border">
              <span>Total Paid</span>
              <span className="text-primary text-lg">₹{order.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h3 className="font-heading font-bold text-foreground mb-4 border-b border-border pb-2">Delivery Details</h3>
          
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">Deliver to: {order.deliveryType}</p>
              <p className="text-sm text-muted-foreground mt-1">{order.address}</p>
              {order.landmark && <p className="text-sm text-muted-foreground mt-1">Landmark: {order.landmark}</p>}
              <p className="text-sm text-muted-foreground">Sector {order.sector}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">Delivery Time</p>
              <p className="text-sm text-muted-foreground mt-1">{order.deliveryTime}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-foreground">Payment Method</p>
              <p className="text-sm text-muted-foreground mt-1">{order.paymentMethod}</p>
            </div>
          </div>

          {order.notes && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-sm">
              <span className="font-bold text-yellow-800">Note:</span> <span className="text-yellow-700">{order.notes}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
