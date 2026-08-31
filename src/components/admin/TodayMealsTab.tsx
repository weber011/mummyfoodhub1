"use client";

import { useState, useEffect, useCallback } from "react";
import { Utensils, Calendar, MapPin, CheckCircle2, Clock, XCircle, AlertTriangle, RefreshCw, Phone, Filter } from "lucide-react";
import toast from "react-hot-toast";

type AdminMeal = {
  id: string;
  subscriptionId: string;
  userId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  planName: string;
  mealType: "lunch" | "dinner";
  scheduledDate: string;
  menu?: string;
  status: "upcoming" | "scheduled" | "delivered" | "consumed" | "skipped" | "missed" | "expired";
  deliveryStatus?: string;
  deliveryPreference?: "doorstep" | "gate";
  address?: string;
  sector?: string;
  landmark?: string;
  deliveryInstructions?: string;
  skipReason?: string;
};

export function TodayMealsTab({ creds }: { creds: { u: string; p: string } }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [mealTypeFilter, setMealTypeFilter] = useState<"all" | "lunch" | "dinner">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prefFilter, setPrefFilter] = useState("all");
  const [meals, setMeals] = useState<AdminMeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set("date", selectedDate);
      if (mealTypeFilter !== "all") q.set("mealType", mealTypeFilter);
      if (statusFilter !== "all") q.set("status", statusFilter);
      if (prefFilter !== "all") q.set("preference", prefFilter);

      const res = await fetch(`/api/admin/meals?${q.toString()}`, {
        headers: {
          Authorization: "Basic " + Buffer.from(`${creds.u}:${creds.p}`).toString("base64"),
        },
      });
      const json = await res.json();
      if (json.meals) {
        setMeals(json.meals);
      }
    } catch (e) {
      toast.error("Failed to load today's meals.");
    } finally {
      setLoading(false);
    }
  }, [creds, selectedDate, mealTypeFilter, statusFilter, prefFilter]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const handleUpdateStatus = async (mealId: string, status: string) => {
    setActionLoadingId(mealId);
    try {
      const res = await fetch("/api/admin/meals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + Buffer.from(`${creds.u}:${creds.p}`).toString("base64"),
        },
        body: JSON.stringify({
          mealId,
          status,
          notifyCustomer: true,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Meal marked as ${status}!`);
        fetchMeals();
      } else {
        toast.error(json.error || "Failed to update meal status.");
      }
    } catch (e) {
      toast.error("Error updating status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const lunchMeals = meals.filter((m) => m.mealType === "lunch");
  const dinnerMeals = meals.filter((m) => m.mealType === "dinner");

  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
      
      {/* HEADER & DATE PICKER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" /> Daily Meal Deliveries ({meals.length})
          </h2>
          <p className="text-xs text-muted-foreground font-subheading">
            Live schedule of lunch and dinner meal dispatches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-border rounded-xl px-3 py-2 text-xs font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <button
            onClick={fetchMeals}
            disabled={loading}
            className="flex items-center gap-2 bg-primary/10 text-primary px-3.5 py-2 rounded-xl text-xs font-subheading font-bold hover:bg-primary/20 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Sync
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-subheading bg-gray-50 p-3 rounded-xl border border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-bold">Meal Type:</span>
          <select
            value={mealTypeFilter}
            onChange={(e) => setMealTypeFilter(e.target.value as any)}
            className="border border-border bg-white rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All (Lunch + Dinner)</option>
            <option value="lunch">Lunch Only</option>
            <option value="dinner">Dinner Only</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-bold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-border bg-white rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="delivered">Delivered</option>
            <option value="skipped">Skipped</option>
            <option value="missed">Missed</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-bold">Delivery:</span>
          <select
            value={prefFilter}
            onChange={(e) => setPrefFilter(e.target.value)}
            className="border border-border bg-white rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="all">All (Doorstep + Gate)</option>
            <option value="doorstep">🚪 Doorstep Only</option>
            <option value="gate">🏢 Gate Only</option>
          </select>
        </div>
      </div>

      {/* LIST OF MEALS */}
      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground text-sm font-subheading">
          <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" /> Loading meals...
        </div>
      ) : meals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <Utensils className="w-8 h-8 mx-auto text-gray-300" />
          <p className="font-bold text-foreground">No meals found for this date &amp; filter.</p>
          <p className="text-xs">Meal schedules generate automatically each morning via cron or upon subscription approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map((m) => {
            const isLunch = m.mealType === "lunch";
            const isLoadingAction = actionLoadingId === m.id;

            return (
              <div
                key={m.id}
                className="border border-border rounded-2xl p-4 sm:p-5 bg-gray-50/50 hover:bg-gray-50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-base text-foreground">
                      {m.customerName}
                    </span>
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        isLunch ? "bg-amber-100 text-amber-900" : "bg-indigo-100 text-indigo-900"
                      }`}
                    >
                      {isLunch ? "🍱 Lunch" : "🍽️ Dinner"}
                    </span>
                    <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-md">
                      {m.planName || "Subscription"}
                    </span>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-bold capitalize">
                      {m.deliveryPreference === "doorstep" ? "🚪 Doorstep" : "🏢 Gate"}
                    </span>

                    {/* STATUS PILL */}
                    {m.status === "delivered" || m.status === "consumed" ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                        🟢 Delivered
                      </span>
                    ) : m.status === "skipped" ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        🟡 Skipped
                      </span>
                    ) : m.status === "missed" ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                        🔴 Missed
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        🔵 Scheduled
                      </span>
                    )}
                  </div>

                  {m.customerPhone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3 text-primary" /> {m.customerPhone}
                    </p>
                  )}

                  {m.address && (
                    <p className="text-xs text-foreground/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary shrink-0" />
                      <span>{m.address} {m.sector ? `, Sector ${m.sector}` : ""}</span>
                    </p>
                  )}

                  {m.deliveryInstructions && (
                    <p className="text-[11px] text-amber-800 italic bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60 inline-block">
                      Note: &quot;{m.deliveryInstructions}&quot;
                    </p>
                  )}
                </div>

                {/* STATUS ACTIONS */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  {m.status !== "delivered" && m.status !== "consumed" && (
                    <button
                      onClick={() => handleUpdateStatus(m.id, "delivered")}
                      disabled={isLoadingAction}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold font-subheading flex items-center gap-1 shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
                    </button>
                  )}

                  {m.status !== "skipped" && (
                    <button
                      onClick={() => handleUpdateStatus(m.id, "skipped")}
                      disabled={isLoadingAction}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold font-subheading flex items-center gap-1 shadow-sm transition-all"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Mark Skipped
                    </button>
                  )}

                  {m.status !== "missed" && (
                    <button
                      onClick={() => handleUpdateStatus(m.id, "missed")}
                      disabled={isLoadingAction}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold font-subheading transition-colors"
                    >
                      Missed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
