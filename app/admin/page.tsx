"use client";

import React, { useState, useEffect, useCallback } from "react";

const BACKEND_BASE_URL = "http://127.0.0.1:8000/admin";

// SVG Icon Components (inline to avoid adding dependencies)
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
    </svg>
  ),
  City: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Station: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Corridor: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  Nearby: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Seasonal: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Import: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Audit: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  Delete: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [stats, setStats] = useState<any>({
    total_cities: 0,
    total_stations: 0,
    total_corridors: 0,
    total_nearby: 0,
    total_seasonal: 0,
    last_import_time: null
  });
  
  // States for CRUD listings
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  
  // Search & Filters
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [tierFilter, setTierFilter] = useState<string>("");
  
  // Dropdown list caches
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [stationsList, setStationsList] = useState<any[]>([]);
  const [statesList, setStatesList] = useState<string[]>([]);
  const [tiersList, setTiersList] = useState<string[]>([]);
  
  // CRUD Action Modals
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalError, setModalError] = useState<string>("");
  const [formFields, setFormFields] = useState<any>({});
  
  // File Upload Ingestion
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTarget, setUploadTarget] = useState<string>("cities");
  const [importReport, setImportReport] = useState<any>(null);
  
  // Core Stats Load
  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/stats`);
      const payload = await res.json();
      if (payload.success) {
        setStats(payload);
      }
    } catch (e) {
      console.error("Failed to load dashboard metrics", e);
    }
  };

  // Unique filters loader (states and tiers)
  const fetchCitiesFilters = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/cities/filters`);
      const payload = await res.json();
      if (payload.success) {
        setStatesList(payload.states || []);
        setTiersList(payload.tiers || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to load complete list of Cities for dropdown lists
  const fetchCitiesList = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/cities?limit=500`);
      const payload = await res.json();
      if (payload.success) {
        setCitiesList(payload.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch cities dropdown", e);
    }
  };

  // Helper to load complete list of Stations for mappings dropdown
  const fetchStationsList = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/stations?limit=500`);
      const payload = await res.json();
      if (payload.success) {
        setStationsList(payload.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch stations dropdown", e);
    }
  };

  // Centralized Listing Dispatcher
  const fetchData = useCallback(async () => {
    setLoading(true);
    let url = "";
    
    // Construct query parameters
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("limit", String(limit));
    if (search) params.append("search", search);
    if (sortBy) params.append("sort_by", sortBy);
    params.append("sort_order", sortOrder);
    
    if (activeTab === "cities") {
      url = `${BACKEND_BASE_URL}/cities`;
      if (stateFilter) params.append("state", stateFilter);
      if (tierFilter) params.append("tier", tierFilter);
    } else if (activeTab === "stations") {
      url = `${BACKEND_BASE_URL}/stations`;
      if (cityFilter) params.append("city_id", cityFilter);
    } else if (activeTab === "corridors") {
      url = `${BACKEND_BASE_URL}/corridors`;
    } else if (activeTab === "nearby") {
      url = `${BACKEND_BASE_URL}/nearby-mappings`;
    } else if (activeTab === "seasonal") {
      url = `${BACKEND_BASE_URL}/seasonal-demands`;
    } else if (activeTab === "audit") {
      url = `${BACKEND_BASE_URL}/audit-logs`;
      params.set("limit", "20"); // audits showing 20 rows
    } else if (activeTab === "dashboard") {
      // Home tab also fetches recent audit log entries
      url = `${BACKEND_BASE_URL}/audit-logs`;
      params.set("limit", "5");
    }

    try {
      if (url) {
        const res = await fetch(`${url}?${params.toString()}`);
        const payload = await res.json();
        if (payload.success) {
          setData(payload.data || []);
          setTotal(payload.total || 0);
        }
      }
    } catch (e) {
      console.error(`Error loading data for tab ${activeTab}`, e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, limit, search, sortBy, sortOrder, stateFilter, tierFilter, cityFilter]);

  // Handle Tab transitions
  useEffect(() => {
    setPage(1);
    setSearch("");
    setSortBy("");
    setSortOrder("asc");
    setCityFilter("");
    setStateFilter("");
    setTierFilter("");
    fetchStats();
    
    // Lazy caches for modals
    if (["stations", "corridors", "nearby"].includes(activeTab)) {
      fetchCitiesList();
    }
    if (activeTab === "nearby") {
      fetchStationsList();
    }
    if (activeTab === "cities") {
      fetchCitiesFilters();
    }
  }, [activeTab]);

  // List auto reload triggers
  useEffect(() => {
    if (activeTab !== "import") {
      fetchData();
    }
  }, [page, search, sortBy, sortOrder, stateFilter, tierFilter, cityFilter, fetchData]);

  // Form submission CRUD operations handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    
    let url = `${BACKEND_BASE_URL}/${activeTab}`;
    if (activeTab === "nearby") url = `${BACKEND_BASE_URL}/nearby-mappings`;
    if (activeTab === "seasonal") url = `${BACKEND_BASE_URL}/seasonal-demands`;
    
    const method = modalType === "add" ? "POST" : "PUT";
    if (modalType === "edit" && selectedItem) {
      url += `/${selectedItem.id}`;
    }

    try {
      // Align types before sending (Pydantic schemas are type-strict)
      const dataToSend = { ...formFields };
      
      // Coerce numeric types
      if ("latitude" in dataToSend) dataToSend.latitude = parseFloat(dataToSend.latitude) || 0.0;
      if ("longitude" in dataToSend) dataToSend.longitude = parseFloat(dataToSend.longitude) || 0.0;
      if ("importance_score" in dataToSend) dataToSend.importance_score = parseInt(dataToSend.importance_score) || 50;
      if ("city_id" in dataToSend) dataToSend.city_id = dataToSend.city_id ? parseInt(dataToSend.city_id) : null;
      if ("source_city_id" in dataToSend) dataToSend.source_city_id = parseInt(dataToSend.source_city_id) || null;
      if ("destination_city_id" in dataToSend) dataToSend.destination_city_id = parseInt(dataToSend.destination_city_id) || null;
      if ("station_id" in dataToSend) dataToSend.station_id = parseInt(dataToSend.station_id) || null;
      if ("distance_km" in dataToSend) dataToSend.distance_km = parseFloat(dataToSend.distance_km) || 0.0;
      
      if ("start_month" in dataToSend) dataToSend.start_month = parseInt(dataToSend.start_month) || 1;
      if ("start_day" in dataToSend) dataToSend.start_day = parseInt(dataToSend.start_day) || 1;
      if ("end_month" in dataToSend) dataToSend.end_month = parseInt(dataToSend.end_month) || 1;
      if ("end_day" in dataToSend) dataToSend.end_day = parseInt(dataToSend.end_day) || 1;
      if ("comfort_modifier" in dataToSend) dataToSend.comfort_modifier = parseInt(dataToSend.comfort_modifier) || 0;
      if ("crowd_modifier" in dataToSend) dataToSend.crowd_modifier = parseInt(dataToSend.crowd_modifier) || 0;
      if ("seat_modifier" in dataToSend) dataToSend.seat_modifier = parseFloat(dataToSend.seat_modifier) || 1.0;
      if ("price_multiplier" in dataToSend) dataToSend.price_multiplier = parseFloat(dataToSend.price_multiplier) || 1.0;
      
      // Coerce booleans
      if ("has_airport" in dataToSend) dataToSend.has_airport = !!dataToSend.has_airport;
      if ("has_train_station" in dataToSend) dataToSend.has_train_station = !!dataToSend.has_train_station;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      });
      
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        // Render Pydantic or custom server exception messages
        const details = payload.detail;
        if (Array.isArray(details)) {
          const msg = details.map((d: any) => `${d.loc.join(".")}: ${d.msg}`).join("; ");
          setModalError(msg);
        } else {
          setModalError(details || "Failed to commit record updates");
        }
        return;
      }

      setShowModal(false);
      fetchStats();
      fetchData();
    } catch (err: any) {
      setModalError("Server communication failed.");
    }
  };

  // Record deletion confirmation
  const handleDelete = async (id: number, label: string) => {
    if (!confirm(`Are you sure you want to permanently delete '${label}'?`)) {
      return;
    }
    
    let url = `${BACKEND_BASE_URL}/${activeTab}/${id}`;
    if (activeTab === "nearby") url = `${BACKEND_BASE_URL}/nearby-mappings/${id}`;
    if (activeTab === "seasonal") url = `${BACKEND_BASE_URL}/seasonal-demands/${id}`;

    try {
      const res = await fetch(url, { method: "DELETE" });
      const payload = await res.json();
      if (res.ok && payload.success) {
        fetchStats();
        fetchData();
      } else {
        alert(payload.detail || "Deletion failed.");
      }
    } catch (e) {
      alert("Network request to delete record failed.");
    }
  };

  // Modal Fields Initializer
  const openAddModal = () => {
    setModalType("add");
    setSelectedItem(null);
    setModalError("");
    
    // Set default fields based on active tab
    if (activeTab === "cities") {
      setFormFields({
        city_name: "", state: "", tier: "Tier 2", importance_score: 50,
        demand_category: "Standard", latitude: 20.0, longitude: 75.0,
        has_airport: false, has_train_station: true, code: "", station: ""
      });
    } else if (activeTab === "stations") {
      setFormFields({
        station_code: "", station_name: "", city_id: citiesList[0]?.id || "",
        station_type: "Rail", importance_score: 50
      });
    } else if (activeTab === "corridors") {
      setFormFields({
        source_city_id: citiesList[0]?.id || "", destination_city_id: citiesList[1]?.id || "",
        demand_level: "Moderate", migration_relevance: "Standard",
        seasonal_pressure: "Standard", avg_duration: "10h"
      });
    } else if (activeTab === "nearby") {
      setFormFields({
        city_id: citiesList[0]?.id || "", station_id: stationsList[0]?.id || "",
        distance_km: 10.0
      });
    } else if (activeTab === "seasonal") {
      setFormFields({
        festival_name: "", start_month: 1, start_day: 1, end_month: 1, end_day: 2,
        seat_modifier: 1.0, comfort_modifier: 0, price_multiplier: 1.0,
        crowd_modifier: 0, description: ""
      });
    }
    
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setModalType("edit");
    setSelectedItem(item);
    setModalError("");
    setFormFields({ ...item });
    setShowModal(true);
  };

  // Uploader center trigger
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      alert("Please select a file to import");
      return;
    }
    
    setLoading(true);
    setImportReport(null);
    
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("target", uploadTarget);
    
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/import`, {
        method: "POST",
        body: formData
      });
      const payload = await res.json();
      if (res.ok && payload.success) {
        setImportReport(payload);
        fetchStats();
      } else {
        alert(payload.detail || "Ingestion file import failed.");
      }
    } catch (err) {
      alert("Failed to submit ingestion job to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between">
        <div>
          {/* Admin panel Branding Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
            <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              NAVIX CONTROL
            </span>
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-slate-800 text-cyan-400 font-mono rounded">
              v1.2
            </span>
          </div>
          
          <nav className="mt-6 px-4 space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard Stats", icon: Icons.Dashboard },
              { id: "cities", label: "Cities", icon: Icons.City },
              { id: "stations", label: "Stations", icon: Icons.Station },
              { id: "corridors", label: "Corridors", icon: Icons.Corridor },
              { id: "nearby", label: "Nearby Mappings", icon: Icons.Nearby },
              { id: "seasonal", label: "Seasonal Demands", icon: Icons.Seasonal },
              { id: "import", label: "Import Center", icon: Icons.Import },
              { id: "audit", label: "Audit Trail", icon: Icons.Audit }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    active 
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-900/30" 
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <TabIcon />
                  <span className="ml-3">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold font-mono text-sm">
              AD
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">Administrator Panel</p>
              <span className="text-[10px] text-emerald-400 flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block mr-1"></span>
                Connected
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-y-auto">
        
        {/* Top Navbar Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/70 backdrop-blur px-8 flex items-center justify-between sticky top-0 z-30">
          <h1 className="text-lg font-bold text-white capitalize flex items-center">
            {activeTab === "nearby" ? "Nearby Station Mappings" : activeTab === "seasonal" ? "Seasonal Demands" : activeTab}
          </h1>
          <div className="flex items-center space-x-4">
            {stats.last_import_time && (
              <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
                Last Data Ingest: {new Date(stats.last_import_time).toLocaleString()}
              </span>
            )}
            <a 
              href="/" 
              className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition"
            >
              Public App ↗
            </a>
          </div>
        </header>

        {/* Dashboard Workspace Views */}
        <div className="p-8 flex-1">
          
          {/* TAB 1: DASHBOARD HOME STATS */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                  { label: "Total Cities", count: stats.total_cities, tone: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/30", text: "text-cyan-400" },
                  { label: "Total Stations", count: stats.total_stations, tone: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/30", text: "text-violet-400" },
                  { label: "Active Corridors", count: stats.total_corridors, tone: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30", text: "text-amber-400" },
                  { label: "Nearby Connections", count: stats.total_nearby, tone: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/30", text: "text-emerald-400" },
                  { label: "Seasonal Multipliers", count: stats.total_seasonal, tone: "from-rose-500/20 to-pink-500/20", border: "border-rose-500/30", text: "text-rose-400" }
                ].map((c, i) => (
                  <div key={i} className={`p-6 rounded-2xl bg-gradient-to-br ${c.tone} border ${c.border} flex flex-col justify-between shadow-lg`}>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{c.label}</span>
                    <span className={`text-4xl font-extrabold font-mono mt-4 ${c.text}`}>{c.count}</span>
                  </div>
                ))}
              </div>
              
              {/* Recent Audit trail in dashboard */}
              <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-bold text-white">Recent Operations Audit Trail</h3>
                  <button onClick={() => setActiveTab("audit")} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold font-mono">
                    View Full Logs →
                  </button>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-12"><Icons.Spinner /></div>
                ) : data.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">No logs logged in database yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono text-xs uppercase">
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">Operation</th>
                          <th className="py-3 px-4">Entity</th>
                          <th className="py-3 px-4">Record ID</th>
                          <th className="py-3 px-4">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {data.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/30">
                            <td className="py-3 px-4 font-mono text-xs text-slate-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
                                log.operation === "CREATED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                log.operation === "UPDATED" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                                log.operation === "DELETED" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                                "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {log.operation}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-white">{log.entity}</td>
                            <td className="py-3 px-4 font-mono text-xs text-slate-400">{log.record_id || "-"}</td>
                            <td className="py-3 px-4 text-xs text-slate-400">{log.details || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CITIES VIEW */}
          {activeTab === "cities" && (
            <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
              
              {/* Header Action toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><Icons.Search /></span>
                    <input
                      type="text"
                      placeholder="Search cities..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 text-white"
                    />
                  </div>
                  
                  {/* States dropdown */}
                  <select
                    value={stateFilter}
                    onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All States</option>
                    {statesList.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>

                  {/* Tiers dropdown */}
                  <select
                    value={tierFilter}
                    onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Tiers</option>
                    {tiersList.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-xl transition shadow shadow-indigo-900/40">
                  <Icons.Plus />
                  <span className="ml-2">Add City</span>
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono text-xs uppercase">
                      <th className="py-3 px-4">City Name</th>
                      <th className="py-3 px-4">State</th>
                      <th className="py-3 px-4">Tier</th>
                      <th className="py-3 px-4">Airport</th>
                      <th className="py-3 px-4">Train Stn</th>
                      <th className="py-3 px-4">Geo Location</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {loading ? (
                      <tr><td colSpan={8} className="py-12 text-center"><div className="flex justify-center"><Icons.Spinner /></div></td></tr>
                    ) : data.length === 0 ? (
                      <tr><td colSpan={8} className="py-12 text-center text-slate-500">No cities found.</td></tr>
                    ) : (
                      data.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">{c.city_name}</td>
                          <td className="py-3.5 px-4 text-slate-300">{c.state || "-"}</td>
                          <td className="py-3.5 px-4 text-slate-300">{c.tier || "-"}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.has_airport ? "bg-sky-500/10 text-sky-400" : "bg-slate-800 text-slate-500"}`}>
                              {c.has_airport ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.has_train_station ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                              {c.has_train_station ? "Yes" : "No"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                            {c.latitude?.toFixed(4) ?? "0.0000"}, {c.longitude?.toFixed(4) ?? "0.0000"}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-indigo-400">{c.importance_score}</td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button onClick={() => openEditModal(c)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition">
                              <Icons.Edit />
                            </button>
                            <button onClick={() => handleDelete(c.id, c.city_name)} className="p-1.5 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 rounded-lg transition">
                              <Icons.Delete />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Showing {data.length} of {total} records</span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-white px-2">Page {page}</span>
                  <button
                    disabled={page * limit >= total}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STATIONS VIEW */}
          {activeTab === "stations" && (
            <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
              
              {/* Header Action toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><Icons.Search /></span>
                    <input
                      type="text"
                      placeholder="Search station name / code..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 text-white"
                    />
                  </div>
                  
                  {/* City selector filter */}
                  <select
                    value={cityFilter}
                    onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Cities</option>
                    {citiesList.map(c => <option key={c.id} value={c.id}>{c.city_name}</option>)}
                  </select>
                </div>

                <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-xl transition shadow shadow-indigo-900/40">
                  <Icons.Plus />
                  <span className="ml-2">Add Station</span>
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono text-xs uppercase">
                      <th className="py-3 px-4">Station Code</th>
                      <th className="py-3 px-4">Station Name</th>
                      <th className="py-3 px-4">Linked City</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {loading ? (
                      <tr><td colSpan={6} className="py-12 text-center"><div className="flex justify-center"><Icons.Spinner /></div></td></tr>
                    ) : data.length === 0 ? (
                      <tr><td colSpan={6} className="py-12 text-center text-slate-500">No stations found.</td></tr>
                    ) : (
                      data.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{s.station_code}</td>
                          <td className="py-3.5 px-4 font-semibold text-white">{s.station_name}</td>
                          <td className="py-3.5 px-4 text-slate-300">{s.city_name || <span className="text-slate-600 italic">None</span>}</td>
                          <td className="py-3.5 px-4 text-slate-300">{s.station_type || "-"}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-indigo-400">{s.importance_score}</td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button onClick={() => openEditModal(s)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition">
                              <Icons.Edit />
                            </button>
                            <button onClick={() => handleDelete(s.id, s.station_code)} className="p-1.5 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 rounded-lg transition">
                              <Icons.Delete />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Showing {data.length} of {total} records</span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-white px-2">Page {page}</span>
                  <button
                    disabled={page * limit >= total}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CORRIDORS VIEW */}
          {activeTab === "corridors" && (
            <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
              
              {/* Header Action toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><Icons.Search /></span>
                    <input
                      type="text"
                      placeholder="Search source / destination..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 text-white"
                    />
                  </div>
                </div>

                <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-xl transition shadow shadow-indigo-900/40">
                  <Icons.Plus />
                  <span className="ml-2">Add Corridor</span>
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono text-xs uppercase">
                      <th className="py-3 px-4">Source City</th>
                      <th className="py-3 px-4">Destination City</th>
                      <th className="py-3 px-4">Demand Level</th>
                      <th className="py-3 px-4">Migration Relevance</th>
                      <th className="py-3 px-4">Seasonal Pressure</th>
                      <th className="py-3 px-4 text-center">Avg Duration</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {loading ? (
                      <tr><td colSpan={7} className="py-12 text-center"><div className="flex justify-center"><Icons.Spinner /></div></td></tr>
                    ) : data.length === 0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-slate-500">No corridors found.</td></tr>
                    ) : (
                      data.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-white">{c.source_city_name}</td>
                          <td className="py-3.5 px-4 font-semibold text-white">{c.destination_city_name}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.demand_level === "Extreme" ? "bg-rose-500/10 text-rose-400" :
                              c.demand_level === "High" ? "bg-amber-500/10 text-amber-400" :
                              "bg-slate-800 text-slate-300"
                            }`}>
                              {c.demand_level}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">{c.migration_relevance || "-"}</td>
                          <td className="py-3.5 px-4 text-slate-300">{c.seasonal_pressure || "-"}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-indigo-400">{c.avg_duration || "-"}</td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button onClick={() => openEditModal(c)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition">
                              <Icons.Edit />
                            </button>
                            <button onClick={() => handleDelete(c.id, `${c.source_city_name} -> ${c.destination_city_name}`)} className="p-1.5 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 rounded-lg transition">
                              <Icons.Delete />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Showing {data.length} of {total} records</span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-white px-2">Page {page}</span>
                  <button
                    disabled={page * limit >= total}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NEARBY MAPPINGS VIEW */}
          {activeTab === "nearby" && (
            <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
              
              {/* Header Action toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><Icons.Search /></span>
                    <input
                      type="text"
                      placeholder="Search city / station..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 text-white"
                    />
                  </div>
                </div>

                <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-xl transition shadow shadow-indigo-900/40">
                  <Icons.Plus />
                  <span className="ml-2">Add Mapping</span>
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono text-xs uppercase">
                      <th className="py-3 px-4">City</th>
                      <th className="py-3 px-4">Station Code</th>
                      <th className="py-3 px-4">Station Name</th>
                      <th className="py-3 px-4 text-center">Distance</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {loading ? (
                      <tr><td colSpan={5} className="py-12 text-center"><div className="flex justify-center"><Icons.Spinner /></div></td></tr>
                    ) : data.length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center text-slate-500">No mappings found.</td></tr>
                    ) : (
                      data.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-white">{m.city_name}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{m.station_code}</td>
                          <td className="py-3.5 px-4 text-slate-300">{m.station_name}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-indigo-400">{m.distance_km?.toFixed(1) ?? "0.0"} KM</td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button onClick={() => openEditModal(m)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition">
                              <Icons.Edit />
                            </button>
                            <button onClick={() => handleDelete(m.id, `${m.station_code} -> ${m.city_name}`)} className="p-1.5 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 rounded-lg transition">
                              <Icons.Delete />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Showing {data.length} of {total} records</span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-white px-2">Page {page}</span>
                  <button
                    disabled={page * limit >= total}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SEASONAL DEMANDS VIEW */}
          {activeTab === "seasonal" && (
            <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
              
              {/* Header Action toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><Icons.Search /></span>
                    <input
                      type="text"
                      placeholder="Search festival name..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); }}
                      className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 text-white"
                    />
                  </div>
                </div>

                <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm rounded-xl transition shadow shadow-indigo-900/40">
                  <Icons.Plus />
                  <span className="ml-2">Add Period</span>
                </button>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono text-xs uppercase">
                      <th className="py-3 px-4">Festival/Period</th>
                      <th className="py-3 px-4 text-center">Dates (DD/MM)</th>
                      <th className="py-3 px-4 text-center">Price Mult.</th>
                      <th className="py-3 px-4 text-center">Seat Mod.</th>
                      <th className="py-3 px-4 text-center">Comfort Mod.</th>
                      <th className="py-3 px-4 text-center">Crowd Mod.</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {loading ? (
                      <tr><td colSpan={8} className="py-12 text-center"><div className="flex justify-center"><Icons.Spinner /></div></td></tr>
                    ) : data.length === 0 ? (
                      <tr><td colSpan={8} className="py-12 text-center text-slate-500">No seasonal periods found.</td></tr>
                    ) : (
                      data.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">{d.festival_name}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                            {String(d.start_day).padStart(2, "0")}/{String(d.start_month).padStart(2, "0")} → {String(d.end_day).padStart(2, "0")}/{String(d.end_month).padStart(2, "0")}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-amber-400">{d.price_multiplier?.toFixed(2) ?? "1.00"}x</td>
                          <td className="py-3.5 px-4 text-center font-mono text-cyan-400">{d.seat_modifier?.toFixed(2) ?? "1.00"}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-emerald-400">{d.comfort_modifier}</td>
                          <td className="py-3.5 px-4 text-center font-mono text-rose-400">+{d.crowd_modifier}%</td>
                          <td className="py-3.5 px-4 text-xs text-slate-400 max-w-[200px] truncate">{d.description || "-"}</td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button onClick={() => openEditModal(d)} className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition">
                              <Icons.Edit />
                            </button>
                            <button onClick={() => handleDelete(d.id, d.festival_name)} className="p-1.5 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 rounded-lg transition">
                              <Icons.Delete />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Showing {data.length} of {total} records</span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-white px-2">Page {page}</span>
                  <button
                    disabled={page * limit >= total}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: IMPORT CENTER */}
          {activeTab === "import" && (
            <div className="max-w-4xl mx-auto bg-slate-950/50 rounded-2xl border border-slate-800 p-8 shadow-xl space-y-8 animate-fadeIn">
              
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white">Import Travel Intelligence Datasets</h3>
                <p className="text-sm text-slate-400">
                  Update database records by uploading a new dataset (CSV or JSON) file. The ingestion framework will validate formats, map foreign-key relationships, skip duplicates, and perform transaction-safe updates.
                </p>
              </div>

              <form onSubmit={handleImportSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Import Target Table</label>
                    <select
                      value={uploadTarget}
                      onChange={(e) => setUploadTarget(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="cities">Cities (cities.csv)</option>
                      <option value="stations">Stations (stations.csv)</option>
                      <option value="corridors">Corridors (corridors.csv)</option>
                      <option value="nearby">Nearby Station Mappings (nearby_station_mappings.csv)</option>
                      <option value="seasonal">Seasonal Demands (seasonal_demands.csv)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Select Dataset File (.csv, .json)</label>
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !uploadFile}
                    className="flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition w-full md:w-auto shadow-lg shadow-indigo-900/30"
                  >
                    {loading ? (
                      <>
                        <Icons.Spinner />
                        <span className="ml-3">Ingesting Dataset...</span>
                      </>
                    ) : (
                      <>
                        <Icons.Import />
                        <span className="ml-3">Run Import Ingestion</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Import summary output report */}
              {importReport && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                  <div className="flex items-center space-x-3 text-emerald-400 font-bold text-base">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-ping"></span>
                    <span>Ingestion Import Successful!</span>
                  </div>
                  
                  {/* Results counts */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "New Imported", count: importReport.imported, text: "text-emerald-400" },
                      { label: "Existing Updated", count: importReport.updated, text: "text-cyan-400" },
                      { label: "Duplicates Skipped", count: importReport.skipped, text: "text-slate-400" },
                      { label: "Validation Errors", count: importReport.validation_errors, text: importReport.validation_errors > 0 ? "text-amber-400" : "text-slate-500" }
                    ].map((card, i) => (
                      <div key={i} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl flex flex-col justify-between">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
                        <span className={`text-2xl font-extrabold font-mono mt-2 ${card.text}`}>{card.count}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Summary Text log */}
                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Ingestion Output Diagnostics Log</span>
                    <pre className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto">
                      {importReport.summary}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: AUDIT LOG VIEW */}
          {activeTab === "audit" && (
            <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-medium">Viewing complete database audit trial log history</span>
              </div>
              
              <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-mono text-xs uppercase">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Operation</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">Record ID</th>
                      <th className="py-3 px-4">Action Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {loading ? (
                      <tr><td colSpan={5} className="py-12 text-center"><div className="flex justify-center"><Icons.Spinner /></div></td></tr>
                    ) : data.length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center text-slate-500">No logs found.</td></tr>
                    ) : (
                      data.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/20 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider ${
                              log.operation === "CREATED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              log.operation === "UPDATED" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                              log.operation === "DELETED" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                              "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {log.operation}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-white">{log.entity}</td>
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{log.record_id || "-"}</td>
                          <td className="py-3.5 px-4 text-xs text-slate-400">{log.details || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="flex justify-between items-center text-sm text-slate-400">
                <span>Showing {data.length} of {total} records</span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-white px-2">Page {page}</span>
                  <button
                    disabled={page * 20 >= total} // page limit is 20 for logs
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* CRUD Add/Edit Overlay Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="h-14 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between">
              <h3 className="text-base font-bold text-white capitalize">
                {modalType === "add" ? "Add New" : "Edit"}{" "}
                {activeTab === "cities"
                  ? "City"
                  : activeTab === "stations"
                  ? "Station"
                  : activeTab === "corridors"
                  ? "Corridor"
                  : activeTab === "nearby"
                  ? "Nearby Mapping"
                  : activeTab === "seasonal"
                  ? "Seasonal Demand"
                  : activeTab.slice(0, -1)}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
                  {modalError}
                </div>
              )}

              {/* Form Fields: CITIES */}
              {activeTab === "cities" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">City Name*</label>
                    <input
                      type="text"
                      required
                      value={formFields.city_name || ""}
                      onChange={(e) => setFormFields({ ...formFields, city_name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">State</label>
                    <input
                      type="text"
                      value={formFields.state || ""}
                      onChange={(e) => setFormFields({ ...formFields, state: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Tier</label>
                    <select
                      value={formFields.tier || ""}
                      onChange={(e) => setFormFields({ ...formFields, tier: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Tier 1">Tier 1</option>
                      <option value="Tier 2">Tier 2</option>
                      <option value="Tier 3">Tier 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">City Code</label>
                    <input
                      type="text"
                      value={formFields.code || ""}
                      onChange={(e) => setFormFields({ ...formFields, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Primary Station Code</label>
                    <input
                      type="text"
                      value={formFields.station || ""}
                      onChange={(e) => setFormFields({ ...formFields, station: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Latitude*</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formFields.latitude || ""}
                      onChange={(e) => setFormFields({ ...formFields, latitude: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Longitude*</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formFields.longitude || ""}
                      onChange={(e) => setFormFields({ ...formFields, longitude: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Importance Score</label>
                    <input
                      type="number"
                      value={formFields.importance_score || ""}
                      onChange={(e) => setFormFields({ ...formFields, importance_score: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Demand Category</label>
                    <input
                      type="text"
                      value={formFields.demand_category || ""}
                      onChange={(e) => setFormFields({ ...formFields, demand_category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-2 flex space-x-6 pt-2">
                    <label className="flex items-center text-sm text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formFields.has_airport}
                        onChange={(e) => setFormFields({ ...formFields, has_airport: e.target.checked })}
                        className="mr-2 rounded border-slate-800 text-indigo-600 focus:ring-0 bg-slate-950"
                      />
                      Has Airport
                    </label>
                    <label className="flex items-center text-sm text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formFields.has_train_station}
                        onChange={(e) => setFormFields({ ...formFields, has_train_station: e.target.checked })}
                        className="mr-2 rounded border-slate-800 text-indigo-600 focus:ring-0 bg-slate-950"
                      />
                      Has Train Station
                    </label>
                  </div>
                </div>
              )}

              {/* Form Fields: STATIONS */}
              {activeTab === "stations" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Station Code*</label>
                    <input
                      type="text"
                      required
                      value={formFields.station_code || ""}
                      onChange={(e) => setFormFields({ ...formFields, station_code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Station Name*</label>
                    <input
                      type="text"
                      required
                      value={formFields.station_name || ""}
                      onChange={(e) => setFormFields({ ...formFields, station_name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Linked City</label>
                    <select
                      value={formFields.city_id || ""}
                      onChange={(e) => setFormFields({ ...formFields, city_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">No Linked City</option>
                      {citiesList.map(c => <option key={c.id} value={c.id}>{c.city_name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Station Type</label>
                      <input
                        type="text"
                        value={formFields.station_type || ""}
                        onChange={(e) => setFormFields({ ...formFields, station_type: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Importance Score</label>
                      <input
                        type="number"
                        value={formFields.importance_score || ""}
                        onChange={(e) => setFormFields({ ...formFields, importance_score: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields: CORRIDORS */}
              {activeTab === "corridors" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Source City*</label>
                      <select
                        required
                        value={formFields.source_city_id || ""}
                        onChange={(e) => setFormFields({ ...formFields, source_city_id: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      >
                        {citiesList.map(c => <option key={c.id} value={c.id}>{c.city_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Destination City*</label>
                      <select
                        required
                        value={formFields.destination_city_id || ""}
                        onChange={(e) => setFormFields({ ...formFields, destination_city_id: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      >
                        {citiesList.map(c => <option key={c.id} value={c.id}>{c.city_name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Demand Level</label>
                    <select
                      value={formFields.demand_level || ""}
                      onChange={(e) => setFormFields({ ...formFields, demand_level: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Moderate">Moderate</option>
                      <option value="High">High</option>
                      <option value="Extreme">Extreme</option>
                      <option value="Standard">Standard</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Migration Relevance</label>
                      <input
                        type="text"
                        value={formFields.migration_relevance || ""}
                        onChange={(e) => setFormFields({ ...formFields, migration_relevance: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Seasonal Pressure</label>
                      <input
                        type="text"
                        value={formFields.seasonal_pressure || ""}
                        onChange={(e) => setFormFields({ ...formFields, seasonal_pressure: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Average Duration (e.g. 12h)</label>
                    <input
                      type="text"
                      value={formFields.avg_duration || ""}
                      onChange={(e) => setFormFields({ ...formFields, avg_duration: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Form Fields: NEARBY STATION MAPPINGS */}
              {activeTab === "nearby" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">City*</label>
                    <select
                      required
                      value={formFields.city_id || ""}
                      onChange={(e) => setFormFields({ ...formFields, city_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      {citiesList.map(c => <option key={c.id} value={c.id}>{c.city_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Station*</label>
                    <select
                      required
                      value={formFields.station_id || ""}
                      onChange={(e) => setFormFields({ ...formFields, station_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      {stationsList.map(s => <option key={s.id} value={s.id}>{s.station_name} ({s.station_code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Distance (KM)*</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formFields.distance_km || ""}
                      onChange={(e) => setFormFields({ ...formFields, distance_km: e.target.value })}
                      className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Form Fields: SEASONAL DEMANDS */}
              {activeTab === "seasonal" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Festival / Period Name*</label>
                    <input
                      type="text"
                      required
                      value={formFields.festival_name || ""}
                      onChange={(e) => setFormFields({ ...formFields, festival_name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Start Day</label>
                      <input
                        type="number"
                        required
                        value={formFields.start_day || ""}
                        onChange={(e) => setFormFields({ ...formFields, start_day: e.target.value })}
                        className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Start Month</label>
                      <input
                        type="number"
                        required
                        value={formFields.start_month || ""}
                        onChange={(e) => setFormFields({ ...formFields, start_month: e.target.value })}
                        className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">End Day</label>
                      <input
                        type="number"
                        required
                        value={formFields.end_day || ""}
                        onChange={(e) => setFormFields({ ...formFields, end_day: e.target.value })}
                        className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">End Month</label>
                      <input
                        type="number"
                        required
                        value={formFields.end_month || ""}
                        onChange={(e) => setFormFields({ ...formFields, end_month: e.target.value })}
                        className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Price Multiplier</label>
                      <input
                        type="number"
                        step="any"
                        value={formFields.price_multiplier || ""}
                        onChange={(e) => setFormFields({ ...formFields, price_multiplier: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Seat Modifier</label>
                      <input
                        type="number"
                        step="any"
                        value={formFields.seat_modifier || ""}
                        onChange={(e) => setFormFields({ ...formFields, seat_modifier: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Comfort Modifier</label>
                      <input
                        type="number"
                        value={formFields.comfort_modifier || ""}
                        onChange={(e) => setFormFields({ ...formFields, comfort_modifier: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Crowd Modifier (+%)</label>
                      <input
                        type="number"
                        value={formFields.crowd_modifier || ""}
                        onChange={(e) => setFormFields({ ...formFields, crowd_modifier: e.target.value })}
                        className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formFields.description || ""}
                      onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer actions */}
              <div className="h-16 border-t border-slate-800 bg-slate-950 flex items-center justify-end px-6 space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-sm font-semibold rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 transition"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
