"use client";

import { useState, useEffect, useCallback } from "react";
import { Utensils, RefreshCw, Download, Layers, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

type FoodPrepData = {
  date: string;
  lunch: {
    totalActive: number;
    skipped: number;
    mealsToPrep: number;
    meals: any[];
  };
  dinner: {
    totalActive: number;
    skipped: number;
    mealsToPrep: number;
    meals: any[];
  };
};

export function FoodPrepTab({ creds }: { creds: { u: string; p: string } }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState<FoodPrepData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/food-prep?date=${selectedDate}`, {
        headers: {
          Authorization: "Basic " + Buffer.from(`${creds.u}:${creds.p}`).toString("base64"),
        },
      });
      const json = await res.json();
      if (json.report) {
        setReport(json.report);
      }
    } catch (e) {
      toast.error("Failed to load food preparation report.");
    } finally {
      setLoading(false);
    }
  }, [creds, selectedDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = () => {
    if (!report) return;
    const csvRows = [
      ["Date", report.date],
      [],
      ["Service", "Active Subscribers", "Skipped Meals", "Final Meals To Prepare"],
      ["Lunch", report.lunch.totalActive, report.lunch.skipped, report.lunch.mealsToPrep],
      ["Dinner", report.dinner.totalActive, report.dinner.skipped, report.dinner.mealsToPrep],
      ["Total", report.lunch.totalActive + report.dinner.totalActive, report.lunch.skipped + report.dinner.skipped, report.lunch.mealsToPrep + report.dinner.mealsToPrep],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mummy_food_hub_prep_report_${report.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Food Prep Report Exported!");
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> Daily Food Preparation Report
          </h2>
          <p className="text-xs text-muted-foreground font-subheading">
            Live kitchen count for accurate lunch &amp; dinner portion cooking without food waste.
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
            onClick={fetchReport}
            disabled={loading}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-foreground"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold font-subheading flex items-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground text-sm font-subheading">
          <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" /> Calculating preparation metrics...
        </div>
      ) : !report ? (
        <p className="text-center text-muted-foreground py-10">No preparation data available.</p>
      ) : (
        <div className="space-y-6">
          
          {/* 2-COLUMN BIG METRIC CARDS (LUNCH & DINNER) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LUNCH CARD */}
            <div className="border border-amber-200 rounded-3xl p-6 bg-gradient-to-br from-amber-50/50 to-orange-50/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-200 text-amber-900 rounded-2xl flex items-center justify-center font-bold">
                    🍱
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-foreground">Lunch Requirement</h3>
                    <p className="text-xs text-muted-foreground">Preparation Time: 11:30 AM</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/60">
                <div className="bg-white p-3 rounded-2xl border border-amber-100 text-center">
                  <p className="text-[10px] text-muted-foreground font-subheading">Active Subs</p>
                  <p className="text-xl font-bold font-heading text-foreground mt-0.5">{report.lunch.totalActive}</p>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-amber-100 text-center">
                  <p className="text-[10px] text-amber-700 font-subheading">Skipped</p>
                  <p className="text-xl font-bold font-heading text-amber-700 mt-0.5">{report.lunch.skipped}</p>
                </div>
                <div className="bg-primary text-white p-3 rounded-2xl shadow-sm text-center">
                  <p className="text-[10px] text-white/80 font-subheading">To Cook</p>
                  <p className="text-xl font-black font-heading mt-0.5">{report.lunch.mealsToPrep}</p>
                </div>
              </div>

              <p className="text-xs text-amber-900 bg-white/70 p-3 rounded-xl border border-amber-100/60 text-center">
                👉 <strong>Portion Goal:</strong> Prepare exactly <strong>{report.lunch.mealsToPrep} thalis</strong> for Lunch service.
              </p>
            </div>

            {/* DINNER CARD */}
            <div className="border border-indigo-200 rounded-3xl p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-200 text-indigo-900 rounded-2xl flex items-center justify-center font-bold">
                    🍽️
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-foreground">Dinner Requirement</h3>
                    <p className="text-xs text-muted-foreground">Preparation Time: 6:30 PM</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-200/60">
                <div className="bg-white p-3 rounded-2xl border border-indigo-100 text-center">
                  <p className="text-[10px] text-muted-foreground font-subheading">Active Subs</p>
                  <p className="text-xl font-bold font-heading text-foreground mt-0.5">{report.dinner.totalActive}</p>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-indigo-100 text-center">
                  <p className="text-[10px] text-amber-700 font-subheading">Skipped</p>
                  <p className="text-xl font-bold font-heading text-amber-700 mt-0.5">{report.dinner.skipped}</p>
                </div>
                <div className="bg-indigo-700 text-white p-3 rounded-2xl shadow-sm text-center">
                  <p className="text-[10px] text-white/80 font-subheading">To Cook</p>
                  <p className="text-xl font-black font-heading mt-0.5">{report.dinner.mealsToPrep}</p>
                </div>
              </div>

              <p className="text-xs text-indigo-900 bg-white/70 p-3 rounded-xl border border-indigo-100/60 text-center">
                👉 <strong>Portion Goal:</strong> Prepare exactly <strong>{report.dinner.mealsToPrep} thalis</strong> for Dinner service.
              </p>
            </div>

          </div>

          {/* SUMMARY TABLE */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-border space-y-2">
            <h4 className="font-heading font-bold text-sm text-foreground">Combined Daily Total</h4>
            <div className="flex items-center justify-between text-xs font-subheading text-muted-foreground">
              <span>Total Meals across Lunch &amp; Dinner to Cook Today:</span>
              <span className="font-extrabold text-base text-primary">
                {report.lunch.mealsToPrep + report.dinner.mealsToPrep} Meals
              </span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
