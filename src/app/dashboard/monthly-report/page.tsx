"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, Calendar, Download, RefreshCw,
  Utensils, CheckCircle2, AlertTriangle, XCircle, Info, ChevronLeft, ChevronRight, PieChart
} from "lucide-react";
import toast from "react-hot-toast";

type CategoryReport = {
  scheduled: number;
  total: number;
  consumed: number;
  skipped: number;
  transferred: number;
  remaining: number;
};

type MonthlyReport = {
  year: number;
  month: number;
  subscriptionId: string;
  planName: string;
  subscriptionPeriod: {
    startDate: string;
    endDate: string;
  };
  totalEligibleMeals: number;
  utilizationPercentage: number;
  breakfast?: CategoryReport;
  lunch?: CategoryReport;
  dinner?: CategoryReport;
  days: Array<{
    date: string;
    mealType: "lunch" | "dinner" | "breakfast";
    status: "upcoming" | "scheduled" | "available" | "delivered" | "consumed" | "skipped" | "transferred" | "missed" | "expired";
    menu?: string;
    note?: string;
  }>;
};

export default function MonthlyReportPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?year=${selectedYear}&month=${selectedMonth}`);
      const json = await res.json();
      if (json.report) {
        setReport(json.report);
      }
    } catch (e) {
      toast.error("Failed to load monthly report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReport();
    }
  }, [user, selectedYear, selectedMonth]);

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString("default", { month: "long" });

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Build calendar matrix for selected month
  const calendarDays = useMemo(() => {
    const totalDaysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const firstDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 = Sun

    const dayMap = new Map<string, MonthlyReport["days"]>();
    report?.days?.forEach((d) => {
      const existing = dayMap.get(d.date) || [];
      existing.push(d);
      dayMap.set(d.date, existing);
    });

    const daysArray = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      daysArray.push({ isPadding: true, dayNumber: 0, dateStr: "" });
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
      const records = dayMap.get(dateStr) || [];
      daysArray.push({
        isPadding: false,
        dayNumber: d,
        dateStr,
        records,
      });
    }

    return daysArray;
  }, [selectedYear, selectedMonth, report]);

  // Export CSV
  const handleExportCSV = () => {
    if (!report || !report.days || report.days.length === 0) {
      toast.error("No data available to export for this month.");
      return;
    }

    const headers = ["Date", "Meal Type", "Status", "Note", "Menu"];
    const rows = report.days.map((d) => [
      d.date,
      d.mealType,
      d.status,
      `"${(d.note || "").replace(/"/g, '""')}"`,
      `"${(d.menu || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mummy_food_hub_report_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Report Downloaded!");
  };

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* HEADER & MONTH SELECTOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-10 h-10 bg-white border border-border rounded-2xl flex items-center justify-center text-foreground hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-heading font-black text-foreground">Monthly Meal Report</h1>
              <p className="text-xs text-muted-foreground font-subheading">
                Comprehensive reporting starting from your activation date ({report?.subscriptionPeriod?.startDate || "Active"}).
              </p>
            </div>
          </div>

          {/* MONTH PICKER & CSV DOWNLOAD */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center bg-white border border-border rounded-2xl p-1 shadow-sm">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-50 rounded-xl text-foreground"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 text-xs font-bold font-subheading whitespace-nowrap">
                {monthName} {selectedYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-50 rounded-xl text-foreground"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-bold font-subheading flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* OVERALL PLAN UTILIZATION & ELIGIBLE MEALS BANNER */}
        {report && (
          <div className="bg-white rounded-3xl p-6 border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black font-subheading rounded-full uppercase">
                {report.planName}
              </span>
              <h3 className="text-xl font-heading font-black text-foreground mt-2">
                Plan Period: {new Date(report.subscriptionPeriod.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} → {new Date(report.subscriptionPeriod.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </h3>
              <p className="text-xs text-muted-foreground font-subheading mt-0.5">
                Monthly reports filter activity without resetting your ongoing subscription balance.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-subheading">Total Eligible Meals</p>
                <p className="text-2xl font-heading font-black text-foreground">{report.totalEligibleMeals}</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-subheading">Plan Utilization</p>
                <p className="text-2xl font-heading font-black text-primary">{report.utilizationPercentage}%</p>
              </div>
            </div>
          </div>
        )}

        {/* CATEGORY METRICS: BREAKFAST / LUNCH / DINNER BREAKDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {report?.breakfast && (
            <div className="bg-white rounded-3xl p-5 border border-border shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-heading font-black text-sm text-foreground">🥐 BREAKFAST</span>
                <span className="text-xs text-muted-foreground">Add-on</span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center text-xs">
                <div className="p-2 bg-gray-50 rounded-xl"><p className="text-[10px] text-muted-foreground">Sched.</p><p className="font-bold">{report.breakfast.scheduled}</p></div>
                <div className="p-2 bg-green-50 rounded-xl text-green-800"><p className="text-[10px]">Cons.</p><p className="font-bold">{report.breakfast.consumed}</p></div>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-800"><p className="text-[10px]">Skip</p><p className="font-bold">{report.breakfast.skipped}</p></div>
                <div className="p-2 bg-purple-50 rounded-xl text-purple-800"><p className="text-[10px]">Trans.</p><p className="font-bold">{report.breakfast.transferred}</p></div>
                <div className="p-2 bg-blue-50 rounded-xl text-blue-800"><p className="text-[10px]">Rem.</p><p className="font-bold">{report.breakfast.remaining}</p></div>
              </div>
            </div>
          )}

          {report?.lunch && (
            <div className="bg-white rounded-3xl p-5 border border-border shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-heading font-black text-sm text-foreground">🍱 LUNCH</span>
                <span className="text-xs text-muted-foreground">56 Days</span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center text-xs">
                <div className="p-2 bg-gray-50 rounded-xl"><p className="text-[10px] text-muted-foreground">Sched.</p><p className="font-bold">{report.lunch.scheduled}</p></div>
                <div className="p-2 bg-green-50 rounded-xl text-green-800"><p className="text-[10px]">Cons.</p><p className="font-bold">{report.lunch.consumed}</p></div>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-800"><p className="text-[10px]">Skip</p><p className="font-bold">{report.lunch.skipped}</p></div>
                <div className="p-2 bg-purple-50 rounded-xl text-purple-800"><p className="text-[10px]">Trans.</p><p className="font-bold">{report.lunch.transferred}</p></div>
                <div className="p-2 bg-blue-50 rounded-xl text-blue-800"><p className="text-[10px]">Rem.</p><p className="font-bold">{report.lunch.remaining}</p></div>
              </div>
            </div>
          )}

          {report?.dinner && (
            <div className="bg-white rounded-3xl p-5 border border-border shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="font-heading font-black text-sm text-foreground">🍽️ DINNER</span>
                <span className="text-xs text-muted-foreground">60 Days</span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center text-xs">
                <div className="p-2 bg-gray-50 rounded-xl"><p className="text-[10px] text-muted-foreground">Sched.</p><p className="font-bold">{report.dinner.scheduled}</p></div>
                <div className="p-2 bg-green-50 rounded-xl text-green-800"><p className="text-[10px]">Cons.</p><p className="font-bold">{report.dinner.consumed}</p></div>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-800"><p className="text-[10px]">Skip</p><p className="font-bold">{report.dinner.skipped}</p></div>
                <div className="p-2 bg-purple-50 rounded-xl text-purple-800"><p className="text-[10px]">Trans.</p><p className="font-bold">{report.dinner.transferred}</p></div>
                <div className="p-2 bg-blue-50 rounded-xl text-blue-800"><p className="text-[10px]">Rem.</p><p className="font-bold">{report.dinner.remaining}</p></div>
              </div>
            </div>
          )}
        </div>

        {/* CALENDAR GRID VIEW */}
        <div className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-heading font-bold text-foreground">
              {monthName} {selectedYear} Calendar View
            </h3>
            <span className="text-xs text-muted-foreground">
              🟢 Delivered • 🟡 Skipped • 🟣 Transferred • 🔵 Upcoming • 🔴 Missed
            </span>
          </div>

          {loading ? (
            <div className="text-center py-16 text-muted-foreground text-sm font-subheading">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              Loading calendar view...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {/* WEEKDAY HEADERS */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center py-2 text-xs font-bold text-muted-foreground font-subheading">
                  {day}
                </div>
              ))}

              {/* DAYS CELLS */}
              {calendarDays.map((c, i) => {
                if (c.isPadding) {
                  return <div key={`pad-${i}`} className="min-h-[85px] bg-gray-50/50 rounded-2xl border border-transparent" />;
                }

                const records = c.records || [];
                const hasRecords = records.length > 0;

                return (
                  <div
                    key={c.dateStr}
                    className={`min-h-[85px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                      hasRecords ? "bg-white border-border hover:border-gray-300" : "bg-gray-50/30 border-dashed border-border/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-subheading text-foreground">
                        {c.dayNumber}
                      </span>
                    </div>

                    <div className="space-y-1 mt-1">
                      {records.map((rec, idx) => {
                        let badgeClass = "bg-blue-100 text-blue-800";
                        let label = rec.mealType === "dinner" ? "Dinner" : rec.mealType === "breakfast" ? "B'fast" : "Lunch";

                        if (rec.status === "delivered" || rec.status === "consumed") {
                          badgeClass = "bg-green-100 text-green-800";
                        } else if (rec.status === "skipped") {
                          badgeClass = "bg-amber-100 text-amber-900";
                          label += " (Skip)";
                        } else if (rec.status === "transferred") {
                          badgeClass = "bg-purple-100 text-purple-900";
                          label += " (Shift)";
                        } else if (rec.status === "missed") {
                          badgeClass = "bg-red-100 text-red-900";
                          label += " (Miss)";
                        }

                        return (
                          <div
                            key={idx}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-tight text-center truncate ${badgeClass}`}
                            title={`${rec.mealType}: ${rec.status} ${rec.note ? `(${rec.note})` : ""}`}
                          >
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
