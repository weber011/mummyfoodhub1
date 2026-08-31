"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, Loader2, CreditCard, Calendar, Clock, CheckCircle,
  MapPin, AlertCircle, Utensils, RefreshCw, XCircle, PauseCircle,
  Phone, MessageCircle, Headphones
} from "lucide-react";
import type { UserSubscription, SubscriptionDelivery } from "@/lib/types";
import { getRemainingDays, getRemainingMeals } from "@/lib/subscriptions";

export default function SubscriptionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<UserSubscription | null>(null);
  const [pendingReq, setPendingReq] = useState<any>(null);
  const [history, setHistory] = useState<UserSubscription[]>([]);
  const [deliveries, setDeliveries] = useState<SubscriptionDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch user's subscription & pending request
      const res = await fetch("/api/subscriptions");
      const subData = await res.json();
      if (subData.active) setActive(subData.active);
      if (subData.history) setHistory(subData.history);
      if (subData.pendingRequest && subData.pendingRequest.status === "pending") {
        setPendingReq(subData.pendingRequest);
      }

      // 2. Fetch delivery logs
      fetchDeliveries();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    setLoadingDeliveries(true);
    try {
      const res = await fetch("/api/account/subscription/delivery-log");
      const data = await res.json();
      if (data.deliveries) {
        setDeliveries(data.deliveries);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  if (isLoading || !user) return <div className="min-h-screen" />;

  const deliveredCount = deliveries.filter(d => d.status === "delivered").length;
  const skippedCount = deliveries.filter(d => d.status === "skipped").length;

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8 mt-10">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/account" className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-border hover:bg-gray-50 transition-colors shadow-sm">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Monthly Dashboard</h1>
              <p className="text-xs text-muted-foreground font-subheading">Manage your daily meals and delivery logs</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-border hover:bg-gray-50 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Pending Subscription Request Notice */}
            {pendingReq && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-heading font-bold text-lg text-amber-900">Subscription Request Under Review</h3>
                    <p className="text-sm text-amber-800 font-subheading mt-1">
                      We received your request for <strong>{pendingReq.planName} (₹{pendingReq.planPrice})</strong>. Our team is verifying your payment details and will activate your monthly plan shortly!
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 border border-amber-200 rounded-2xl p-4 text-xs space-y-1.5 text-amber-900">
                  <p><strong>Deliver to:</strong> {pendingReq.address}, Sector {pendingReq.sector} ({pendingReq.deliveryType})</p>
                  <p><strong>Preferred Time:</strong> {pendingReq.deliveryTime}</p>
                  {pendingReq.utr && <p><strong>UTR Ref:</strong> <span className="font-mono font-bold">{pendingReq.utr}</span></p>}
                </div>

                <a
                  href={`https://wa.me/917065665988?text=Hi!%20Checking%20status%20of%20my%20subscription%20request%20for%20${encodeURIComponent(pendingReq.planName)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-bold text-white bg-[#25D366] px-4 py-2 rounded-xl hover:bg-[#20b858] transition-colors"
                >
                  💬 Inquire on WhatsApp
                </a>
              </div>
            )}

            {/* Active Subscription Details */}
            {active ? (
              <div className="bg-white rounded-3xl border-2 border-primary/40 p-8 shadow-md relative overflow-hidden space-y-6">
                <div className="absolute top-0 right-0 bg-primary text-white px-5 py-1.5 rounded-bl-2xl text-xs font-bold uppercase tracking-wider">
                  Active Subscriber
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Utensils className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-foreground">{active.planName}</h2>
                    <p className="text-sm text-muted-foreground font-subheading mt-0.5">
                      10% discount automatically applied to all on-demand orders!
                    </p>
                  </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-border">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Days Left</span>
                    </div>
                    <p className="text-2xl font-heading font-bold text-foreground">
                      {getRemainingDays(active.endDate)}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 border border-border">
                    <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Delivered</span>
                    </div>
                    <p className="text-2xl font-heading font-bold text-emerald-700">
                      {deliveredCount}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 border border-border">
                    <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                      <PauseCircle className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Skipped</span>
                    </div>
                    <p className="text-2xl font-heading font-bold text-amber-700">
                      {skippedCount}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 border border-border">
                    <div className="flex items-center gap-1.5 text-primary mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Meals Left</span>
                    </div>
                    <p className="text-2xl font-heading font-bold text-primary">
                      {getRemainingMeals(active) ?? "Unlimited"}
                    </p>
                  </div>
                </div>

                {/* Delivery Information Box */}
                {(active.address || active.deliveryTime) && (
                  <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-xs space-y-1.5 text-foreground/80">
                    <p className="font-bold text-primary uppercase text-[11px] tracking-wider mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Registered Delivery Info
                    </p>
                    {active.address && <p><strong>Address:</strong> {active.address}, Sector {active.sector} ({active.deliveryType || "Office Gate"})</p>}
                    {active.landmark && <p><strong>Landmark:</strong> {active.landmark}</p>}
                    {active.deliveryTime && <p><strong>Daily Slot:</strong> {active.deliveryTime}</p>}
                    {active.notes && <p><strong>Notes:</strong> {active.notes}</p>}
                  </div>
                )}

                {/* Validity range */}
                <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-subheading">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Start Date</span>
                    <span className="font-bold text-foreground text-sm">
                      {new Date(active.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Expiry Date</span>
                    <span className="font-bold text-foreground text-sm">
                      {new Date(active.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* VIP Dashboard Button */}
                <div className="pt-2">
                  <Link
                    href="/dashboard"
                    className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-white font-bold font-subheading text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99]"
                  >
                    <Utensils className="w-4 h-4" /> Open Full VIP Customer Dashboard (Skip Meals &amp; Reports) →
                  </Link>
                </div>
              </div>
            ) : !pendingReq ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-border shadow-sm">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-2">No Active Subscription</h2>
                <p className="text-muted-foreground font-subheading mb-6 max-w-md mx-auto">
                  Subscribe to a monthly plan for healthy homemade meals delivered daily right to your doorstep.
                </p>
                <Link href="/subscription" className="inline-block bg-primary text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-primary/90 transition-colors">
                  Explore Monthly Plans →
                </Link>
              </div>
            ) : null}

            {/* ── DAILY DELIVERY LOG (MONTHLY DASHBOARD) ── */}
            {active && (
              <div className="bg-white rounded-3xl border border-border p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                      📅 Daily Delivery History
                    </h3>
                    <p className="text-xs text-muted-foreground font-subheading">
                      Logs entered by kitchen admin for your monthly meal deliveries
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {deliveries.length} entries
                  </span>
                </div>

                {loadingDeliveries ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : deliveries.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground text-sm border border-dashed border-border rounded-2xl">
                    <p>No delivery entries recorded yet for this billing cycle.</p>
                    <p className="text-xs mt-1 text-muted-foreground/70">Entries will show up here as your daily meals are prepared and delivered!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {deliveries.map((entry) => {
                      const isDelivered = entry.status === "delivered";
                      const isSkipped = entry.status === "skipped";
                      const isIssue = entry.status === "issue";

                      return (
                        <div key={entry.id} className="py-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isDelivered ? "bg-emerald-100 text-emerald-700" :
                              isSkipped ? "bg-amber-100 text-amber-700" :
                              isIssue ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {isDelivered && <CheckCircle className="w-5 h-5" />}
                              {isSkipped && <PauseCircle className="w-5 h-5" />}
                              {isIssue && <XCircle className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground">
                                {new Date(entry.date).toLocaleDateString("en-IN", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </p>
                              {entry.notes && (
                                <p className="text-xs text-muted-foreground font-subheading mt-0.5">
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              isDelivered ? "bg-emerald-100 text-emerald-800" :
                              isSkipped ? "bg-amber-100 text-amber-800" :
                              isIssue ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {entry.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="bg-muted/40 p-3.5 rounded-2xl text-xs text-muted-foreground font-subheading flex items-center justify-between">
                  <span>Need to skip a meal? Please inform at least 1 day in advance.</span>
                  <a
                    href="https://wa.me/917065665988?text=Hi!%20I%20would%20like%20to%20skip%20tomorrow%27s%20meal%20delivery."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-primary hover:underline ml-2"
                  >
                    WhatsApp Kitchen
                  </a>
                </div>
              </div>
            )}

            {/* ── SUBSCRIPTION SUPPORT & HELPLINE CARD ── */}
            <div className="bg-white rounded-3xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                    <Headphones className="w-3.5 h-3.5" /> Subscriber Helpline
                  </div>
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    Need Help or Have a Question?
                  </h3>
                  <p className="text-xs text-muted-foreground font-subheading">
                    Contact kitchen owner directly for meal pauses, address updates, or special dietary requirements.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <a
                    href="tel:+917065665988"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-white border border-border hover:bg-gray-50 text-foreground font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>Call: +91 70656 65988</span>
                  </a>

                  <a
                    href="https://wa.me/917065665988?text=Hi%20Mummy%20Food%20Hub!%20I%20am%20an%20active%20subscriber%20and%20have%20a%20query%20about%20my%20meal%20plan."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20b858] text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Previous Plans */}
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
          </>
        )}

      </div>
    </div>
  );
}
