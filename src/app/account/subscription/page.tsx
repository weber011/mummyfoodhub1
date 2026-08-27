"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Loader2, CreditCard, Calendar, Clock, CheckCircle } from "lucide-react";
import type { UserSubscription } from "@/lib/types";
import { getRemainingDays, getRemainingMeals } from "@/lib/subscriptions";

export default function SubscriptionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<UserSubscription | null>(null);
  const [history, setHistory] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetch("/api/subscriptions")
        .then(res => res.json())
        .then(data => {
          if (data.active) setActive(data.active);
          if (data.history) setHistory(data.history);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (isLoading || !user) return <div className="min-h-screen" />;

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8 mt-10">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/account" className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-border hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-foreground">My Subscription</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : active ? (
          <div className="bg-white rounded-3xl border-2 border-[#647545] p-8 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#647545] text-white px-4 py-1.5 rounded-bl-2xl text-xs font-bold uppercase tracking-wider">
              Active Plan
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-[#647545]/10 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-[#647545]" />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground">{active.planName}</h2>
                <p className="text-sm text-muted-foreground font-subheading mt-1">Enjoy fresh homemade meals daily.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Time Left</span>
                </div>
                <p className="text-2xl font-heading font-bold text-foreground">
                  {getRemainingDays(active.endDate)} <span className="text-sm font-subheading font-normal text-muted-foreground">days</span>
                </p>
              </div>

              {active.totalMeals && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Meals Left</span>
                  </div>
                  <p className="text-2xl font-heading font-bold text-foreground">
                    {getRemainingMeals(active)} <span className="text-sm font-subheading font-normal text-muted-foreground">of {active.totalMeals}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border flex items-center gap-3 text-sm font-subheading">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 flex justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Started</p>
                  <p className="font-bold text-foreground">{new Date(active.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Expires</p>
                  <p className="font-bold text-foreground">{new Date(active.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-border shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">No active subscription</h2>
            <p className="text-muted-foreground font-subheading mb-6">You don't have an active meal plan right now.</p>
            <Link href="/subscription" className="inline-block bg-[#647545] text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-[#56653b] transition-colors">
              View Monthly Plans
            </Link>
          </div>
        )}

        {history.length > (active ? 1 : 0) && (
          <div className="mt-12">
            <h3 className="font-heading font-bold text-lg mb-4">Previous Plans</h3>
            <div className="space-y-4">
              {history.filter(h => h.id !== active?.id).map(sub => (
                <div key={sub.id} className="bg-white rounded-2xl border border-border p-5 flex items-center justify-between opacity-80">
                  <div>
                    <h4 className="font-bold font-subheading text-foreground">{sub.planName}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(sub.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} - {new Date(sub.endDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase tracking-wider">
                    {sub.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
