"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft, Calendar, Download, RefreshCw,
  Utensils, CheckCircle2, AlertTriangle, XCircle, Info, ChevronLeft, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

type MonthlyReport = {
  year: number;
  month: number;
  subscriptionId: string;
  planName: string;
  mealType: "lunch" | "dinner" | "both";
  totalScheduled: number;
  delivered: number;
  consumed: number;
  skipped: number;
  missed: number;
  upcoming: number;
  remainingBalance: number;
  days: Array<{
    date: string;
    mealType: "lunch" | "dinner";
    status: "upcoming" | "scheduled" | "delivered" | "consumed" | "skipped" | "missed" | "expired";
    menu?: string;
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

    const dayMap = new Map<string, MonthlyReport["days"][0]>();
    report?.days?.forEach((d) => {
      dayMap.set(d.date, d);
    });

    const daysArray = [];
    // Padding before 1st of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      daysArray.push({ isPadding: true, dayNumber: 0, dateStr: "" });
    }

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
      const record = dayMap.get(dateStr);
      daysArray.push({
        isPadding: false,
        dayNumber: d,
        dateStr,
        record,
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

    const headers = ["Date", "Meal Type", "Status", "Menu"];
    const rows = report.days.map((d) => [
      d.date,
      d.mealType,
      d.status,
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

  const consumedPercent = report?.totalScheduled ? Math.round((report.consumed / report.totalScheduled) * 100) : 0;
  const skippedPercent = report?.totalScheduled ? Math.round((report.skipped / report.totalScheduled) * 100) : 0;
  const missedPercent = report?.totalScheduled ? Math.round((report.missed / report.totalScheduled) * 100) : 0;

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
                Comprehensive calendar &amp; status metrics for your plan.
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

        {/* 5-GRID STATS SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
            <p className="text-[11px] text-muted-foreground font-subheading">Scheduled Meals</p>
            <p className="text-2xl font-heading font-bold text-foreground mt-1">
              {report?.totalScheduled || 0}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
            <p className="text-[11px] text-green-700 font-subheading">Delivered / Consumed</p>
            <p className="text-2xl font-heading font-bold text-green-700 mt-1">
              {report?.delivered || 0}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
            <p className="text-[11px] text-amber-600 font-subheading">Skipped (Saved)</p>
            <p className="text-2xl font-heading font-bold text-amber-600 mt-1">
              {report?.skipped || 0}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
            <p className="text-[11px] text-red-600 font-subheading">Missed</p>
            <p className="text-2xl font-heading font-bold text-red-600 mt-1">
              {report?.missed || 0}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-[#3D261D] to-[#251711] text-white p-4 rounded-2xl shadow-sm">
            <p className="text-[11px] text-white/70 font-subheading">Remaining Balance</p>
            <p className="text-2xl font-heading font-bold text-green-400 mt-1">
              {report?.remainingBalance || 0} <span className="text-xs font-normal text-white/80">Meals</span>
            </p>
          </div>
        </div>

        {/* STATUS DISTRIBUTION VISUAL CHART */}
        <div className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-4">
          <h3 className="text-sm font-heading font-bold text-foreground">Monthly Consumption Breakdown</h3>

          {report && report.totalScheduled > 0 ? (
            <div className="space-y-3">
              {/* STACKED BAR */}
              <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                {consumedPercent > 0 && (
                  <div
                    style={{ width: `${consumedPercent}%` }}
                    className="bg-green-500 h-full transition-all"
                    title={`Consumed: ${report.delivered} (${consumedPercent}%)`}
                  />
                )}
                {skippedPercent > 0 && (
                  <div
                    style={{ width: `${skippedPercent}%` }}
                    className="bg-amber-400 h-full transition-all"
                    title={`Skipped: ${report.skipped} (${skippedPercent}%)`}
                  />
                )}
                {missedPercent > 0 && (
                  <div
                    style={{ width: `${missedPercent}%` }}
                    className="bg-red-500 h-full transition-all"
                    title={`Missed: ${report.missed} (${missedPercent}%)`}
                  />
                )}
              </div>

              {/* LEGEND */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-subheading pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Consumed:</span>
                  <span className="font-bold text-foreground">{report.delivered} ({consumedPercent}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="text-muted-foreground">Skipped:</span>
                  <span className="font-bold text-foreground">{report.skipped} ({skippedPercent}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-muted-foreground">Missed:</span>
                  <span className="font-bold text-foreground">{report.missed} ({missedPercent}%)</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No meal schedule recorded for this month yet.</p>
          )}
        </div>

        {/* CALENDAR GRID VIEW */}
        <div className="bg-white rounded-3xl p-6 border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-heading font-bold text-foreground">
              {monthName} {selectedYear} Calendar View
            </h3>
            <span className="text-xs text-muted-foreground">
              🟢 Delivered • 🟡 Skipped • 🔵 Upcoming • 🔴 Missed
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
                  return <div key={`pad-${i}`} className="min-h-[80px] bg-gray-50/50 rounded-2xl border border-transparent" />;
                }

                const rec = c.record;
                let bgClass = "bg-white border-border hover:border-gray-300";
                let statusBadge = null;

                if (rec) {
                  if (rec.status === "delivered" || rec.status === "consumed") {
                    bgClass = "bg-green-50/60 border-green-200";
                    statusBadge = (
                      <span className="inline-block px-1.5 py-0.5 bg-green-200 text-green-800 rounded text-[10px] font-bold">
                        Delivered
                      </span>
                    );
                  } else if (rec.status === "skipped") {
                    bgClass = "bg-amber-50/70 border-amber-200";
                    statusBadge = (
                      <span className="inline-block px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] font-bold">
                        Skipped
                      </span>
                    );
                  } else if (rec.status === "missed") {
                    bgClass = "bg-red-50/70 border-red-200";
                    statusBadge = (
                      <span className="inline-block px-1.5 py-0.5 bg-red-200 text-red-900 rounded text-[10px] font-bold">
                        Missed
                      </span>
                    );
                  } else {
                    bgClass = "bg-blue-50/60 border-blue-200";
                    statusBadge = (
                      <span className="inline-block px-1.5 py-0.5 bg-blue-200 text-blue-900 rounded text-[10px] font-bold">
                        Upcoming
                      </span>
                    );
                  }
                }

                return (
                  <div
                    key={c.dateStr}
                    className={`min-h-[80px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${bgClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-subheading text-foreground">
                        {c.dayNumber}
                      </span>
                      {rec && (
                        <span className="text-[10px] font-extrabold text-muted-foreground uppercase">
                          {rec.mealType === "dinner" ? "D" : "L"}
                        </span>
                      )}
                    </div>

                    <div>{statusBadge}</div>
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
