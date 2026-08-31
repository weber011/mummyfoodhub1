"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, RefreshCw, Phone, MapPin, Calendar } from "lucide-react";
import toast from "react-hot-toast";

type SkippedMealItem = {
  id: string;
  customerName: string;
  customerPhone?: string;
  mealType: "lunch" | "dinner";
  scheduledDate: string;
  skipRequestedAt?: string;
  subscriptionId: string;
  planName: string;
  skipReason?: string;
  deliveryPreference?: string;
};

export function SkippedMealsTab({ creds }: { creds: { u: string; p: string } }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [skippedMeals, setSkippedMeals] = useState<SkippedMealItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSkips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/meals?date=${selectedDate}&status=skipped`, {
        headers: {
          Authorization: "Basic " + Buffer.from(`${creds.u}:${creds.p}`).toString("base64"),
        },
      });
      const json = await res.json();
      if (json.meals) {
        setSkippedMeals(json.meals);
      }
    } catch (e) {
      toast.error("Failed to load skipped meals.");
    } finally {
      setLoading(false);
    }
  }, [creds, selectedDate]);

  useEffect(() => {
    fetchSkips();
  }, [fetchSkips]);

  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" /> Today&apos;s Skipped Meals ({skippedMeals.length})
          </h2>
          <p className="text-xs text-muted-foreground font-subheading">
            Audit log of customers who skipped today&apos;s meal before the cutoff.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-border rounded-xl px-3 py-2 text-xs font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={fetchSkips}
            disabled={loading}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-foreground"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground text-sm font-subheading">
          <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" /> Loading skipped meals...
        </div>
      ) : skippedMeals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-gray-300" />
          <p className="font-bold text-foreground">No meals skipped for this date.</p>
          <p className="text-xs">All scheduled meals are expected to be prepared and delivered.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-subheading font-bold">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Meal Type</th>
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4">Skip Reason / Time</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-subheading">
              {skippedMeals.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-foreground">{m.customerName}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">{m.customerPhone || "—"}</td>
                  <td className="py-3.5 px-4 font-bold capitalize">
                    <span className={m.mealType === "dinner" ? "text-indigo-600" : "text-amber-700"}>
                      {m.mealType === "dinner" ? "🍽️ Dinner" : "🍱 Lunch"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-foreground">{m.planName}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    {m.skipReason ? (
                      <span className="text-foreground italic">&quot;{m.skipReason}&quot;</span>
                    ) : (
                      "No reason provided"
                    )}
                    {m.skipRequestedAt && (
                      <span className="block text-[10px] text-gray-400">
                        {new Date(m.skipRequestedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-full text-[11px]">
                      🟡 Not Prepared
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
