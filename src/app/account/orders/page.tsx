"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, Package, ChevronRight } from "lucide-react";
import type { Order } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/types";

export default function OrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetch("/api/orders")
        .then(res => res.json())
        .then(data => {
          if (data.orders) setOrders(data.orders);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (isLoading || !user) return <div className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-6 mt-10">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account" className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-border hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">My Orders</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-border shadow-sm">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground font-subheading mb-6">Looks like you haven't placed any orders.</p>
            <Link href="/menu" className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-primary/90 transition-colors">
              Explore Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="block bg-white rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order #{order.id.slice(-8).toUpperCase()}</span>
                    <p className="text-sm font-subheading text-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </div>
                </div>
                
                <div className="border-t border-border pt-4 flex items-center justify-between">
                  <p className="text-sm font-subheading text-muted-foreground line-clamp-1 flex-1 pr-4">
                    {order.items.map(i => `${i.quantity}x ${i.title}`).join(", ")}
                  </p>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-heading font-bold text-primary">₹{order.totalAmount}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
