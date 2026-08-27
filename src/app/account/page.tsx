"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, ShoppingBag, CreditCard, ChevronRight, User } from "lucide-react";

export default function AccountPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return <div className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8 mt-10">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-8 border border-border shadow-sm flex items-center gap-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
            <span className="text-3xl font-heading font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">{user.name}</h1>
            <p className="text-muted-foreground font-subheading text-sm">{user.email}</p>
            {user.phone && <p className="text-muted-foreground font-subheading text-sm mt-1">{user.phone}</p>}
          </div>
        </div>

        {/* Links */}
        <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden divide-y divide-border">
          <Link href="/account/orders" className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-foreground">My Orders</h2>
                <p className="text-xs text-muted-foreground font-subheading">View order history and status</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          <Link href="/account/subscription" className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#647545]/10 rounded-full flex items-center justify-center text-[#647545] group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-foreground">My Subscription</h2>
                <p className="text-xs text-muted-foreground font-subheading">Manage your meal plan</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>

          {user.role === 'admin' && (
            <Link href="/admin" className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 group-hover:scale-110 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-foreground">Admin Panel</h2>
                  <p className="text-xs text-muted-foreground font-subheading">Manage website settings</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-white rounded-2xl border border-border text-red-500 font-bold font-subheading hover:bg-red-50 transition-colors shadow-sm"
        >
          <LogOut className="w-5 h-5" /> Log Out
        </button>

      </div>
    </div>
  );
}
