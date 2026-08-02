"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Save, Plus, Trash2, Edit2, ChevronDown, ChevronUp,
  Menu, Settings, ShoppingBag, Home, CreditCard, Phone, Eye, EyeOff,
  CheckCircle, AlertCircle, Loader2, ToggleLeft, ToggleRight, X, Upload, ImageIcon
} from "lucide-react";

const TABS = [
  { id: "menu", label: "Daily Menu", icon: Menu },
  { id: "catalog", label: "Full Menu Catalog", icon: Menu },
  { id: "categories", label: "Categories", icon: Home },
  { id: "hero", label: "Hero Section", icon: Home },
  { id: "subscription", label: "Subscription Plans", icon: CreditCard },
  { id: "orderform", label: "Order Form", icon: ShoppingBag },
  { id: "settings", label: "Site Settings", icon: Settings },
];

type SiteData = any;

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");
  const [data, setData] = useState<SiteData>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [creds, setCreds] = useState({ u: "", p: "" });

  // Load data on mount
  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin");
      const json = await res.json();
      setData(json);
    } catch {
      setSaveMsg({ type: "error", text: "Failed to load site data." });
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_auth");
    if (saved) {
      const { u, p } = JSON.parse(saved);
      setCreds({ u, p });
      setLoggedIn(true);
      loadData();
    }
  }, [loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username, password }),
      });
      const json = await res.json();
      if (json.success) {
        sessionStorage.setItem("admin_auth", JSON.stringify({ u: username, p: password }));
        setCreds({ u: username, p: password });
        setLoggedIn(true);
        loadData();
      } else {
        setLoginError("Invalid username or password.");
      }
    } catch {
      setLoginError("Connection error. Please try again.");
    }
    setLoginLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", data, username: creds.u, password: creds.p }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveMsg({ type: "success", text: "Saved! Changes will be live in ~2 minutes." });
      } else {
        setSaveMsg({ type: "error", text: "Failed to save. Please try again." });
      }
    } catch {
      setSaveMsg({ type: "error", text: "Connection error." });
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(null), 5000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    setLoggedIn(false);
    setUsername("");
    setPassword("");
    setData(null);
  };

  // Login Screen
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-orange-100"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground font-subheading text-sm mt-1">Mummy Food Hub</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-subheading font-medium text-foreground mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full border border-border rounded-xl px-4 py-3 text-sm font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-subheading font-medium text-foreground mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30 pr-12"
                  required
                />
                <button type='button' type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {loginError && (
              <p className="text-red-500 text-sm font-subheading flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {loginError}
              </p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-primary text-white font-subheading font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loginLoading ? "Logging in..." : "Login to Dashboard"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">MF</span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-foreground text-sm">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground font-subheading">Mummy Food Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveMsg && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 text-sm font-subheading px-3 py-1.5 rounded-lg ${
                  saveMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {saveMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {saveMsg.text}
              </motion.div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-subheading font-bold hover:bg-primary/90 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button type='button' onClick={handleLogout} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-subheading px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-none pb-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-subheading font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {/* ── MENU TAB ── */}
            {activeTab === "menu" && (
              <div className="space-y-8">
                {(["todayMenu", "tomorrowMenu"] as const).map((dayKey) => (
                  <div key={dayKey} className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-heading font-bold text-foreground">
                        {dayKey === "todayMenu" ? "📅 Today's Menu" : "📆 Tomorrow's Menu"}
                      </h2>
                      <button
                        onClick={() => {
                          const newItem = { id: `${dayKey}-${Date.now()}`, title: "New Item", price: 100, image: "", badge: "", items: ["Item 1"], disabled: false };
                          setData((d: SiteData) => ({ ...d, [dayKey]: [...(d[dayKey] || []), newItem] }));
                        }}
                        className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-subheading font-bold hover:bg-primary/20 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Item
                      </button>
                    </div>
                    <div className="space-y-4">
                      {(data[dayKey] || []).map((item: any, idx: number) => (
                        <MenuItemEditor
                          key={item.id}
                          item={item}
                          creds={creds}
                          onChange={(updated: any) => {
                            setData((d: SiteData) => {
                              const arr = [...d[dayKey]];
                              arr[idx] = updated;
                              return { ...d, [dayKey]: arr };
                            });
                          }}
                          onDelete={() => {
                            setData((d: SiteData) => ({ ...d, [dayKey]: d[dayKey].filter((_: any, i: number) => i !== idx) }));
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── CATALOG TAB ── */}
            {activeTab === "catalog" && (
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-bold text-foreground">📚 Full Menu Catalog</h2>
                  <button
                    onClick={() => {
                      const newItem = { id: `item-${Date.now()}`, section: "veg-meals", subcategory: "", title: "New Item", price: 100, originalPrice: 0, discount: "", image: "", badge: "", items: ["Item 1"], extras: [], disabled: false };
                      setData((d: SiteData) => ({ ...d, allMenuItems: [...(d.allMenuItems || []), newItem] }));
                    }}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-subheading font-bold hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>
                <div className="space-y-8">
                  {["veg-meals", "food-combos", "mumma-chinese", "non-veg", "parathas", "diet-foods"].map(sectionKey => {
                    const sectionItems = (data.allMenuItems || []).filter((item: any) => item.section === sectionKey);
                    if (sectionItems.length === 0) return null;
                    return (
                      <div key={sectionKey} className="border border-border rounded-xl p-4">
                        <h3 className="font-heading font-bold text-foreground mb-4 capitalize bg-gray-100 px-3 py-2 rounded-lg">Section: {sectionKey.replace("-", " ")}</h3>
                        <div className="space-y-4">
                          {sectionItems.map((item: any) => {
                            const originalIdx = data.allMenuItems.findIndex((x: any) => x.id === item.id);
                            return (
                              <CatalogItemEditor
                                key={item.id}
                                item={item}
                                creds={creds}
                                onChange={(updated: any) => {
                                  setData((d: SiteData) => {
                                    const arr = [...d.allMenuItems];
                                    arr[originalIdx] = updated;
                                    return { ...d, allMenuItems: arr };
                                  });
                                }}
                                onDelete={() => {
                                  setData((d: SiteData) => ({ ...d, allMenuItems: d.allMenuItems.filter((_: any, i: number) => i !== originalIdx) }));
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── CATEGORIES TAB ── */}
            {activeTab === "categories" && (
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-bold text-foreground">🏠 Home Page Categories</h2>
                  <button
                    onClick={() => {
                      const newCat = { id: `cat-${Date.now()}`, title: "New Category", desc: "Description", href: "/menu", image: "", badge: "", disabled: false };
                      setData((d: SiteData) => ({ ...d, categories: [...(d.categories || []), newCat] }));
                    }}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-subheading font-bold hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Category
                  </button>
                </div>
                <div className="space-y-4">
                  {(data.categories || []).map((cat: any, idx: number) => (
                    <div key={cat.id} className="border border-border rounded-xl p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Field label="Title" value={cat.title} onChange={v => updateArr("categories", idx, "title", v, setData)} />
                        <Field label="Description" value={cat.desc} onChange={v => updateArr("categories", idx, "desc", v, setData)} />
                        <Field label="Link (href)" value={cat.href} onChange={v => updateArr("categories", idx, "href", v, setData)} />
                        <Field label="Image URL" value={cat.image} onChange={v => updateArr("categories", idx, "image", v, setData)} />
                        <Field label="Badge (optional)" value={cat.badge || ""} onChange={v => updateArr("categories", idx, "badge", v, setData)} />
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-subheading text-foreground">Coming Soon</span>
                          <button type='button' onClick={() => updateArr("categories", idx, "disabled", !cat.disabled, setData)}>
                            {cat.disabled
                              ? <ToggleRight className="w-8 h-8 text-primary" />
                              : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                          </button>
                          <span className={`text-xs font-subheading ${cat.disabled ? "text-primary font-bold" : "text-muted-foreground"}`}>
                            {cat.disabled ? "Coming Soon ON" : "Coming Soon OFF"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setData((d: SiteData) => ({ ...d, categories: d.categories.filter((_: any, i: number) => i !== idx) }))}
                        className="mt-3 flex items-center gap-1 text-red-500 text-xs font-subheading hover:underline"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── HERO TAB ── */}
            {activeTab === "hero" && (
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <h2 className="text-xl font-heading font-bold text-foreground mb-2">🏠 Hero Section</h2>
                <Field label="Main Headline" value={data.hero?.headline || ""} onChange={v => setData((d: SiteData) => ({ ...d, hero: { ...d.hero, headline: v } }))} />
                <Field label="Headline Highlight (coloured text)" value={data.hero?.headlineHighlight || ""} onChange={v => setData((d: SiteData) => ({ ...d, hero: { ...d.hero, headlineHighlight: v } }))} />
                <Field label="Tagline Line 1" value={data.hero?.tagline1 || ""} onChange={v => setData((d: SiteData) => ({ ...d, hero: { ...d.hero, tagline1: v } }))} />
                <Field label="Tagline Line 2" value={data.hero?.tagline2 || ""} onChange={v => setData((d: SiteData) => ({ ...d, hero: { ...d.hero, tagline2: v } }))} />
                <Field label="Tagline Line 3" value={data.hero?.tagline3 || ""} onChange={v => setData((d: SiteData) => ({ ...d, hero: { ...d.hero, tagline3: v } }))} />
                <Field label="Delivery Note (bottom text)" value={data.hero?.deliveryNote || ""} onChange={v => setData((d: SiteData) => ({ ...d, hero: { ...d.hero, deliveryNote: v } }))} />
              </div>
            )}

            {/* ── SUBSCRIPTION TAB ── */}
            {activeTab === "subscription" && (
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-bold text-foreground">💳 Subscription Plans</h2>
                  <button
                    onClick={() => {
                      const newPlan = { id: `plan-${Date.now()}`, name: "New Plan", price: 1000, duration: "Monthly", features: ["Feature 1"], recommended: false };
                      setData((d: SiteData) => ({ ...d, subscriptionPlans: [...(d.subscriptionPlans || []), newPlan] }));
                    }}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-subheading font-bold hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Plan
                  </button>
                </div>
                <div className="space-y-4">
                  {(data.subscriptionPlans || []).map((plan: any, idx: number) => (
                    <div key={plan.id} className="border border-border rounded-xl p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <Field label="Plan Name" value={plan.name} onChange={v => updateArr("subscriptionPlans", idx, "name", v, setData)} />
                        <Field label="Price (₹)" value={String(plan.price)} type="number" onChange={v => updateArr("subscriptionPlans", idx, "price", Number(v), setData)} />
                        <Field label="Duration (e.g. Monthly, 6 Meals)" value={plan.duration} onChange={v => updateArr("subscriptionPlans", idx, "duration", v, setData)} />
                        <Field label="Savings Badge (optional, e.g. ₹200)" value={plan.savings || ""} onChange={v => updateArr("subscriptionPlans", idx, "savings", v, setData)} />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-subheading font-medium text-foreground mb-2">Features (one per line)</label>
                        <textarea
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          rows={4}
                          value={(plan.features || []).join("\n")}
                          onChange={e => updateArr("subscriptionPlans", idx, "features", e.target.value.split("\n"), setData)}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-subheading">Recommended (Best Value badge)</span>
                          <button type='button' onClick={() => updateArr("subscriptionPlans", idx, "recommended", !plan.recommended, setData)}>
                            {plan.recommended ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                          </button>
                        </div>
                        <button
                          onClick={() => setData((d: SiteData) => ({ ...d, subscriptionPlans: d.subscriptionPlans.filter((_: any, i: number) => i !== idx) }))}
                          className="flex items-center gap-1 text-red-500 text-xs font-subheading hover:underline"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ORDER FORM TAB ── */}
            {activeTab === "orderform" && (
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
                <h2 className="text-xl font-heading font-bold text-foreground">📋 Order Form Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Form Title" value={data.orderForm?.title || ""} onChange={v => setData((d: SiteData) => ({ ...d, orderForm: { ...d.orderForm, title: v } }))} />
                  <Field label="Form Subtitle" value={data.orderForm?.subtitle || ""} onChange={v => setData((d: SiteData) => ({ ...d, orderForm: { ...d.orderForm, subtitle: v } }))} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-bold text-foreground">Form Fields</h3>
                    <button
                      onClick={() => {
                        const newField = { id: `field-${Date.now()}`, label: "New Field", type: "text", placeholder: "", required: false };
                        setData((d: SiteData) => ({ ...d, orderForm: { ...d.orderForm, fields: [...(d.orderForm?.fields || []), newField] } }));
                      }}
                      className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-subheading font-bold hover:bg-primary/20 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add Field
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(data.orderForm?.fields || []).map((field: any, idx: number) => (
                      <div key={field.id} className="border border-border rounded-xl p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
                          <Field label="Field Label" value={field.label} onChange={v => {
                            const fields = [...data.orderForm.fields];
                            fields[idx] = { ...fields[idx], label: v };
                            setData((d: SiteData) => ({ ...d, orderForm: { ...d.orderForm, fields } }));
                          }} />
                          <div>
                            <label className="block text-xs font-subheading font-medium text-foreground mb-1">Field Type</label>
                            <select
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm font-subheading focus:outline-none"
                              value={field.type}
                              onChange={e => {
                                const fields = [...data.orderForm.fields];
                                fields[idx] = { ...fields[idx], type: e.target.value };
                                setData((d: SiteData) => ({ ...d, orderForm: { ...d.orderForm, fields } }));
                              }}
                            >
                              <option value="text">Text</option>
                              <option value="tel">Phone</option>
                              <option value="email">Email</option>
                              <option value="textarea">Text Area</option>
                              <option value="select">Dropdown</option>
                            </select>
                          </div>
                          <Field label="Placeholder" value={field.placeholder || ""} onChange={v => {
                            const fields = [...data.orderForm.fields];
                            fields[idx] = { ...fields[idx], placeholder: v };
                            setData((d: SiteData) => ({ ...d, orderForm: { ...d.orderForm, fields } }));
                          }} />
                          <div className="flex items-end gap-3 pb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-subheading text-foreground">Required</span>
                              <button type='button' onClick={() => {
                                const fields = [...data.orderForm.fields];
                                fields[idx] = { ...fields[idx], required: !fields[idx].required };
                                setData((d: SiteData) => ({ ...d, orderForm: { ...d.orderForm, fields } }));
                              }}>
                                {field.required ? <ToggleRight className="w-6 h-6 text-primary" /> : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
                              </button>
                            </div>
                            <button type='button' onClick={() => {
                              const fields = data.orderForm.fields.filter((_: any, i: number) => i !== idx);
                              setData((d: SiteData) => ({ ...d, orderForm: { ...d.orderForm, fields } }));
                            }} className="text-red-500 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {field.type === "select" && (
                          <div>
                            <label className="block text-xs font-subheading font-medium text-foreground mb-1">Options (comma separated)</label>
                            <input
                              className="w-full border border-border rounded-lg px-3 py-2 text-sm font-subheading focus:outline-none"
                              value={(field.options || []).join(", ")}
                              onChange={e => {
                                const fields = [...data.orderForm.fields];
                                fields[idx] = { ...fields[idx], options: e.target.value.split(",").map((s: string) => s.trim()) };
                                setData((d: SiteData) => ({ ...d, orderForm: { ...d.orderForm, fields } }));
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── SETTINGS TAB ── */}
            {activeTab === "settings" && (
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
                <h2 className="text-xl font-heading font-bold text-foreground mb-2">⚙️ Site Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Phone Number (with country code, no +)" value={data.settings?.phone || ""} onChange={v => setData((d: SiteData) => ({ ...d, settings: { ...d.settings, phone: v } }))} />
                  <Field label="WhatsApp Number (with country code, no +)" value={data.settings?.whatsapp || ""} onChange={v => setData((d: SiteData) => ({ ...d, settings: { ...d.settings, whatsapp: v } }))} />
                  <Field label="Location / Address" value={data.settings?.location || ""} onChange={v => setData((d: SiteData) => ({ ...d, settings: { ...d.settings, location: v } }))} />
                  <Field label="Business Hours" value={data.settings?.hours || ""} onChange={v => setData((d: SiteData) => ({ ...d, settings: { ...d.settings, hours: v } }))} />
                  <Field label="Delivery Charge Range (e.g. ₹5 – ₹20)" value={data.settings?.deliveryRange || ""} onChange={v => setData((d: SiteData) => ({ ...d, settings: { ...d.settings, deliveryRange: v } }))} />
                  <Field label="Delivery Radius (e.g. 5-7 KM)" value={data.settings?.deliveryRadius || ""} onChange={v => setData((d: SiteData) => ({ ...d, settings: { ...d.settings, deliveryRadius: v } }))} />
                  <Field label="Service Areas (e.g. Sectors 106, 133, 135)" value={data.settings?.serviceAreas || ""} onChange={v => setData((d: SiteData) => ({ ...d, settings: { ...d.settings, serviceAreas: v } }))} />
                  <Field label="UPI ID (for online payments)" value={data.settings?.upiId || ""} onChange={v => setData((d: SiteData) => ({ ...d, settings: { ...d.settings, upiId: v } }))} />
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Reusable Field Component ──
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-subheading font-medium text-foreground mb-1">{label}</label>
      <input
        type={type}
        className="w-full border border-border rounded-lg px-3 py-2 text-sm font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// ── Image Upload Field ──
function ImageUploadField({ label, value, onChange, creds }: { label: string; value: string; onChange: (v: string) => void; creds: { u: string; p: string } }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/upload?username=${encodeURIComponent(creds.u)}&password=${encodeURIComponent(creds.p)}`, {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (json.success) {
        onChange(json.url);
      } else {
        setError(json.error || "Upload failed");
      }
    } catch {
      setError("Upload failed. Check connection.");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div>
      <label className="block text-xs font-subheading font-medium text-foreground mb-1">{label}</label>
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <input
            type="text"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={value}
            placeholder="Paste URL or upload photo →"
            onChange={e => onChange(e.target.value)}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        {value && (
          <img src={value} alt="preview" className="w-10 h-10 rounded-lg object-cover border border-border shrink-0" />
        )}
        <div className="shrink-0">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-2 rounded-lg text-xs font-subheading font-bold hover:bg-primary/20 transition-colors whitespace-nowrap"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Menu Item Editor ──
function MenuItemEditor({ item, onChange, onDelete, creds }: { item: any; onChange: (v: any) => void; onDelete: () => void; creds: { u: string; p: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          {item.image && <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" />}
          <div>
            <p className="font-subheading font-bold text-foreground text-sm">{item.title || "Untitled"}</p>
            <p className="text-xs text-muted-foreground font-subheading">₹{item.price} {item.disabled ? "• Coming Soon" : "• Active"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type='button' onClick={e => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-600 p-1">
            <Trash2 className="w-4 h-4" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Title" value={item.title} onChange={v => onChange({ ...item, title: v })} />
                <Field label="Price (₹)" value={String(item.price)} type="number" onChange={v => onChange({ ...item, price: Number(v) })} />
                <Field label="Badge (optional)" value={item.badge || ""} onChange={v => onChange({ ...item, badge: v })} />
              </div>
              <ImageUploadField label="Item Photo" value={item.image || ""} onChange={v => onChange({ ...item, image: v })} creds={creds} />
              <div>
                <label className="block text-xs font-subheading font-medium text-foreground mb-1">What&apos;s Included</label>
                <div className="space-y-2">
                  {(item.items || []).map((inc: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={inc}
                        onChange={(e) => {
                          const newItems = [...(item.items || [])];
                          newItems[idx] = e.target.value;
                          onChange({ ...item, items: newItems });
                        }}
                      />
                      <button type='button' onClick={() => {
                        const newItems = [...(item.items || [])];
                        newItems.splice(idx, 1);
                        onChange({ ...item, items: newItems });
                      }} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    </div>
                  ))}
                  <button type='button' onClick={() => onChange({ ...item, items: [...(item.items || []), ""] })} className="text-xs text-primary font-bold hover:underline">+ Add Item</button>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-subheading font-medium text-foreground mb-1">Sabji Options (User must select 2)</label>
                <div className="space-y-2">
                  {(item.sabjiOptions || []).map((opt: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...(item.sabjiOptions || [])];
                          newOpts[idx] = e.target.value;
                          onChange({ ...item, sabjiOptions: newOpts });
                        }}
                      />
                      <button type='button' onClick={() => {
                        const newOpts = [...(item.sabjiOptions || [])];
                        newOpts.splice(idx, 1);
                        onChange({ ...item, sabjiOptions: newOpts });
                      }} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    </div>
                  ))}
                  <button type='button' onClick={() => onChange({ ...item, sabjiOptions: [...(item.sabjiOptions || []), ""] })} className="text-xs text-primary font-bold hover:underline">+ Add Sabji Option</button>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-subheading font-medium text-foreground mb-1">Add-Ons / Extras</label>
                <div className="space-y-2">
                  {(item.extras || []).map((ext: any, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        className="flex-[2] border border-border rounded-lg px-3 py-1.5 text-sm font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Name (e.g. Butter Roti)"
                        value={ext.name}
                        onChange={(e) => {
                          const newExt = [...(item.extras || [])];
                          newExt[idx] = { ...newExt[idx], name: e.target.value };
                          onChange({ ...item, extras: newExt });
                        }}
                      />
                      <input
                        className="flex-1 min-w-[80px] border border-border rounded-lg px-3 py-1.5 text-sm font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Price"
                        type="number"
                        value={ext.price}
                        onChange={(e) => {
                          const newExt = [...(item.extras || [])];
                          newExt[idx] = { ...newExt[idx], price: Number(e.target.value) };
                          onChange({ ...item, extras: newExt });
                        }}
                      />
                      <button type='button' onClick={() => {
                        const newExt = [...(item.extras || [])];
                        newExt.splice(idx, 1);
                        onChange({ ...item, extras: newExt });
                      }} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    </div>
                  ))}
                  <button type='button' onClick={() => onChange({ ...item, extras: [...(item.extras || []), { name: "", price: 0 }] })} className="text-xs text-primary font-bold hover:underline">+ Add Extra</button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-subheading text-foreground">Coming Soon (disables ordering)</span>
                <button type='button' onClick={() => onChange({ ...item, disabled: !item.disabled })}>
                  {item.disabled ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                </button>
                <span className={`text-xs font-subheading ${item.disabled ? "text-primary font-bold" : "text-muted-foreground"}`}>
                  {item.disabled ? "Coming Soon" : "Active"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Catalog Item Editor ──
function CatalogItemEditor({ item, onChange, onDelete, creds }: { item: any; onChange: (v: any) => void; onDelete: () => void; creds: { u: string; p: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          {item.image && <img src={item.image} className="w-10 h-10 rounded-lg object-cover" alt="" />}
          <div>
            <p className="font-subheading font-bold text-foreground text-sm">{item.title || "Untitled"}</p>
            <p className="text-xs text-muted-foreground font-subheading">
              ₹{item.price} {item.originalPrice ? <span className="line-through text-gray-400">₹{item.originalPrice}</span> : null}
              {" "}{item.disabled ? "• Coming Soon" : "• Active"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type='button' onClick={e => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-600 p-1">
            <Trash2 className="w-4 h-4" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="Section (do not change)" value={item.section} onChange={v => onChange({ ...item, section: v })} />
                <Field label="Subcategory / Group Name" value={item.subcategory || ""} onChange={v => onChange({ ...item, subcategory: v })} />
                <Field label="Title" value={item.title} onChange={v => onChange({ ...item, title: v })} />
                <Field label="Price (₹)" value={String(item.price)} type="number" onChange={v => onChange({ ...item, price: Number(v) })} />
                <Field label="Original Price (₹)" value={String(item.originalPrice || "")} type="number" onChange={v => onChange({ ...item, originalPrice: Number(v) })} />
                <Field label="Discount (e.g. 15%)" value={item.discount || ""} onChange={v => onChange({ ...item, discount: v })} />
                <Field label="Badge (e.g. Bestseller)" value={item.badge || ""} onChange={v => onChange({ ...item, badge: v })} />
              </div>
              <ImageUploadField label="Item Photo" value={item.image || ""} onChange={v => onChange({ ...item, image: v })} creds={creds} />
              <div>
                <label className="block text-xs font-subheading font-medium text-foreground mb-1">What&apos;s Included</label>
                <div className="space-y-2">
                  {(item.items || []).map((inc: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={inc}
                        onChange={(e) => {
                          const newItems = [...(item.items || [])];
                          newItems[idx] = e.target.value;
                          onChange({ ...item, items: newItems });
                        }}
                      />
                      <button type='button' onClick={() => {
                        const newItems = [...(item.items || [])];
                        newItems.splice(idx, 1);
                        onChange({ ...item, items: newItems });
                      }} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    </div>
                  ))}
                  <button type='button' onClick={() => onChange({ ...item, items: [...(item.items || []), ""] })} className="text-xs text-primary font-bold hover:underline">+ Add Item</button>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-subheading font-medium text-foreground mb-1">Sabji Options (User must select 2)</label>
                <div className="space-y-2">
                  {(item.sabjiOptions || []).map((opt: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...(item.sabjiOptions || [])];
                          newOpts[idx] = e.target.value;
                          onChange({ ...item, sabjiOptions: newOpts });
                        }}
                      />
                      <button type='button' onClick={() => {
                        const newOpts = [...(item.sabjiOptions || [])];
                        newOpts.splice(idx, 1);
                        onChange({ ...item, sabjiOptions: newOpts });
                      }} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    </div>
                  ))}
                  <button type='button' onClick={() => onChange({ ...item, sabjiOptions: [...(item.sabjiOptions || []), ""] })} className="text-xs text-primary font-bold hover:underline">+ Add Sabji Option</button>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-subheading font-medium text-foreground mb-1">Add-Ons / Extras</label>
                <div className="space-y-2">
                  {(item.extras || []).map((ext: any, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        className="flex-[2] border border-border rounded-lg px-3 py-1.5 text-sm font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Name (e.g. Butter Roti)"
                        value={ext.name}
                        onChange={(e) => {
                          const newExt = [...(item.extras || [])];
                          newExt[idx] = { ...newExt[idx], name: e.target.value };
                          onChange({ ...item, extras: newExt });
                        }}
                      />
                      <input
                        className="flex-1 min-w-[80px] border border-border rounded-lg px-3 py-1.5 text-sm font-subheading focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Price"
                        type="number"
                        value={ext.price}
                        onChange={(e) => {
                          const newExt = [...(item.extras || [])];
                          newExt[idx] = { ...newExt[idx], price: Number(e.target.value) };
                          onChange({ ...item, extras: newExt });
                        }}
                      />
                      <button type='button' onClick={() => {
                        const newExt = [...(item.extras || [])];
                        newExt.splice(idx, 1);
                        onChange({ ...item, extras: newExt });
                      }} className="text-red-400 hover:text-red-600 px-2">✕</button>
                    </div>
                  ))}
                  <button type='button' onClick={() => onChange({ ...item, extras: [...(item.extras || []), { name: "", price: 0 }] })} className="text-xs text-primary font-bold hover:underline">+ Add Extra</button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm font-subheading text-foreground">Coming Soon (disables ordering)</span>
                <button type='button' onClick={() => onChange({ ...item, disabled: !item.disabled })}>
                  {item.disabled ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                </button>
                <span className={`text-xs font-subheading ${item.disabled ? "text-primary font-bold" : "text-muted-foreground"}`}>
                  {item.disabled ? "Coming Soon" : "Active"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helper ──
function updateArr(key: string, idx: number, field: string, value: any, setData: any) {
  setData((d: any) => {
    const arr = [...d[key]];
    arr[idx] = { ...arr[idx], [field]: value };
    return { ...d, [key]: arr };
  });
}
