"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, Utensils, Calendar, Clock, CheckCircle2,
  AlertTriangle, XCircle, Filter, Download, Search, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

type MealRecord = {
  id: string;
  subscriptionId: string;
  mealType: "lunch" | "dinner";
  scheduledDate: string;
  menu?: string;
  status: "upcoming" | "scheduled" | "delivered" | "consumed" | "skipped" | "missed" | "expired";
  deliveryPreference?: "doorstep" | "gate";
  skipReason?: string;
};

export default function MealHistoryPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const fetchMeals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meals?limit=200");
      const json = await res.json();
      if (json.meals) {
        setMeals(json.meals);
      }
    } catch (e) {
      toast.error("Failed to load meal history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMeals();
    }
  }, [user]);

  const filteredMeals = useMemo(() => {
    return meals.filter((m) => {
      // Filter by status
      if (statusFilter !== "all") {
        if (statusFilter === "delivered" && m.status !== "delivered" && m.status !== "consumed") return false;
        if (statusFilter === "upcoming" && m.status !== "upcoming" && m.status !== "scheduled") return false;
        if (statusFilter === "skipped" && m.status !== "skipped") return false;
        if (statusFilter === "missed" && m.status !== "missed") return false;
      }
      // Filter by query (date or menu)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDate = m.scheduledDate.toLowerCase().includes(q);
        const matchesMenu = (m.menu || "").toLowerCase().includes(q);
        const matchesType = m.mealType.toLowerCase().includes(q);
        if (!matchesDate && !matchesMenu && !matchesType) return false;
      }
      return true;
    });
  }, [meals, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: meals.length,
      delivered: meals.filter((m) => m.status === "delivered" || m.status === "consumed").length,
      skipped: meals.filter((m) => m.status === "skipped").length,
      missed: meals.filter((m) => m.status === "missed").length,
      upcoming: meals.filter((m) => m.status === "upcoming" || m.status === "scheduled").length,
    };
  }, [meals]);

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-10 h-10 bg-white border border-border rounded-2xl flex items-center justify-center text-foreground hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-heading font-black text-foreground">Meal History</h1>
              <p className="text-xs text-muted-foreground font-subheading">
                Complete audit trail of delivered, skipped and upcoming meals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMeals}
              className="px-4 py-2.5 bg-white border border-border rounded-xl text-xs font-bold font-subheading hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
            <p className="text-[11px] text-muted-foreground font-subheading">Total Scheduled</p>
            <p className="text-xl font-heading font-bold text-foreground mt-1">{counts.all}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
            <p className="text-[11px] text-green-700 font-subheading">Delivered / Consumed</p>
            <p className="text-xl font-heading font-bold text-green-700 mt-1">{counts.delivered}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
            <p className="text-[11px] text-amber-600 font-subheading">Skipped (Saved)</p>
            <p className="text-xl font-heading font-bold text-amber-600 mt-1">{counts.skipped}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
            <p className="text-[11px] text-red-600 font-subheading">Missed</p>
            <p className="text-xl font-heading font-bold text-red-600 mt-1">{counts.missed}</p>
          </div>
        </div>

        {/* FILTER BAR & SEARCH */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-border shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* TABS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "all", label: `All (${counts.all})` },
                { id: "delivered", label: `Delivered (${counts.delivered})` },
                { id: "skipped", label: `Skipped (${counts.skipped})` },
                { id: "upcoming", label: `Upcoming (${counts.upcoming})` },
                { id: "missed", label: `Missed (${counts.missed})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold font-subheading transition-all whitespace-nowrap ${
                    statusFilter === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-gray-50 text-muted-foreground hover:bg-gray-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SEARCH */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search date or menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-border rounded-xl text-xs focus:outline-none focus:border-primary w-full sm:w-60"
              />
            </div>

          </div>

          {/* MEAL RECORDS LIST / TABLE */}
          {loading ? (
            <div className="text-center py-16 text-muted-foreground text-sm font-subheading">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              Loading meal history...
            </div>
          ) : filteredMeals.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-2">
              <Utensils className="w-8 h-8 mx-auto text-gray-300" />
              <p className="text-sm font-bold text-foreground">No meal records match this filter</p>
              <p className="text-xs">Try selecting a different filter or checking back later.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-subheading font-bold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Meal</th>
                    <th className="py-3 px-4">Menu Preparation</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-subheading">
                  {filteredMeals.map((m) => {
                    const dateObj = new Date(m.scheduledDate);
                    const formattedDate = dateObj.toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric", weekday: "short"
                    });

                    return (
                      <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-foreground whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="py-3.5 px-4 font-bold capitalize whitespace-nowrap">
                          <span className={m.mealType === "dinner" ? "text-indigo-600" : "text-amber-700"}>
                            {m.mealType === "dinner" ? "🍽️ Dinner" : "🍱 Lunch"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-foreground max-w-xs">
                          {m.menu || "Daily Special Homestyle Thali"}
                          {m.skipReason && (
                            <span className="block text-[10px] text-amber-700 italic mt-0.5">
                              Reason: &quot;{m.skipReason}&quot;
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {m.status === "delivered" || m.status === "consumed" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 text-[11px] font-bold rounded-full">
                              🟢 Delivered
                            </span>
                          ) : m.status === "skipped" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                              🟡 Skipped (Carried Forward)
                            </span>
                          ) : m.status === "missed" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 text-[11px] font-bold rounded-full">
                              🔴 Missed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">
                              🔵 Scheduled
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground capitalize whitespace-nowrap">
                          {m.status === "skipped" ? (
                            <span className="text-gray-400">Not Prepared</span>
                          ) : m.deliveryPreference === "doorstep" ? (
                            "🚪 Doorstep"
                          ) : (
                            "🏢 Gate"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
