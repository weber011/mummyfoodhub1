"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Utensils, Calendar, Clock, CheckCircle2, AlertCircle, XCircle,
  HelpCircle, ChevronRight, ShieldCheck, ArrowRight, Bell, Settings,
  MapPin, Sparkles, AlertTriangle, RefreshCw, Layers, FileText,
  UserCheck, Check, Info, PhoneCall, ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";

type DashboardData = {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    deliveryPreference?: "doorstep" | "gate";
  };
  greeting: string;
  todayDate: string;
  currentIstTime: string;
  subscriptions: Array<{
    id: string;
    planName: string;
    planPrice?: number;
    mealType?: "lunch" | "dinner" | "both";
    startDate: string;
    endDate: string;
    status: string;
    deliveryPreference?: "doorstep" | "gate";
    balance: {
      totalMeals: number;
      usedMeals: number;
      skippedMeals: number;
      remainingMeals: number;
      expiredMeals: number;
      daysRemaining: number;
      isValid: boolean;
      validityStartDate: string;
      validityEndDate: string;
    };
  }>;
  todaysMeals: Array<{
    id: string;
    subscriptionId: string;
    mealType: "lunch" | "dinner";
    scheduledDate: string;
    menu?: string;
    status: "upcoming" | "scheduled" | "delivered" | "consumed" | "skipped" | "missed" | "expired";
    deliveryPreference?: "doorstep" | "gate";
  }>;
  skipEligibility: {
    lunch: {
      allowed: boolean;
      minutesRemaining: number;
      cutoffTime: string;
      cutoffDisplay: string;
      mealTimeDisplay: string;
    };
    dinner: {
      allowed: boolean;
      minutesRemaining: number;
      cutoffTime: string;
      cutoffDisplay: string;
      mealTimeDisplay: string;
    };
  };
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
  }>;
};

export default function CustomerDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selected subscription for tabs if user has multiple
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);

  // Skip Modal state
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skipTargetMealType, setSkipTargetMealType] = useState<"lunch" | "dinner">("lunch");
  const [skipReason, setSkipReason] = useState("");
  const [skippingLoading, setSkippingLoading] = useState(false);

  // Delivery Preference Modal state
  const [prefModalOpen, setPrefModalOpen] = useState(false);
  const [newPref, setNewPref] = useState<"doorstep" | "gate">("gate");
  const [newInstructions, setNewInstructions] = useState("");
  const [savingPref, setSavingPref] = useState(false);

  // Auth Protection
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const loadDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch("/api/dashboard");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.error) {
        toast.error(json.error);
      } else {
        setData(json);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user, loadDashboard]);

  const activeSub = data?.subscriptions?.[selectedSubIndex] || data?.subscriptions?.[0] || null;

  // Determine today's meal for active sub
  const todaysMeal = useMemo(() => {
    if (!data?.todaysMeals || !activeSub) return null;
    return (
      data.todaysMeals.find(
        (m) => m.subscriptionId === activeSub.id || (m.mealType === activeSub.mealType && m.subscriptionId === activeSub.id)
      ) || data.todaysMeals[0] || null
    );
  }, [data, activeSub]);

  // Current meal type
  const currentMealType: "lunch" | "dinner" = activeSub?.mealType === "dinner" ? "dinner" : "lunch";
  const skipInfo = data?.skipEligibility?.[currentMealType];

  // Format countdown string
  const formatCountdown = (mins: number) => {
    if (mins <= 0) return "0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleSkipConfirm = async () => {
    if (!activeSub) return;
    setSkippingLoading(true);

    try {
      const res = await fetch("/api/meals/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: activeSub.id,
          mealType: skipTargetMealType,
          reason: skipReason,
          mealId: todaysMeal?.id,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        toast.error(json.error || "Could not skip meal.");
      } else {
        toast.success(json.message || "Meal skipped successfully! It will carry forward.", { duration: 5000 });
        setSkipModalOpen(false);
        setSkipReason("");
        // Reload dashboard data
        loadDashboard(true);
      }
    } catch (e) {
      toast.error("Network error while processing skip.");
    } finally {
      setSkippingLoading(false);
    }
  };

  const handleSavePreference = async () => {
    setSavingPref(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryPreference: newPref,
          deliveryInstructions: newInstructions,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        toast.error(json.error || "Failed to update delivery preference");
      } else {
        toast.success("Delivery preference updated for future meals!");
        setPrefModalOpen(false);
        loadDashboard(true);
      }
    } catch (e) {
      toast.error("Failed to save preferences.");
    } finally {
      setSavingPref(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="font-heading text-lg font-bold text-foreground">Loading Mummy Food Hub Dashboard...</p>
        <p className="text-xs text-muted-foreground mt-1">Har Bite Mein Maa Ka Pyaar ❤️</p>
      </div>
    );
  }

  const balance = activeSub?.balance;

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* TOP GREETING & QUICK STATUS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold font-subheading rounded-full uppercase tracking-wider">
                Mummy Food Hub VIP
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground">
              {data?.greeting || `Hello, ${user?.name} ❤️`}
            </h1>
            <p className="text-sm text-muted-foreground font-subheading">
              Simplicity is our identity — fresh homemade meals with less oil &amp; less masala.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="p-3 bg-muted hover:bg-muted/80 rounded-2xl text-foreground font-bold transition-all flex items-center gap-2 text-xs shadow-sm"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <Link
              href="/dashboard/monthly-report"
              className="px-4 py-3 bg-white border border-border hover:border-primary/50 rounded-2xl text-foreground font-bold text-xs font-subheading transition-all shadow-sm flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-primary" /> Monthly Report
            </Link>
            <Link
              href="/dashboard/meal-history"
              className="px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-xs font-subheading transition-all shadow-sm flex items-center gap-2"
            >
              <Layers className="w-4 h-4" /> Meal History
            </Link>
          </div>
        </div>

        {/* SUBSCRIPTION SELECTOR TABS (If user has multiple active subscriptions) */}
        {data?.subscriptions && data.subscriptions.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {data.subscriptions.map((sub, idx) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubIndex(idx)}
                className={`px-5 py-3 rounded-2xl font-subheading font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 shadow-sm ${
                  selectedSubIndex === idx
                    ? "bg-primary text-white"
                    : "bg-white text-foreground border border-border hover:bg-gray-50"
                }`}
              >
                <Utensils className="w-4 h-4" />
                {sub.planName}
                <span className="text-xs opacity-80">({sub.balance?.remainingMeals} left)</span>
              </button>
            ))}
          </div>
        )}

        {/* NO ACTIVE SUBSCRIPTION BANNER */}
        {(!data?.subscriptions || data.subscriptions.length === 0) && (
          <div className="bg-white rounded-3xl p-8 border border-border shadow-sm text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
              <Utensils className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground">No Active Meal Subscription Found</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Get wholesome homemade lunch or dinner delivered straight to your door or gate in Noida Sector 110 &amp; nearby areas.
            </p>
            <Link
              href="/subscription"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold font-subheading rounded-2xl transition-all shadow-md text-sm"
            >
              Explore 26-Meal Plans (₹2,099) <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* MAIN DASHBOARD GRID */}
        {activeSub && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: TODAY'S MEAL CARD & ACTIONS (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* TODAY'S MEAL CARD */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-sm space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs uppercase font-extrabold tracking-wider text-muted-foreground">
                        Today&apos;s Scheduled Meal
                      </span>
                      <h2 className="text-xl font-heading font-bold text-foreground">
                        {currentMealType === "dinner" ? "Dinner Service" : "Lunch Service"}
                      </h2>
                    </div>
                  </div>

                  {/* MEAL STATUS BADGE */}
                  <div>
                    {todaysMeal?.status === "delivered" || todaysMeal?.status === "consumed" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                        🟢 Delivered
                      </span>
                    ) : todaysMeal?.status === "skipped" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                        🟡 Skipped (Carried Forward)
                      </span>
                    ) : todaysMeal?.status === "missed" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                        🔴 Missed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                        🔵 Scheduled
                      </span>
                    )}
                  </div>
                </div>

                {/* TODAY'S MENU DISPLAY */}
                <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#EDE5DA] space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-bold font-subheading">
                    <span className="flex items-center gap-1.5 text-primary">
                      <Sparkles className="w-3.5 h-3.5" /> Fresh Homemade Preparation
                    </span>
                    <span>Expected: {skipInfo?.mealTimeDisplay || (currentMealType === "dinner" ? "8:00 PM" : "1:00 PM")}</span>
                  </div>
                  <p className="text-base sm:text-lg font-heading font-bold text-foreground">
                    {todaysMeal?.menu || "Dal Tadka + Seasonal Sabji + 4 Soft Butter Roti + Jeera Rice + Fresh Salad"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cooked with minimal oil and homemade masalas for daily healthy digestion.
                  </p>
                </div>

                {/* DELIVERY PREFERENCE INFO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-subheading">Delivery Preference</p>
                      <p className="text-sm font-bold text-foreground capitalize">
                        {activeSub.deliveryPreference === "doorstep" ? "🚪 Doorstep Delivery" : "🏢 Gate / Reception Delivery"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setNewPref(activeSub.deliveryPreference || "gate");
                      setPrefModalOpen(true);
                    }}
                    className="text-xs font-bold text-primary hover:underline self-start sm:self-auto font-subheading"
                  >
                    Change Preference
                  </button>
                </div>

                {/* SKIP BUTTON & CUTOFF COUNTDOWN SECTION */}
                <div className="pt-2 border-t border-border space-y-3">
                  {todaysMeal?.status === "skipped" ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm space-y-1">
                      <p className="font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        Today&apos;s meal has been skipped!
                      </p>
                      <p className="text-xs text-amber-800">
                        This meal was NOT deducted from your subscription. Your remaining balance is still {balance?.remainingMeals} meals.
                      </p>
                    </div>
                  ) : todaysMeal?.status === "delivered" || todaysMeal?.status === "consumed" ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-900 text-sm flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      <div>
                        <p className="font-bold">Meal Delivered Successfully</p>
                        <p className="text-xs text-green-800">Enjoy your homemade meal! Har Bite Mein Maa Ka Pyaar ❤️</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-subheading">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">Skip Cutoff Deadline:</span>
                          <span className="font-bold text-foreground">
                            {skipInfo?.cutoffDisplay || (currentMealType === "dinner" ? "4:00 PM" : "9:00 AM")}
                          </span>
                        </div>

                        <div>
                          {skipInfo?.allowed ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                              ⏳ Skip window closes in {formatCountdown(skipInfo.minutesRemaining)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                              🔒 Meal skip window closed for today
                            </span>
                          )}
                        </div>
                      </div>

                      {/* SKIP BUTTON */}
                      <button
                        onClick={() => {
                          setSkipTargetMealType(currentMealType);
                          setSkipModalOpen(true);
                        }}
                        disabled={!skipInfo?.allowed}
                        className={`w-full py-4 px-6 rounded-2xl font-bold font-subheading text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                          skipInfo?.allowed
                            ? "bg-white border-2 border-amber-400 text-amber-900 hover:bg-amber-50"
                            : "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Skip Today&apos;s {currentMealType === "dinner" ? "Dinner" : "Lunch"}
                      </button>

                      {!skipInfo?.allowed && (
                        <p className="text-[11px] text-center text-muted-foreground">
                          Skip requests are accepted up to 4 hours before meal preparation ({skipInfo?.cutoffDisplay || "9:00 AM"}).
                        </p>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* QUICK BENEFIT HIGHLIGHT */}
              <div className="bg-white rounded-3xl p-6 border border-border shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold shrink-0">
                    🔄
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Unused Meals Carry Forward</h4>
                    <p className="text-muted-foreground mt-0.5">Use your 26 meals anytime within your 56-day validity.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                    ❤️
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Less Oil &amp; Less Masala</h4>
                    <p className="text-muted-foreground mt-0.5">Cooked freshly like home with top-grade ingredients.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: SUBSCRIPTION SUMMARY CARD & BALANCE METRICS (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* PREMIUM SUBSCRIPTION CARD */}
              <div className="bg-gradient-to-br from-[#3D261D] to-[#251711] text-white rounded-3xl p-7 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-36 h-36 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-white/70 font-extrabold">
                      MY SUBSCRIPTION
                    </p>
                    <h3 className="text-xl font-heading font-bold text-white mt-1">
                      {activeSub.planName}
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold rounded-full">
                    ACTIVE
                  </span>
                </div>

                {/* PROGRESS BAR */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-white/80 font-subheading font-medium">
                    <span>Meals Consumed</span>
                    <span className="font-bold text-white">
                      {balance?.usedMeals || 0} / {balance?.totalMeals || 26} Meals Used
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-white/10 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round(((balance?.usedMeals || 0) / (balance?.totalMeals || 26)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 4-GRID BALANCE METRICS */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <p className="text-[11px] text-white/60 font-subheading">Meals Used</p>
                    <p className="text-2xl font-black font-heading text-white mt-1">
                      {balance?.usedMeals || 0}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">Consumed</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <p className="text-[11px] text-amber-300 font-subheading">Meals Skipped</p>
                    <p className="text-2xl font-black font-heading text-amber-300 mt-1">
                      {balance?.skippedMeals || 0}
                    </p>
                    <p className="text-[10px] text-amber-300/60 mt-0.5">Saved &amp; Available</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-primary/40">
                    <p className="text-[11px] text-green-300 font-subheading">Meals Remaining</p>
                    <p className="text-2xl font-black font-heading text-green-400 mt-1">
                      {balance?.remainingMeals || 0}
                    </p>
                    <p className="text-[10px] text-green-300/60 mt-0.5">Ready to Eat</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <p className="text-[11px] text-white/60 font-subheading">Validity Left</p>
                    <p className="text-2xl font-black font-heading text-white mt-1">
                      {balance?.daysRemaining || 0} <span className="text-xs font-normal">Days</span>
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      Until {new Date(activeSub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  </div>

                </div>

                {/* VALIDITY DATES */}
                <div className="flex items-center justify-between text-xs text-white/70 pt-2 border-t border-white/10 font-subheading">
                  <span>Start: {new Date(activeSub.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span>End: {new Date(activeSub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>

              </div>

              {/* QUICK LINKS CARD */}
              <div className="bg-white rounded-3xl border border-border shadow-sm p-6 space-y-3">
                <h4 className="font-heading font-bold text-foreground text-sm">Dashboard Quick Navigation</h4>
                
                <div className="space-y-2">
                  <Link
                    href="/dashboard/monthly-report"
                    className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground font-subheading">Monthly Meal Report</p>
                        <p className="text-[11px] text-muted-foreground">Interactive calendar &amp; status charts</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/dashboard/meal-history"
                    className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground font-subheading">Full Meal History</p>
                        <p className="text-[11px] text-muted-foreground">Complete logs of deliveries and skips</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/account/orders"
                    className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                        <Utensils className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground font-subheading">A La Carte Orders</p>
                        <p className="text-[11px] text-muted-foreground">View individual thali &amp; addon orders</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* CUSTOMER SUPPORT CONTACT */}
              <div className="bg-[#FAF7F2] rounded-3xl p-6 border border-[#EDE5DA] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground font-subheading">Need Meal Changes or Help?</p>
                  <p className="text-xs text-muted-foreground">Direct WhatsApp support: +91 70656 65988</p>
                </div>
                <a
                  href="https://wa.me/917065665988?text=Hello%20Mummy%20Food%20Hub,%20I%20have%20a%20question%20regarding%20my%20subscription"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 whitespace-nowrap"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* SKIP TODAY'S MEAL CONFIRMATION MODAL                      */}
      {/* ────────────────────────────────────────────────────────── */}
      {skipModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-bold text-foreground">
                    Skip Today&apos;s {skipTargetMealType === "dinner" ? "Dinner" : "Lunch"}?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSkipModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* HIGHLIGHTED PROMISE: MEAL WILL NOT BE DEDUCTED */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl space-y-1">
              <p className="text-xs font-bold text-green-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                You will NOT lose this meal!
              </p>
              <p className="text-xs text-green-800 leading-relaxed">
                It will remain available in your balance and carry forward to use anytime within your 56-day validity period.
              </p>
            </div>

            {/* SUMMARY DETAILS */}
            <div className="space-y-2 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled Menu:</span>
                <span className="font-bold text-foreground text-right max-w-[200px]">
                  {todaysMeal?.menu || "Standard Homemade Thali"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skip Cutoff Deadline:</span>
                <span className="font-bold text-foreground">
                  {skipInfo?.cutoffDisplay || (skipTargetMealType === "dinner" ? "4:00 PM" : "9:00 AM")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-bold text-primary">{balance?.remainingMeals} Meals Remaining</span>
              </div>
            </div>

            {/* OPTIONAL SKIP REASON */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground font-subheading">
                Reason for skipping (Optional):
              </label>
              <input
                type="text"
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="e.g. Eating out, fasting, travelling"
                className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
              />
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSkipModalOpen(false)}
                disabled={skippingLoading}
                className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-gray-50 text-foreground font-bold font-subheading text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSkipConfirm}
                disabled={skippingLoading}
                className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold font-subheading text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {skippingLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Skipping...
                  </>
                ) : (
                  "Confirm Skip"
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* DELIVERY PREFERENCE MODAL                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      {prefModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-heading font-bold text-foreground">
                Update Delivery Preferences
              </h3>
              <button
                onClick={() => setPrefModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Choose how you would like our delivery rider to handover your tiffin box. Changes apply to future meals.
            </p>

            <div className="space-y-3">
              {/* DOORSTEP OPTION */}
              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  newPref === "doorstep"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-white hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="pref"
                  checked={newPref === "doorstep"}
                  onChange={() => setNewPref("doorstep")}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-bold text-foreground">🚪 Doorstep Delivery</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Rider will come up to your flat / office room and ring the bell.
                  </p>
                </div>
              </label>

              {/* GATE OPTION */}
              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  newPref === "gate"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-white hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="pref"
                  checked={newPref === "gate"}
                  onChange={() => setNewPref("gate")}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-bold text-foreground">🏢 Gate / Reception Handover</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Rider will call upon arrival at the society gate / reception desk.
                  </p>
                </div>
              </label>
            </div>

            {/* SPECIAL INSTRUCTIONS */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground font-subheading">
                Special Delivery Instructions (e.g. Call before reaching gate):
              </label>
              <textarea
                value={newInstructions}
                onChange={(e) => setNewInstructions(e.target.value)}
                placeholder="e.g. Please call me when you reach the main gate."
                rows={2}
                className="w-full p-3 bg-gray-50 border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
              />
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPrefModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-border hover:bg-gray-50 text-foreground font-bold font-subheading text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePreference}
                disabled={savingPref}
                className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold font-subheading text-xs shadow-md flex items-center justify-center gap-2"
              >
                {savingPref ? "Saving..." : "Save Preference"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
