"use client";

import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, Clock, MapPin, Bell } from "lucide-react";
import toast from "react-hot-toast";

type AdminSettingsData = {
  lunchTime: string;
  lunchSkipCutoff: string;
  dinnerTime: string;
  dinnerSkipCutoff: string;
  skipCutoffHours: number;
  deliveryRadius: string;
  mealReminderMinutesBefore: number;
  reminderEmailHour: number;
};

export function MealSettingsTab({ creds }: { creds: { u: string; p: string } }) {
  const [settings, setSettings] = useState<AdminSettingsData>({
    lunchTime: "13:00",
    lunchSkipCutoff: "09:00",
    dinnerTime: "20:00",
    dinnerSkipCutoff: "16:00",
    skipCutoffHours: 4,
    deliveryRadius: "5-7 km",
    mealReminderMinutesBefore: 120,
    reminderEmailHour: 8,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.settings) {
        setSettings(json.settings);
      }
    } catch (e) {
      toast.error("Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + Buffer.from(`${creds.u}:${creds.p}`).toString("base64"),
        },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("Meal operational settings saved successfully!");
      } else {
        toast.error(json.error || "Failed to save settings.");
      }
    } catch (e) {
      toast.error("Network error while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Subscription &amp; Meal Operations Configuration
          </h2>
          <p className="text-xs text-muted-foreground font-subheading">
            Configure meal schedule hours, cutoff deadlines, and automated notification triggers.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          disabled={loading}
          className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-foreground"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl font-subheading text-xs">
        
        {/* LUNCH TIMING SECTION */}
        <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-4">
          <h3 className="font-heading font-bold text-sm text-amber-900 flex items-center gap-2">
            🍱 Lunch Service Configuration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-foreground mb-1">
                Lunch Service Time (24h format):
              </label>
              <input
                type="text"
                value={settings.lunchTime}
                onChange={(e) => setSettings({ ...settings, lunchTime: e.target.value })}
                placeholder="13:00 (1:00 PM)"
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
              <p className="text-[10px] text-muted-foreground mt-1">e.g. 13:00 for 1:00 PM</p>
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">
                Lunch Skip Cutoff Time:
              </label>
              <input
                type="text"
                value={settings.lunchSkipCutoff}
                onChange={(e) => setSettings({ ...settings, lunchSkipCutoff: e.target.value })}
                placeholder="09:00 (9:00 AM)"
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
              <p className="text-[10px] text-muted-foreground mt-1">Default 09:00 (4 hours before lunch)</p>
            </div>
          </div>
        </div>

        {/* DINNER TIMING SECTION */}
        <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-200/60 space-y-4">
          <h3 className="font-heading font-bold text-sm text-indigo-900 flex items-center gap-2">
            🍽️ Dinner Service Configuration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-foreground mb-1">
                Dinner Service Time (24h format):
              </label>
              <input
                type="text"
                value={settings.dinnerTime}
                onChange={(e) => setSettings({ ...settings, dinnerTime: e.target.value })}
                placeholder="20:00 (8:00 PM)"
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
              <p className="text-[10px] text-muted-foreground mt-1">e.g. 20:00 for 8:00 PM</p>
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">
                Dinner Skip Cutoff Time:
              </label>
              <input
                type="text"
                value={settings.dinnerSkipCutoff}
                onChange={(e) => setSettings({ ...settings, dinnerSkipCutoff: e.target.value })}
                placeholder="16:00 (4:00 PM)"
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
              <p className="text-[10px] text-muted-foreground mt-1">Default 16:00 (4 hours before dinner)</p>
            </div>
          </div>
        </div>

        {/* GENERAL & DELIVERY RADIUS */}
        <div className="p-5 bg-gray-50 rounded-2xl border border-border space-y-4">
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
            📍 Delivery &amp; Notifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-foreground mb-1">
                Delivery Radius (from Sector 110 Noida):
              </label>
              <input
                type="text"
                value={settings.deliveryRadius}
                onChange={(e) => setSettings({ ...settings, deliveryRadius: e.target.value })}
                placeholder="5-7 km"
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">
                Morning Reminder Email Hour (IST):
              </label>
              <input
                type="number"
                value={settings.reminderEmailHour}
                onChange={(e) => setSettings({ ...settings, reminderEmailHour: Number(e.target.value) })}
                placeholder="8"
                min={5}
                max={11}
                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-[10px] text-muted-foreground mt-1">8 AM IST (before 9 AM cutoff)</p>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving Settings...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save Operational Settings
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
