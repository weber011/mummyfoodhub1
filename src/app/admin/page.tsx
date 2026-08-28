"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Save, Plus, Trash2, Edit2, ChevronDown, ChevronUp,
  Menu, Settings, ShoppingBag, Home, CreditCard, Phone, Eye, EyeOff,
  CheckCircle, AlertCircle, Loader2, ToggleLeft, ToggleRight, X, Upload, ImageIcon, Bell, Search, Filter,
  Calendar, MapPin, Clock, Send, Utensils, Check, UserPlus, ListOrdered, History, RefreshCw
} from "lucide-react";

const TABS = [
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "subrequests", label: "Sub Requests", icon: Bell },
  { id: "users", label: "Users", icon: Menu },
  { id: "customersubs", label: "Customer Subs", icon: CreditCard },
  { id: "coupons", label: "Coupons", icon: Settings },
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
  const [activeTab, setActiveTab] = useState("orders");
  const [data, setData] = useState<SiteData>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [creds, setCreds] = useState({ u: "", p: "" });

  // Upgraded states
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customerSubs, setCustomerSubs] = useState<any[]>([]);
  const [subRequests, setSubRequests] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [loadingSubRequests, setLoadingSubRequests] = useState(false);

  // Delivery & Offline Subs Management States
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [submittingOffline, setSubmittingOffline] = useState(false);
  const [offlineForm, setOfflineForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    planId: "plan-monthly-standard",
    planName: "Standard Thali Monthly",
    planPrice: 2799,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    totalMeals: 26,
    address: "",
    sector: "106",
    landmark: "",
    deliveryType: "Office Gate",
    deliveryTime: "Lunch (12:30 - 2 PM)",
    notes: ""
  });

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [submittingDelivery, setSubmittingDelivery] = useState(false);
  const [activeSubForDelivery, setActiveSubForDelivery] = useState<any>(null);
  const [deliveryForm, setDeliveryForm] = useState({
    date: new Date().toISOString().split("T")[0],
    status: "delivered",
    notes: "",
    notifyCustomer: true
  });

  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [deliveryLogsBySub, setDeliveryLogsBySub] = useState<Record<string, any[]>>({});
  const [loadingLogsSubId, setLoadingLogsSubId] = useState<string | null>(null);

  // Orders Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [newOrdersCount, setNewOrdersCount] = useState(0);

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

  const fetchOrders = useCallback(async (u: string, p: string, bg = false) => {
    if (!bg) setLoadingOrders(true);
    try {
      const q = new URLSearchParams();
      if (orderStatusFilter !== 'all') q.set('status', orderStatusFilter);
      if (orderSearch) q.set('search', orderSearch);

      const res = await fetch(`/api/admin/orders?${q.toString()}`, {
        headers: { 'Authorization': 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64') }
      });
      const json = await res.json();
      if (json.orders) {
        setOrders(json.orders);
        const pending = json.orders.filter((o: any) => o.status === 'pending').length;
        setNewOrdersCount(pending);
      }
    } catch {}
    if (!bg) setLoadingOrders(false);
  }, [orderStatusFilter, orderSearch]);

  const fetchSubRequests = useCallback(async (u: string, p: string) => {
    setLoadingSubRequests(true);
    try {
      const res = await fetch("/api/admin/subscription-requests", {
        headers: { 'Authorization': 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64') }
      });
      const json = await res.json();
      if (json.requests) setSubRequests(json.requests);
    } catch {}
    setLoadingSubRequests(false);
  }, []);

  const handleApproveOrder = async (orderId: string) => {
    if (!window.confirm("Approve this order and send confirmation email to customer?")) return;
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'Authorization': 'Basic ' + Buffer.from(`${creds.u}:${creds.p}`).toString('base64')
        },
        body: JSON.stringify({ orderId, action: 'approve' })
      });
      if (res.ok) {
        fetchOrders(creds.u, creds.p, true);
        alert("Order approved successfully!");
      }
    } catch (e) {
      alert("Failed to approve order.");
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'Authorization': 'Basic ' + Buffer.from(`${creds.u}:${creds.p}`).toString('base64')
        },
        body: JSON.stringify({ orderId, status: newStatus })
      });
    } catch (e) {
      alert("Failed to update status.");
    }
  };

  const handleApproveSubRequest = async (requestId: string) => {
    if (!window.confirm("Approve this subscription request and activate the customer's plan?")) return;
    try {
      const res = await fetch("/api/admin/subscription-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'Authorization': 'Basic ' + Buffer.from(`${creds.u}:${creds.p}`).toString('base64')
        },
        body: JSON.stringify({ requestId, action: 'approve' })
      });
      if (res.ok) {
        alert("Subscription activated successfully! Customer notified via email.");
        fetchSubRequests(creds.u, creds.p);
        fetchCustomerSubs(creds.u, creds.p);
      }
    } catch (e) {
      alert("Failed to approve subscription request.");
    }
  };

  const handleRejectSubRequest = async (requestId: string) => {
    if (!window.confirm("Reject this subscription request?")) return;
    try {
      const res = await fetch("/api/admin/subscription-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'Authorization': 'Basic ' + Buffer.from(`${creds.u}:${creds.p}`).toString('base64')
        },
        body: JSON.stringify({ requestId, action: 'reject' })
      });
      if (res.ok) {
        alert("Subscription request rejected.");
        fetchSubRequests(creds.u, creds.p);
      }
    } catch (e) {
      alert("Failed to reject subscription request.");
    }
  };

  const handleAddOfflineSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineForm.customerName || !offlineForm.customerPhone || !offlineForm.address) {
      alert("Please fill all required customer fields.");
      return;
    }
    setSubmittingOffline(true);
    try {
      const res = await fetch("/api/admin/subscriptions/offline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': 'Basic ' + Buffer.from(`${creds.u}:${creds.p}`).toString('base64')
        },
        body: JSON.stringify(offlineForm)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add offline subscriber");
      alert("Offline subscriber added successfully!");
      setShowOfflineModal(false);
      fetchCustomerSubs(creds.u, creds.p);
    } catch (err: any) {
      alert(err.message || "Error adding subscriber.");
    } finally {
      setSubmittingOffline(false);
    }
  };

  const handleLogDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubForDelivery) return;
    setSubmittingDelivery(true);
    try {
      const res = await fetch("/api/admin/subscriptions/delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': 'Basic ' + Buffer.from(`${creds.u}:${creds.p}`).toString('base64')
        },
        body: JSON.stringify({
          subscriptionId: activeSubForDelivery.id,
          userId: activeSubForDelivery.userId,
          date: deliveryForm.date,
          status: deliveryForm.status,
          notes: deliveryForm.notes,
          notifyCustomer: deliveryForm.notifyCustomer
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to log delivery");
      alert("Delivery logged successfully!");
      setShowDeliveryModal(false);
      fetchCustomerSubs(creds.u, creds.p);
      // Refresh logs for this subscription if expanded
      fetchSubDeliveryLogs(activeSubForDelivery.id);
    } catch (err: any) {
      alert(err.message || "Error logging delivery.");
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const fetchSubDeliveryLogs = async (subId: string) => {
    setLoadingLogsSubId(subId);
    try {
      const res = await fetch(`/api/admin/subscriptions/delivery?subscriptionId=${subId}`, {
        headers: { 'Authorization': 'Basic ' + Buffer.from(`${creds.u}:${creds.p}`).toString('base64') }
      });
      const json = await res.json();
      if (json.deliveries) {
        setDeliveryLogsBySub(prev => ({ ...prev, [subId]: json.deliveries }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogsSubId(null);
    }
  };

  const toggleSubDeliveryLogs = (subId: string) => {
    if (expandedSubId === subId) {
      setExpandedSubId(null);
    } else {
      setExpandedSubId(subId);
      if (!deliveryLogsBySub[subId]) {
        fetchSubDeliveryLogs(subId);
      }
    }
  };

  const fetchUsers = async (u: string, p: string) => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { 'Authorization': 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64') }
      });
      const json = await res.json();
      if (json.users) setUsers(json.users);
    } catch {}
    setLoadingUsers(false);
  };

  const fetchCustomerSubs = async (u: string, p: string) => {
    setLoadingSubs(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        headers: { 'Authorization': 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64') }
      });
      const json = await res.json();
      if (json.subscriptions) setCustomerSubs(json.subscriptions);
    } catch {}
    setLoadingSubs(false);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_auth");
    if (saved) {
      const { u, p } = JSON.parse(saved);
      setCreds({ u, p });
      setLoggedIn(true);
      loadData();
      fetchOrders(u, p);
      fetchUsers(u, p);
      fetchCustomerSubs(u, p);
      fetchSubRequests(u, p);
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
        fetchOrders(username, password);
        fetchUsers(username, password);
        fetchCustomerSubs(username, password);
        fetchSubRequests(username, password);
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
      // Update menuDate to current date in IST when saving
      const istDateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const currentData = {
        ...data,
        settings: {
          ...data.settings,
          menuDate: istDateStr
        }
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", data: currentData, username: creds.u, password: creds.p }),
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
                <button type="button" onClick={() => setShowPass(!showPass)}
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
              {tab.id === 'orders' && newOrdersCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold">{newOrdersCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

            {/* ── UPGRADED ORDERS TAB ── */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-2xl border border-border shadow-sm">
                <div className="p-6 border-b border-border">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
                      📦 Order Management 
                      {newOrdersCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">🔔 {newOrdersCount} New</span>}
                    </h2>
                    <button onClick={() => fetchOrders(creds.u, creds.p)} className="text-primary text-sm font-bold hover:underline">Refresh</button>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input 
                        type="text" 
                        placeholder="Search order number, name, phone..." 
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        onBlur={() => fetchOrders(creds.u, creds.p)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchOrders(creds.u, creds.p)}
                      />
                    </div>
                    <div className="w-48 relative">
                      <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <select 
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm appearance-none bg-white"
                        value={orderStatusFilter}
                        onChange={(e) => {
                          setOrderStatusFilter(e.target.value);
                          setTimeout(() => fetchOrders(creds.u, creds.p), 50);
                        }}
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending Approval</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {loadingOrders ? (
                  <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="divide-y divide-border">
                    {orders.length === 0 ? <p className="text-center text-muted-foreground py-20">No orders found.</p> : null}
                    {orders.map(order => (
                      <div key={order.id} className={`p-6 hover:bg-gray-50 transition-colors ${order.status === 'pending' ? 'bg-yellow-50/30' : ''}`}>
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-lg font-heading">{order.orderNumber || `Order #${order.id.slice(-8).toUpperCase()}`}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                order.status === 'preparing' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                order.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                order.status === 'delivered' ? 'bg-green-100 text-green-700 border border-green-200' :
                                'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {order.status === 'pending' ? 'Pending Approval' : order.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                              <div>
                                <p className="text-muted-foreground text-xs font-bold uppercase mb-1">Customer</p>
                                <p className="font-medium text-foreground">{order.customerName}</p>
                                <p className="text-muted-foreground">{order.customerPhone} • {order.customerEmail}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs font-bold uppercase mb-1">Delivery Info</p>
                                <p className="font-medium text-foreground">{order.address}, Sector {order.sector}</p>
                                {order.landmark && <p className="text-muted-foreground">Landmark: {order.landmark}</p>}
                                <p className="text-muted-foreground">{order.deliveryType} • {order.deliveryTime}</p>
                              </div>
                            </div>

                            <div className="mt-4">
                              <p className="text-muted-foreground text-xs font-bold uppercase mb-1.5">Ordered Items & Selections</p>
                              <div className="bg-white border border-border rounded-xl p-3.5 w-full max-w-xl shadow-xs divide-y divide-border/60">
                                {(() => {
                                  const itemsList = Array.isArray(order.items)
                                    ? order.items
                                    : typeof order.items === 'string'
                                      ? (() => { try { return JSON.parse(order.items); } catch { return []; } })()
                                      : [];

                                  if (itemsList.length === 0) {
                                    return <p className="text-xs text-muted-foreground italic py-1">No items details found</p>;
                                  }

                                  return itemsList.map((i: any, idx: number) => {
                                    const extrasList = Array.isArray(i.extras) ? i.extras : [];
                                    const sabjis = extrasList.filter((e: any) => e.price === 0);
                                    const addons = extrasList.filter((e: any) => e.price > 0);

                                    return (
                                      <div key={idx} className="py-2 first:pt-0 last:pb-0">
                                        <div className="flex justify-between items-start text-sm">
                                          <span className="font-bold text-foreground">
                                            <span className="text-primary font-black mr-1">{i.quantity}×</span> {i.title}
                                          </span>
                                          <span className="font-bold text-foreground shrink-0 ml-3">₹{(i.price || 0) * (i.quantity || 1)}</span>
                                        </div>

                                        {/* Sabji choices */}
                                        {sabjis.length > 0 && (
                                          <div className="mt-1 flex flex-wrap gap-1">
                                            <span className="text-[11px] font-bold text-orange-800 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                                              🍛 Sabjis: {sabjis.map((s: any) => s.name).join(", ")}
                                            </span>
                                          </div>
                                        )}

                                        {/* Add-ons */}
                                        {addons.length > 0 && (
                                          <div className="mt-1 flex flex-wrap gap-1">
                                            {addons.map((a: any, aIdx: number) => (
                                              <span key={aIdx} className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                                + {a.name} (+₹{a.price})
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>

                            {/* Custom Form Fields */}
                            {order.customFields && Object.keys(order.customFields).length > 0 && (
                              <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1 w-full max-w-xl">
                                <p className="font-bold text-blue-900 uppercase tracking-wider">Custom Order Details</p>
                                {Object.entries(order.customFields).map(([key, val]) => (
                                  <p key={key} className="text-blue-950">
                                    <span className="font-semibold text-blue-800">{key}:</span> {String(val)}
                                  </p>
                                ))}
                              </div>
                            )}

                            {/* UTR / Transaction ID */}
                            {order.utr && (
                              <div className="mt-2 text-xs bg-purple-50 text-purple-900 p-2 rounded-lg border border-purple-200 inline-block font-mono">
                                <strong>UPI UTR / Ref:</strong> {order.utr}
                              </div>
                            )}

                            {order.notes && (
                              <div className="mt-3 text-sm bg-orange-50 text-orange-800 p-2.5 rounded-xl border border-orange-200 inline-block">
                                <strong>Notes / Instructions:</strong> {order.notes}
                              </div>
                            )}
                          </div>

                          <div className="md:w-64 flex flex-col md:items-end justify-between">
                            <div className="bg-gray-100 p-4 rounded-xl w-full text-sm">
                              <div className="flex justify-between mb-1"><span className="text-muted-foreground">Subtotal</span><span>₹{order.subtotal}</span></div>
                              <div className="flex justify-between mb-1"><span className="text-muted-foreground">Delivery</span><span>₹{order.deliveryCharge}</span></div>
                              {order.subscriptionDiscount > 0 && <div className="flex justify-between mb-1 text-green-600"><span className="text-muted-foreground">Sub. Discount</span><span>-₹{order.subscriptionDiscount}</span></div>}
                              {order.discount > 0 && <div className="flex justify-between mb-1 text-green-600"><span className="text-muted-foreground">Coupon</span><span>-₹{order.discount}</span></div>}
                              <div className="flex justify-between font-bold text-lg border-t border-gray-200 mt-2 pt-2 text-primary"><span>Total</span><span>₹{order.totalAmount}</span></div>
                              <div className="mt-2 text-xs text-center text-muted-foreground uppercase">{order.paymentMethod}</div>
                            </div>

                            <div className="w-full mt-4 space-y-2">
                              {order.status === 'pending' ? (
                                <button onClick={() => handleApproveOrder(order.id)} className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                  <CheckCircle className="w-5 h-5" /> APPROVE ORDER
                                </button>
                              ) : (
                                <div>
                                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Update Status</label>
                                  <select
                                    className="w-full border border-border rounded-xl p-3 text-sm font-bold bg-white"
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                  >
                                    <option value="confirmed">Confirmed</option>
                                    <option value="preparing">Preparing</option>
                                    <option value="out_for_delivery">Out for Delivery</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── SUBSCRIPTION REQUESTS TAB ── */}
            {activeTab === "subrequests" && (
              <div className="bg-white rounded-2xl border border-border shadow-sm">
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
                      🌟 Subscription Requests
                      {subRequests.filter(r => r.status === 'pending').length > 0 && (
                        <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          {subRequests.filter(r => r.status === 'pending').length} Pending
                        </span>
                      )}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Review customer subscription requests, verify payment/UTR, and activate their monthly plan.</p>
                  </div>
                  <button onClick={() => fetchSubRequests(creds.u, creds.p)} className="text-primary text-sm font-bold hover:underline">Refresh</button>
                </div>

                {loadingSubRequests ? (
                  <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : subRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-20">No subscription requests yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {subRequests.map(req => (
                      <div key={req.id} className={`p-6 hover:bg-gray-50 transition-colors ${req.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-heading font-bold text-lg text-foreground">{req.name}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                req.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                req.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-300' :
                                'bg-red-100 text-red-800 border border-red-300'
                              }`}>
                                {req.status}
                              </span>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">{req.email} • {req.phone}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
                              <div className="bg-white border border-border rounded-xl p-3 space-y-1">
                                <p className="font-bold text-primary uppercase text-[10px] tracking-wider">Plan Details</p>
                                <p className="font-bold text-foreground text-sm">{req.planName} — ₹{req.planPrice}</p>
                                <p className="text-muted-foreground">Requested on {new Date(req.createdAt).toLocaleDateString('en-IN')}</p>
                              </div>

                              <div className="bg-white border border-border rounded-xl p-3 space-y-1">
                                <p className="font-bold text-primary uppercase text-[10px] tracking-wider">Delivery Details</p>
                                <p className="font-medium text-foreground">{req.address || "No address entered"}, Sector {req.sector}</p>
                                {req.landmark && <p className="text-muted-foreground">Landmark: {req.landmark}</p>}
                                <p className="text-muted-foreground">{req.deliveryType || "Office Gate"} • {req.deliveryTime || "Lunch"}</p>
                              </div>
                            </div>

                            {/* UTR / Transaction ID */}
                            {req.utr && (
                              <div className="mt-3 text-xs bg-purple-50 text-purple-900 p-2.5 rounded-xl border border-purple-200 inline-flex items-center gap-2">
                                <span className="font-bold">UPI UTR Ref:</span>
                                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-purple-300">{req.utr}</span>
                              </div>
                            )}

                            {req.notes && (
                              <div className="mt-2 text-xs bg-amber-50 text-amber-900 p-2 rounded-lg border border-amber-200 block max-w-xl">
                                <strong>Customer Notes:</strong> {req.notes}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col justify-center items-end gap-2 shrink-0">
                            {req.status === 'pending' ? (
                              <div className="space-y-2 w-full md:w-44">
                                <button
                                  onClick={() => handleApproveSubRequest(req.id)}
                                  className="w-full bg-primary text-white font-bold py-2.5 px-4 rounded-xl hover:bg-primary/90 shadow-md text-sm flex items-center justify-center gap-1.5"
                                >
                                  <CheckCircle className="w-4 h-4" /> Approve & Activate
                                </button>
                                <button
                                  onClick={() => handleRejectSubRequest(req.id)}
                                  className="w-full bg-gray-100 text-red-600 font-bold py-2 px-4 rounded-xl hover:bg-red-50 text-sm"
                                >
                                  Reject Request
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {req.status === 'approved' ? `Approved on ${new Date(req.approvedAt || req.createdAt).toLocaleDateString()}` : 'Rejected'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── USERS TAB ── */}
            {activeTab === "users" && (
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-bold text-foreground">👥 Customers</h2>
                  <button onClick={() => fetchUsers(creds.u, creds.p)} className="text-primary text-sm font-bold hover:underline">Refresh</button>
                </div>
                {loadingUsers ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="space-y-2">
                    {users.length === 0 ? <p className="text-center text-muted-foreground py-10">No users found.</p> : null}
                    {users.map(u => (
                      <div key={u.id} className="border border-border rounded-lg p-3 flex justify-between items-center bg-gray-50">
                        <div>
                          <p className="font-bold text-sm">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email} {u.phone ? `• ${u.phone}` : ''}</p>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <p>Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                          <p>{u.hasPlacedOrder ? "Has Ordered" : "No Orders"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── CUSTOMER SUBSCRIPTIONS TAB ── */}
            {activeTab === "customersubs" && (
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
                      💳 Customer Meal Subscriptions
                      <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full">
                        {customerSubs.length} Total
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 font-subheading">
                      Manage active plans, log daily deliveries, and add offline/cash subscribers
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowOfflineModal(true)}
                      className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-subheading font-bold hover:bg-primary/90 shadow-sm transition-colors"
                    >
                      <UserPlus className="w-4 h-4" /> Add Offline Subscriber
                    </button>
                    <button onClick={() => fetchCustomerSubs(creds.u, creds.p)} className="text-primary text-sm font-bold hover:underline">
                      Refresh
                    </button>
                  </div>
                </div>

                {loadingSubs ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="space-y-4">
                    {customerSubs.length === 0 ? <p className="text-center text-muted-foreground py-10">No subscriptions found.</p> : null}
                    {customerSubs.map(sub => {
                      const isExpanded = expandedSubId === sub.id;
                      const subLogs = deliveryLogsBySub[sub.id] || [];
                      const isLoadingLogs = loadingLogsSubId === sub.id;

                      return (
                        <div key={sub.id} className="border border-border rounded-2xl p-5 bg-gray-50 hover:bg-gray-50/80 transition-all space-y-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="font-heading font-bold text-base text-foreground">
                                  {sub.customerName || sub.planName}
                                </span>
                                <span className="font-bold text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                                  {sub.planName}
                                </span>
                                {sub.isOffline ? (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 uppercase">
                                    Offline / Cash
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200 uppercase">
                                    Online
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  sub.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {sub.status}
                                </span>
                              </div>

                              <p className="text-xs text-muted-foreground">
                                {sub.customerPhone ? <strong>{sub.customerPhone}</strong> : `User ID: ${sub.userId}`}
                                {sub.customerEmail ? ` • ${sub.customerEmail}` : ''}
                              </p>
                              
                              {sub.address && (
                                <p className="text-xs text-foreground/80 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                                  <span>{sub.address}, Sector {sub.sector} {sub.deliveryTime ? `(${sub.deliveryTime})` : ''}</span>
                                </p>
                              )}

                              <p className="text-[11px] text-muted-foreground">
                                <strong>Validity:</strong> {new Date(sub.startDate).toLocaleDateString("en-IN")} – {new Date(sub.endDate).toLocaleDateString("en-IN")}
                                {sub.totalMeals ? ` • ${sub.usedMeals || 0}/${sub.totalMeals} Meals Used` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                              <button
                                onClick={() => {
                                  setActiveSubForDelivery(sub);
                                  setDeliveryForm({
                                    date: new Date().toISOString().split("T")[0],
                                    status: "delivered",
                                    notes: "",
                                    notifyCustomer: Boolean(sub.customerEmail)
                                  });
                                  setShowDeliveryModal(true);
                                }}
                                className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <Utensils className="w-3.5 h-3.5" /> Log Daily Delivery
                              </button>

                              <button
                                onClick={() => toggleSubDeliveryLogs(sub.id)}
                                className="flex-1 md:flex-initial bg-white border border-border hover:bg-gray-100 text-foreground text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <History className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{isExpanded ? "Hide Logs" : "View Logs"}</span>
                              </button>
                            </div>
                          </div>

                          {/* Expanded Delivery Log History for this Subscriber */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-border/80 bg-white rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-foreground">
                                  Daily Delivery Log ({subLogs.length} entries)
                                </h4>
                                <button
                                  onClick={() => fetchSubDeliveryLogs(sub.id)}
                                  className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1"
                                >
                                  <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? "animate-spin" : ""}`} /> Refresh
                                </button>
                              </div>

                              {isLoadingLogs ? (
                                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                              ) : subLogs.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-2">No daily delivery entries recorded yet.</p>
                              ) : (
                                <div className="divide-y divide-border/60 max-h-56 overflow-y-auto">
                                  {subLogs.map((log: any) => (
                                    <div key={log.id} className="py-2 flex items-center justify-between text-xs">
                                      <div>
                                        <span className="font-bold text-foreground">
                                          {new Date(log.date).toLocaleDateString("en-IN", { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </span>
                                        {log.notes && <span className="text-muted-foreground ml-2">({log.notes})</span>}
                                      </div>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        log.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                        log.status === 'skipped' ? 'bg-amber-100 text-amber-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {log.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── COUPONS TAB ── */}
            {activeTab === "coupons" && (
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-heading font-bold text-foreground">🎟️ Coupons</h2>
                  <button onClick={() => {
                    const newCoupon = { id: `coupon-${Date.now()}`, code: "NEW10", type: "fixed", discountAmount: 10, minOrderValue: 100, isActive: true, usageCount: 0 };
                    setData((d: SiteData) => ({ ...d, coupons: [...(d.coupons || []), newCoupon] }));
                  }} className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-subheading font-bold hover:bg-primary/20 transition-colors">
                    <Plus className="w-4 h-4" /> Add Coupon
                  </button>
                </div>
                <div className="space-y-4">
                  {(data.coupons || []).map((coupon: any, idx: number) => (
                    <div key={coupon.id} className="border border-border rounded-xl p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                        <Field label="Code" value={coupon.code} onChange={v => updateArr("coupons", idx, "code", v, setData)} />
                        <div>
                          <label className="block text-xs font-subheading font-medium text-foreground mb-1">Type</label>
                          <select
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm font-subheading focus:outline-none"
                            value={coupon.type}
                            onChange={e => updateArr("coupons", idx, "type", e.target.value, setData)}
                          >
                            <option value="fixed">Fixed Amount (₹)</option>
                            <option value="percentage">Percentage (%)</option>
                          </select>
                        </div>
                        <Field label="Discount" value={String(coupon.discountAmount)} type="number" onChange={v => updateArr("coupons", idx, "discountAmount", Number(v), setData)} />
                        <Field label="Min Order Value (₹)" value={String(coupon.minOrderValue)} type="number" onChange={v => updateArr("coupons", idx, "minOrderValue", Number(v), setData)} />
                      </div>
                      <div className="flex items-center gap-4 justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-subheading">Active</span>
                          <button type='button' onClick={() => updateArr("coupons", idx, "isActive", !coupon.isActive, setData)}>
                            {coupon.isActive ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground font-subheading">Uses: {coupon.usageCount || 0}</span>
                          <button
                            onClick={() => setData((d: SiteData) => ({ ...d, coupons: d.coupons.filter((_: any, i: number) => i !== idx) }))}
                            className="flex items-center gap-1 text-red-500 text-xs font-subheading hover:underline"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── MENU TAB ── */}
            {activeTab === "menu" && (
              <div className="space-y-8">
                {(["yesterdayMenu", "todayMenu"] as const).map((dayKey) => (
                  <div key={dayKey} className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-heading font-bold text-foreground">
                        {dayKey === "yesterdayMenu" ? "📅 Yesterday's Menu" : "📅 Today's Menu"}
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
                <div className="space-y-6">
                  {/* Paneer Availability */}
                  <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                    <h2 className="text-xl font-heading font-bold text-foreground mb-6">Special Options</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Lunch Paneer */}
                      <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-heading font-bold text-foreground">Paneer (Lunch)</h3>
                            <p className="text-xs text-muted-foreground mt-1">Available for Lunch thalis (₹99)</p>
                          </div>
                          <button
                            onClick={() => setData((d: SiteData) => ({ ...d, settings: { ...d.settings, paneerAvailableLunch: !d.settings?.paneerAvailableLunch } }))}
                            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${data.settings?.paneerAvailableLunch ? 'bg-primary' : 'bg-gray-300'}`}
                          >
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${data.settings?.paneerAvailableLunch ? 'translate-x-6' : ''}`} />
                          </button>
                        </div>
                        {data.settings?.paneerAvailableLunch && (
                          <input 
                            type="text" 
                            placeholder="e.g. Shahi Paneer" 
                            value={data.settings?.paneerNameLunch || ""}
                            onChange={e => setData((d: SiteData) => ({ ...d, settings: { ...d.settings, paneerNameLunch: e.target.value } }))}
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                          />
                        )}
                      </div>
                      
                      {/* Dinner Paneer */}
                      <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-heading font-bold text-foreground">Paneer (Dinner)</h3>
                            <p className="text-xs text-muted-foreground mt-1">Available for Dinner thalis (₹99)</p>
                          </div>
                          <button
                            onClick={() => setData((d: SiteData) => ({ ...d, settings: { ...d.settings, paneerAvailableDinner: !d.settings?.paneerAvailableDinner } }))}
                            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${data.settings?.paneerAvailableDinner ? 'bg-primary' : 'bg-gray-300'}`}
                          >
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${data.settings?.paneerAvailableDinner ? 'translate-x-6' : ''}`} />
                          </button>
                        </div>
                        {data.settings?.paneerAvailableDinner && (
                          <input 
                            type="text" 
                            placeholder="e.g. Kadai Paneer" 
                            value={data.settings?.paneerNameDinner || ""}
                            onChange={e => setData((d: SiteData) => ({ ...d, settings: { ...d.settings, paneerNameDinner: e.target.value } }))}
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                          />
                        )}
                      </div>
                    </div>
                  </div>

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
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── ADD OFFLINE SUBSCRIBER MODAL ── */}
      <AnimatePresence>
        {showOfflineModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowOfflineModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
                <div>
                  <h3 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-primary" /> Add Offline Subscriber
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Manually register a cash-paying monthly customer</p>
                </div>
                <button onClick={() => setShowOfflineModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleAddOfflineSubscriber} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Sharma"
                      value={offlineForm.customerName}
                      onChange={e => setOfflineForm({ ...offlineForm, customerName: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Customer Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={offlineForm.customerPhone}
                      onChange={e => setOfflineForm({ ...offlineForm, customerPhone: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Email (Optional, sends welcome email)</label>
                  <input
                    type="email"
                    placeholder="e.g. customer@gmail.com"
                    value={offlineForm.customerEmail}
                    onChange={e => setOfflineForm({ ...offlineForm, customerEmail: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-foreground mb-1">Plan</label>
                    <select
                      value={offlineForm.planId}
                      onChange={e => {
                        const sel = (data?.subscriptionPlans || []).find((p: any) => p.id === e.target.value);
                        setOfflineForm({
                          ...offlineForm,
                          planId: e.target.value,
                          planName: sel?.name || e.target.value,
                          planPrice: sel?.price || offlineForm.planPrice
                        });
                      }}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
                    >
                      {(data?.subscriptionPlans || []).map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={offlineForm.planPrice}
                      onChange={e => setOfflineForm({ ...offlineForm, planPrice: Number(e.target.value) })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Start Date</label>
                    <input
                      type="date"
                      value={offlineForm.startDate}
                      onChange={e => setOfflineForm({ ...offlineForm, startDate: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">End Date</label>
                    <input
                      type="date"
                      value={offlineForm.endDate}
                      onChange={e => setOfflineForm({ ...offlineForm, endDate: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Total Meals</label>
                    <input
                      type="number"
                      value={offlineForm.totalMeals}
                      onChange={e => setOfflineForm({ ...offlineForm, totalMeals: Number(e.target.value) })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Building / Society Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tower 3, Flat 502, ATS Village"
                    value={offlineForm.address}
                    onChange={e => setOfflineForm({ ...offlineForm, address: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Sector *</label>
                    <select
                      value={offlineForm.sector}
                      onChange={e => setOfflineForm({ ...offlineForm, sector: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
                    >
                      <option value="106">Sector 106</option>
                      <option value="104">Sector 104</option>
                      <option value="107">Sector 107</option>
                      <option value="108">Sector 108</option>
                      <option value="82">Sector 82</option>
                      <option value="93">Sector 93</option>
                      <option value="133">Sector 133</option>
                      <option value="101">Sector 101</option>
                      <option value="135">Sector 135</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Deliver To</label>
                    <select
                      value={offlineForm.deliveryType}
                      onChange={e => setOfflineForm({ ...offlineForm, deliveryType: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
                    >
                      <option>Office Gate</option>
                      <option>Main Gate of House</option>
                      <option>Doorstep</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Preferred Time</label>
                    <select
                      value={offlineForm.deliveryTime}
                      onChange={e => setOfflineForm({ ...offlineForm, deliveryTime: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
                    >
                      <option>Lunch (12:30 - 2 PM)</option>
                      <option>Dinner (8:00 - 9:30 PM)</option>
                      <option>Morning (9 - 10 AM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Special Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Paid ₹2799 cash in person on 28 Aug"
                    value={offlineForm.notes}
                    onChange={e => setOfflineForm({ ...offlineForm, notes: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowOfflineModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingOffline}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-60"
                  >
                    {submittingOffline ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    <span>Save Subscriber</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LOG DAILY DELIVERY MODAL ── */}
      <AnimatePresence>
        {showDeliveryModal && activeSubForDelivery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowDeliveryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
                <div>
                  <h3 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-primary" /> Record Daily Delivery
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    For {activeSubForDelivery.customerName || activeSubForDelivery.planName}
                  </p>
                </div>
                <button onClick={() => setShowDeliveryModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleLogDelivery} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={deliveryForm.date}
                    onChange={e => setDeliveryForm({ ...deliveryForm, date: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Delivery Status</label>
                  <select
                    value={deliveryForm.status}
                    onChange={e => setDeliveryForm({ ...deliveryForm, status: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white font-bold"
                  >
                    <option value="delivered">✅ Delivered (Deducts 1 meal)</option>
                    <option value="skipped">⏸️ Skipped / Customer on leave</option>
                    <option value="issue">❌ Delivery Issue / Not delivered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Kitchen / Driver Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Delivered at 1:15 PM to guard / Customer requested skip"
                    value={deliveryForm.notes}
                    onChange={e => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                {activeSubForDelivery.customerEmail && (
                  <label className="flex items-center gap-2 pt-1 text-xs font-medium text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={deliveryForm.notifyCustomer}
                      onChange={e => setDeliveryForm({ ...deliveryForm, notifyCustomer: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <span>Email delivery update to {activeSubForDelivery.customerEmail}</span>
                  </label>
                )}

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowDeliveryModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDelivery}
                    className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary/90 flex items-center gap-2 disabled:opacity-60"
                  >
                    {submittingDelivery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Save Delivery Log</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
