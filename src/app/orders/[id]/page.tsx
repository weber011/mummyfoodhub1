"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CheckCircle, ArrowRight, Package } from "lucide-react";

export default function OrderSuccessPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const routeParams = useParams();
  const id = typeof routeParams?.id === "string" ? routeParams.id : Array.isArray(routeParams?.id) ? routeParams.id[0] : "";
  const [orderNum, setOrderNum] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.order) setOrderNum(data.order.orderNumber);
      })
      .catch(err => console.error("Error fetching order:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16 px-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-border">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-heading font-black text-foreground mb-2">Order Received!</h1>
        <p className="text-muted-foreground font-subheading mb-6">
          Thank you for choosing Mummy Food Hub. We have received your order and are waiting for confirmation from the kitchen.
        </p>

        {orderNum && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Your Order Number</p>
            <p className="text-2xl font-black text-foreground font-heading">{orderNum}</p>
          </div>
        )}

        <div className="space-y-3">
          <Link 
            href={`/account/orders/${id}`}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group"
          >
            Track Your Order <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/menu"
            className="w-full bg-white border border-border text-foreground font-bold py-4 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
             Return to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
