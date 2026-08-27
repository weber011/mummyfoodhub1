"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, Bell, CheckCircle, Package, AlertCircle } from "lucide-react";
import type { Notification } from "@/lib/types";

export default function NotificationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetch("/api/notifications")
        .then(res => res.json())
        .then(data => {
          if (data.notifications) setNotifications(data.notifications);
        })
        .finally(() => {
          setLoading(false);
          // Mark all as read after fetching
          fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
        });
    }
  }, [user]);

  if (isLoading || !user) return <div className="min-h-screen" />;

  const getIconForType = (type: string) => {
    switch (true) {
      case type.includes('order'): return <Package className="w-5 h-5 text-primary" />;
      case type.includes('subscription'): return <CheckCircle className="w-5 h-5 text-[#647545]" />;
      case type.includes('cancelled') || type.includes('expired'): return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-6 mt-10">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account" className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-border hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">Notifications</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-border shadow-sm">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">No notifications yet</h2>
            <p className="text-muted-foreground font-subheading mb-6">We'll notify you about orders and subscriptions here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`bg-white rounded-2xl border p-5 transition-all ${
                  !notif.read ? 'border-primary/30 shadow-md bg-primary/5' : 'border-border shadow-sm'
                }`}
              >
                <div className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center">
                      {getIconForType(notif.type)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-heading font-bold text-foreground">{notif.title}</h3>
                      <span className="text-xs text-muted-foreground font-subheading whitespace-nowrap ml-4">
                        {new Date(notif.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-subheading leading-relaxed mb-3">
                      {notif.message}
                    </p>
                    {notif.orderId && (
                      <Link 
                        href={`/account/orders/${notif.orderId}`}
                        className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View Order <ArrowLeft className="w-4 h-4 rotate-180" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
