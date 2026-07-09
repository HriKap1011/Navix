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
  ),
  DataSource: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Train: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  Network: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  Coverage: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
  const [graphStats, setGraphStats] = useState<any>(null);
  const [graphSearch, setGraphSearch] = useState<string>("");
  const [graphSearchResults, setGraphSearchResults] = useState<any[]>([]);
  const [activeNode, setActiveNode] = useState<any>(null);
  const [graphLoading, setGraphLoading] = useState<boolean>(false);
  const [graphPanel, setGraphPanel] = useState<string | null>(null);
  const [graphToast, setGraphToast] = useState<{msg: string; ok: boolean} | null>(null);

  // Railway Dataset state
  const [railwayStatus, setRailwayStatus] = useState<any>(null);
  const [railwayTrains, setRailwayTrains] = useState<any[]>([]);
  const [railwayTotal, setRailwayTotal] = useState<number>(0);
  const [railwayPage, setRailwayPage] = useState<number>(1);
  const [railwaySearch, setRailwaySearch] = useState<string>("");
  const [railwayTypeFilter, setRailwayTypeFilter] = useState<string>("");
  const [selectedTrain, setSelectedTrain] = useState<any>(null);
  const [railwayLoading, setRailwayLoading] = useState<boolean>(false);
  const [coverageData, setCoverageData] = useState<any>(null);
  const [simulatedResults, setSimulatedResults] = useState<any>(null);
  const [selectedTrains, setSelectedTrains] = useState<string[]>([]);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterState, setFilterState] = useState<string>("");
  const [filterCorridor, setFilterCorridor] = useState<string>("");
  const [filterMode, setFilterMode] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [drilldownType, setDrilldownType] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState<boolean>(false);
  
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
    } else if (activeTab === "data-sources") {
      url = `${BACKEND_BASE_URL}/data-sources`;
    } else if (activeTab === "travel-network") {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/graph/stats`);
        const payload = await res.json();
        if (payload.success) {
          setGraphStats(payload);
        }
      } catch (e) {
        console.error("Failed to load graph stats", e);
      }
      setLoading(false);
      return;
    } else if (activeTab === "railway-dataset") {
      // Fetch railway dataset status and first page of trains
      try {
        const [statusRes, trainsRes] = await Promise.all([
          fetch(`${BACKEND_BASE_URL}/railway/status`),
          fetch(`${BACKEND_BASE_URL}/railway/trains?page=1&limit=20`)
        ]);
        const statusPayload = await statusRes.json();
        const trainsPayload = await trainsRes.json();
        if (statusPayload.success) setRailwayStatus(statusPayload);
        if (trainsPayload.success) {
          setRailwayTrains(trainsPayload.trains || []);
          setRailwayTotal(trainsPayload.total || 0);
          setRailwayPage(1);
        }
      } catch (e) {
        console.error("Failed to load railway data", e);
      }
      setLoading(false);
      return;
    } else if (activeTab === "coverage-intelligence") {
      try {
        const queryParams = new URLSearchParams();
        if (filterCity) queryParams.append("city", filterCity);
        if (filterState) queryParams.append("state", filterState);
        if (filterCorridor) queryParams.append("corridor", filterCorridor);
        if (filterMode) queryParams.append("transport_mode", filterMode);
        if (filterStartDate) queryParams.append("start_date", filterStartDate);
        if (filterEndDate) queryParams.append("end_date", filterEndDate);

        const res = await fetch(`${BACKEND_BASE_URL}/coverage/intelligence?${queryParams.toString()}`);
        const payload = await res.json();
        if (payload.success) {
          setCoverageData(payload);
        }
      } catch (e) {
        console.error("Failed to load coverage intelligence", e);
      }
      setLoading(false);
      return;
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
    setData([]);
    setPage(1);
    setSearch("");
    setSortBy("");
    setSortOrder("asc");
    setCityFilter("");
    setStateFilter("");
    setTierFilter("");
    fetchStats();
    
    // Lazy caches for modals
    if (["stations", "corridors", "nearby", "coverage-intelligence"].includes(activeTab)) {
      fetchCitiesList();
    }
    if (activeTab === "nearby") {
      fetchStationsList();
    }
    if (["cities", "coverage-intelligence"].includes(activeTab)) {
      fetchCitiesFilters();
    }
  }, [activeTab]);

  // List auto reload triggers
  useEffect(() => {
    if (activeTab !== "import") {
      fetchData();
    }
  }, [page, search, sortBy, sortOrder, stateFilter, tierFilter, cityFilter, filterCity, filterState, filterCorridor, filterMode, filterStartDate, filterEndDate, fetchData]);

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
              { id: "data-sources", label: "Data Sources", icon: Icons.DataSource },
              { id: "travel-network", label: "Travel Network", icon: Icons.Network },
              { id: "railway-dataset", label: "Railway Dataset", icon: Icons.Train },
              { id: "coverage-intelligence", label: "Coverage Intelligence", icon: Icons.Coverage },
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

          {/* TAB 9: DATA SOURCES VIEW */}
          {activeTab === "data-sources" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Centralized Travel Data Connectors</h3>
                    <p className="text-sm text-slate-400 mt-1">Manage active travel information channels, toggle providers, set priority routing and trigger manual syncing.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12"><Icons.Spinner /></div>
                  ) : data.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No registered data sources found.</div>
                  ) : (
                    data.map((src: any, idx: number) => (
                      <div key={src.source_id || `ds-${idx}`} className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-700 transition">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                            <Icons.DataSource />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-bold text-white">{src.name}</h4>
                              <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded uppercase tracking-wider">
                                {src.type}
                              </span>
                              <span className="text-[10px] bg-indigo-900/30 text-indigo-300 font-mono px-2 py-0.5 rounded">
                                Priority: {src.priority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Source ID: {src.source_id} | Connector Version: {src.version}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 mt-4 text-xs">
                              <div>
                                <span className="text-slate-500 block">Health Status</span>
                                <span className={`font-semibold flex items-center mt-0.5 ${src.health_status === "Healthy" ? "text-emerald-400" : "text-rose-400"}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1.5 ${src.health_status === "Healthy" ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`}></span>
                                  {src.health_status}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Last Sync Time</span>
                                <span className="text-slate-300 font-semibold mt-0.5 block">
                                  {src.last_sync ? new Date(src.last_sync).toLocaleString() : "Never"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Average Response Time</span>
                                <span className="text-slate-300 font-semibold font-mono mt-0.5 block">
                                  {src.average_response_time_ms ? `${src.average_response_time_ms.toFixed(2)}ms` : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Total Records Sync</span>
                                <span className="text-slate-300 font-semibold font-mono mt-0.5 block">
                                  {src.total_records_count || 0} routes
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 self-end md:self-center">
                          {/* Priority setter */}
                          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider px-1">Pri</span>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={src.priority}
                              onChange={async (e) => {
                                const newPri = parseInt(e.target.value) || 1;
                                try {
                                  await fetch(`${BACKEND_BASE_URL}/data-sources/${src.source_id}/priority`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ priority: newPri })
                                  });
                                  fetchData();
                                } catch (err) {
                                  console.error("Failed to update priority", err);
                                }
                              }}
                              className="w-10 bg-transparent text-center font-mono text-xs text-white focus:outline-none"
                            />
                          </div>

                          {/* Manual sync */}
                          <button
                            disabled={loading || src.status !== "Active"}
                            onClick={async () => {
                              setLoading(true);
                              try {
                                const res = await fetch(`${BACKEND_BASE_URL}/data-sources/${src.source_id}/sync`, { method: "POST" });
                                if (res.ok) alert(`Manual synchronization succeeded for ${src.source_id}!`);
                                fetchData();
                              } catch (err) {
                                alert(`Manual sync failed: ${err}`);
                                setLoading(false);
                              }
                            }}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 disabled:opacity-50 text-slate-200 hover:text-white text-xs font-semibold rounded-xl transition"
                          >
                            Manual Sync
                          </button>

                          {/* Toggle Active status */}
                          <button
                            onClick={async () => {
                              try {
                                await fetch(`${BACKEND_BASE_URL}/data-sources/${src.source_id}/toggle`, { method: "POST" });
                                fetchData();
                              } catch (err) {
                                console.error("Toggle source status failed", err);
                              }
                            }}
                            className={`px-4 py-2 text-xs font-semibold rounded-xl transition shadow-lg ${
                              src.status === "Active"
                                ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-950/20"
                                : "bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-300"
                            }`}
                          >
                            {src.status === "Active" ? "Active" : "Inactive"}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: TRAVEL KNOWLEDGE GRAPH VIEW */}
          {activeTab === "travel-network" && graphStats && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Nodes card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex flex-col justify-between shadow-lg">
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Graph Nodes</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Cities &amp; transport hubs mapped</span>
                  </div>
                  <span className="text-3xl font-extrabold mt-4 font-mono text-cyan-400">{graphStats.nodes_count}</span>
                </div>

                {/* Edges card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex flex-col justify-between shadow-lg">
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Graph Edges</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Inter-city routes &amp; station links</span>
                  </div>
                  <span className="text-3xl font-extrabold mt-4 font-mono text-violet-400">{graphStats.edges_count}</span>
                </div>

                {/* Graph Health — clickable */}
                <button
                  onClick={() => setGraphPanel(graphPanel === 'health' ? null : 'health')}
                  className={`p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border flex flex-col justify-between shadow-lg text-left transition hover:scale-[1.02] active:scale-100 ${
                    graphPanel === 'health' ? 'border-emerald-400/60 ring-1 ring-emerald-400/30' : 'border-emerald-500/30'
                  }`}
                >
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Graph Health</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Click to view validation report →</span>
                  </div>
                  <span className="text-3xl font-extrabold mt-4 font-mono text-emerald-400">{graphStats.health_status}</span>
                </button>

                {/* Disconnected Nodes — clickable */}
                <button
                  onClick={() => setGraphPanel(graphPanel === 'disconnected' ? null : 'disconnected')}
                  className={`p-6 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border flex flex-col justify-between shadow-lg text-left transition hover:scale-[1.02] active:scale-100 ${
                    graphPanel === 'disconnected' ? 'border-rose-400/60 ring-1 ring-rose-400/30' : 'border-rose-500/30'
                  }`}
                >
                  <div>
                    <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Disconnected Nodes</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Click to see orphaned nodes →</span>
                  </div>
                  <span className="text-3xl font-extrabold mt-4 font-mono text-rose-400">{graphStats.disconnected_nodes?.length || 0}</span>
                </button>
              </div>

              {/* Card Detail Panel — Graph Health */}
              {graphPanel === 'health' && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-emerald-300">Graph Validation Report</h3>
                    <button onClick={() => setGraphPanel(null)} className="text-[10px] uppercase font-mono text-slate-500 hover:text-slate-300 transition">✕ Close</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Nodes', value: graphStats.validation_report?.nodes_count },
                      { label: 'Total Edges', value: graphStats.validation_report?.edges_count },
                      { label: 'Dangling Edges', value: graphStats.validation_report?.dangling_edges_count },
                      { label: 'Total Issues', value: graphStats.validation_report?.total_issues_count },
                    ].map((m, i) => (
                      <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{m.label}</div>
                        <div className="text-2xl font-extrabold font-mono mt-1 text-emerald-400">{m.value}</div>
                      </div>
                    ))}
                  </div>
                  {graphStats.validation_report?.issues?.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-rose-400">Issues detected:</p>
                      {graphStats.validation_report.issues.map((issue: string, idx: number) => (
                        <div key={idx} className="text-xs text-slate-300 bg-rose-500/5 border border-rose-500/20 rounded-lg px-4 py-2">{issue}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                      <span>✓</span> <span>Graph topology is fully valid — no dangling edges or broken relationships detected.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Card Detail Panel — Disconnected Nodes */}
              {graphPanel === 'disconnected' && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-rose-300">Orphaned / Disconnected Nodes</h3>
                    <button onClick={() => setGraphPanel(null)} className="text-[10px] uppercase font-mono text-slate-500 hover:text-slate-300 transition">✕ Close</button>
                  </div>
                  {graphStats.disconnected_nodes?.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-500">These nodes exist in the graph registry but have zero edges — they are not reachable from any other node.</p>
                      {graphStats.disconnected_nodes.map((n: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
                          <div>
                            <span className="text-sm font-semibold text-slate-200">{n.name}</span>
                            <span className="ml-2 text-[10px] font-mono text-slate-500">{n.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">{n.type}</span>
                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`${BACKEND_BASE_URL}/graph/node?id=${encodeURIComponent(n.id)}`);
                                  const body = await res.json();
                                  if (body.success) { setActiveNode(body); setGraphPanel(null); }
                                } catch {}
                              }}
                              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition"
                            >
                              Inspect
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                      <span>✓</span> <span>No disconnected nodes — all entities are reachable within the travel network.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Travel Graph Node Explorer */}
              <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Travel Graph Node Explorer</h3>
                    <p className="text-xs text-slate-500">Search and traverse transport nodes (cities, junctions, airports) to inspect connection topology.</p>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative w-full md:w-80">
                    <input
                      type="text"
                      placeholder="Search node (e.g. Delhi, NDLS)..."
                      value={graphSearch}
                      onChange={async (e) => {
                        const val = e.target.value;
                        setGraphSearch(val);
                        if (val.trim().length >= 1) {
                          try {
                            const res = await fetch(`${BACKEND_BASE_URL}/graph/search?query=${encodeURIComponent(val)}`);
                            const body = await res.json();
                            if (body.success) {
                              setGraphSearchResults(body.results);
                            }
                          } catch (err) {
                            console.error("Search failed", err);
                          }
                        } else {
                          setGraphSearchResults([]);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                    
                    {/* Search Autocomplete dropdown */}
                    {graphSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-800/80">
                        {graphSearchResults.map((item: any) => (
                          <button
                            key={item.id}
                            onClick={async () => {
                              setGraphSearch("");
                              setGraphSearchResults([]);
                              try {
                                const res = await fetch(`${BACKEND_BASE_URL}/graph/node?id=${encodeURIComponent(item.id)}`);
                                const body = await res.json();
                                if (body.success) {
                                  setActiveNode(body);
                                }
                              } catch (err) {
                                console.error("Node inspect failed", err);
                              }
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-800/50 transition flex items-center justify-between text-xs text-slate-300"
                          >
                            <span className="font-semibold text-slate-200">{item.name}</span>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              {item.type}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Explorer Split Pane */}
                {activeNode ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Selected Node details */}
                    <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                          {activeNode.type} Node
                        </span>
                        <button
                          onClick={() => setActiveNode(null)}
                          className="text-[10px] text-slate-500 hover:text-slate-300 transition uppercase font-mono font-bold"
                        >
                          Clear
                        </button>
                      </div>
                      
                      <h4 className="text-lg font-bold text-white tracking-tight">{activeNode.properties?.name || activeNode.id}</h4>
                      
                      <div className="divide-y divide-slate-800 text-xs space-y-2.5">
                        {activeNode.properties?.code && (
                          <div className="flex justify-between pt-2.5">
                            <span className="text-slate-500 font-semibold">Station Code</span>
                            <span className="text-slate-300 font-mono font-bold">{activeNode.properties.code}</span>
                          </div>
                        )}
                        {activeNode.properties?.station_type && (
                          <div className="flex justify-between pt-2.5">
                            <span className="text-slate-500 font-semibold">Terminal Type</span>
                            <span className="text-slate-300">{activeNode.properties.station_type}</span>
                          </div>
                        )}
                        {activeNode.properties?.state && (
                          <div className="flex justify-between pt-2.5">
                            <span className="text-slate-500 font-semibold">State</span>
                            <span className="text-slate-300">{activeNode.properties.state}</span>
                          </div>
                        )}
                        {activeNode.properties?.importance_score !== undefined && (
                          <div className="flex justify-between pt-2.5">
                            <span className="text-slate-500 font-semibold">Importance Score</span>
                            <span className="text-slate-300 font-mono font-bold text-indigo-400">{activeNode.properties.importance_score}</span>
                          </div>
                        )}
                        {activeNode.properties?.latitude !== undefined && (
                          <div className="flex justify-between pt-2.5">
                            <span className="text-slate-500 font-semibold">Coordinates</span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {activeNode.properties.latitude.toFixed(4)}°, {activeNode.properties.longitude.toFixed(4)}°
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Node Connections/Edges */}
                    <div className="lg:col-span-2 space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connected Edges ({activeNode.edges?.length || 0})</h4>
                      
                      <div className="max-h-[320px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {activeNode.edges && activeNode.edges.length > 0 ? (
                          activeNode.edges.map((edge: any, idx: number) => {
                            const isOutgoing = edge.direction === "outgoing";
                            const neighborId = isOutgoing ? edge.target_id : edge.source_id;
                            const neighborName = isOutgoing ? edge.target_name : edge.source_name;
                            const neighborType = isOutgoing ? edge.target_type : edge.source_type;
                            
                            return (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800/80 rounded-xl transition">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                                    isOutgoing ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                  }`}>
                                    {isOutgoing ? "Outgoing ➜" : "Incoming ⬅"}
                                  </span>
                                  
                                  <span className="text-xs text-slate-400 font-semibold">{edge.edge_type}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`${BACKEND_BASE_URL}/graph/node?id=${encodeURIComponent(neighborId)}`);
                                        const body = await res.json();
                                        if (body.success) {
                                          setActiveNode(body);
                                        }
                                      } catch (err) {
                                        console.error("Inspect failed", err);
                                      }
                                    }}
                                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition"
                                  >
                                    {neighborName}
                                  </button>
                                  <span className="text-[10px] font-mono text-slate-500 uppercase">({neighborType})</span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-xs text-slate-500">No active relationships found for this node.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl">
                    <span className="text-xl block mb-2">🔍</span>
                    <p className="text-xs text-slate-500">Search for cities (e.g. *Delhi*) or stations (e.g. *NDLS*) and click neighbors to navigate relationships.</p>
                  </div>
                )}
              </div>

              {/* Hub Cities & connected stations split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Column 1: Hub Cities */}
                <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="text-base font-bold text-white">Central Hub Cities</h3>
                  <p className="text-xs text-slate-500">Top cities ordered by incoming/outgoing route centrality links in the knowledge graph.</p>
                  
                  <div className="space-y-3">
                    {graphStats.hub_cities?.map((city: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${BACKEND_BASE_URL}/graph/node?id=${encodeURIComponent("City:" + city.name)}`);
                              const body = await res.json();
                              if (body.success) {
                                setActiveNode(body);
                              }
                            } catch (err) {
                              console.error("Inspect failed", err);
                            }
                          }}
                          className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition text-left"
                        >
                          {city.name}
                        </button>
                        <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-bold">
                          {city.connections_count} edges
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Most Connected Stations */}
                <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
                  <h3 className="text-base font-bold text-white">Most Connected Stations</h3>
                  <p className="text-xs text-slate-500">Major transport terminals (rail junctions/bus terminals) acting as transfer centers.</p>
                  
                  <div className="space-y-3">
                    {graphStats.most_connected_stations?.map((st: any, idx: number) => {
                      const codeMatch = st.name.match(/\(([^)]+)\)/);
                      const code = codeMatch ? codeMatch[1] : "";
                      return (
                        <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-900/50 border border-slate-800/80 rounded-xl">
                          <button
                            onClick={async () => {
                              if (code) {
                                try {
                                  const res = await fetch(`${BACKEND_BASE_URL}/graph/node?id=${encodeURIComponent("Station:" + code)}`);
                                  const body = await res.json();
                                  if (body.success) {
                                    setActiveNode(body);
                                  }
                                } catch (err) {
                                  console.error("Inspect failed", err);
                                }
                              }
                            }}
                            className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition text-left"
                          >
                            {st.name}
                          </button>
                          <span className="text-xs font-mono bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-lg border border-cyan-500/20 font-bold">
                            {st.connections_count} connections
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Rebuild bar */}
              <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h4 className="text-sm font-bold text-white">Manual Graph Administration</h4>
                  <p className="text-xs text-slate-500 mt-1">If you have recently added or edited travel corridors or mappings, you can rebuild the network to recalculate pathing metrics.</p>
                  {graphToast && (
                    <div className={`mt-3 flex items-center gap-2 text-xs px-4 py-2 rounded-xl border ${
                      graphToast.ok
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                      <span>{graphToast.ok ? '✓' : '✕'}</span>
                      <span>{graphToast.msg}</span>
                      <button onClick={() => setGraphToast(null)} className="ml-auto text-slate-500 hover:text-slate-300">✕</button>
                    </div>
                  )}
                </div>
                <button
                  disabled={graphLoading}
                  onClick={async () => {
                    setGraphLoading(true);
                    setGraphToast(null);
                    try {
                      const res = await fetch(`${BACKEND_BASE_URL}/graph/rebuild`, { method: "POST" });
                      const payload = await res.json();
                      if (payload.success) {
                        setGraphStats(payload);
                        setGraphToast({ msg: `Travel Knowledge Graph rebuilt — ${payload.nodes_count} nodes, ${payload.edges_count} edges.`, ok: true });
                      } else {
                        setGraphToast({ msg: "Rebuild failed: " + (payload.detail || "Unknown error"), ok: false });
                      }
                    } catch (err) {
                      setGraphToast({ msg: "Could not reach backend. Is the server running?", ok: false });
                    } finally {
                      setGraphLoading(false);
                    }
                  }}
                  className="shrink-0 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow shadow-indigo-900/40"
                >
                  {graphLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Rebuilding...
                    </span>
                  ) : "Rebuild Travel Graph"}
                </button>
              </div>

            </div>
          )}

          {/* TAB 11: RAILWAY DATASET */}
          {activeTab === "railway-dataset" && (
            <div className="space-y-8 animate-fadeIn">

              {/* Dataset Info Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-lg font-extrabold">🚂 Indian Railways Train Time Table</span>
                    <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">NDSAP Licensed</span>
                  </div>
                  <p className="text-xs text-slate-400">Source: <a href="https://data.gov.in/catalog/indian-railway-train-time-table" target="_blank" className="text-amber-400 underline hover:text-amber-300">data.gov.in</a> · License: Open Government Data License India v1.0</p>
                  {railwayStatus?.last_import && (
                    <p className="text-[10px] text-slate-500">
                      Last imported: {new Date(railwayStatus.last_import.import_date).toLocaleString("en-IN")}
                      {" · "} Version: {railwayStatus.last_import.dataset_version}
                      {" · "} Status: <span className={railwayStatus.last_import.status === "SUCCESS" ? "text-emerald-400" : "text-amber-400"}>{railwayStatus.last_import.status}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {railwayToast && (
                    <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${
                      railwayToast.ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    }`}>
                      <span>{railwayToast.ok ? "✓" : "✕"}</span>
                      <span>{railwayToast.msg}</span>
                      <button onClick={() => setRailwayToast(null)} className="ml-1 text-slate-500 hover:text-white">✕</button>
                    </div>
                  )}
                  <button
                    disabled={railwayLoading}
                    onClick={async () => {
                      setRailwayLoading(true);
                      setRailwayToast(null);
                      try {
                        const res = await fetch(`${BACKEND_BASE_URL}/railway/import?force=true`, { method: "POST" });
                        const payload = await res.json();
                        if (payload.success) {
                          setRailwayToast({ msg: payload.message, ok: true });
                          // Refresh status
                          const statusRes = await fetch(`${BACKEND_BASE_URL}/railway/status`);
                          const statusPayload = await statusRes.json();
                          if (statusPayload.success) setRailwayStatus(statusPayload);
                        } else {
                          setRailwayToast({ msg: "Import failed: " + (payload.detail || "Unknown"), ok: false });
                        }
                      } catch {
                        setRailwayToast({ msg: "Could not reach backend.", ok: false });
                      } finally {
                        setRailwayLoading(false);
                      }
                    }}
                    className="shrink-0 px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
                  >
                    {railwayLoading ? "Re-importing..." : "Re-Import Dataset"}
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              {railwayStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {[
                    { label: "Total Trains", value: railwayStatus.trains_count, color: "text-amber-400", bg: "from-amber-500/20 to-yellow-500/20", border: "border-amber-500/30" },
                    { label: "Total Stops", value: railwayStatus.stops_count, color: "text-orange-400", bg: "from-orange-500/20 to-red-500/10", border: "border-orange-500/30" },
                    { label: "Linked Trains", value: railwayStatus.linked_trains, color: "text-emerald-400", bg: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/30" },
                    { label: "Unlinked Stops", value: railwayStatus.unlinked_stations, color: "text-rose-400", bg: "from-rose-500/20 to-pink-500/10", border: "border-rose-500/30" },
                  ].map((c, i) => (
                    <div key={i} className={`p-5 rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} flex flex-col justify-between shadow-lg`}>
                      <span className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">{c.label}</span>
                      <span className={`text-3xl font-extrabold mt-3 font-mono ${c.color}`}>{c.value?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Coverage Note */}
              {railwayStatus?.coverage_note && (
                <div className="text-xs text-slate-400 bg-slate-900/40 border border-slate-800 rounded-xl px-4 py-3">
                  📊 <span className="text-slate-300 font-medium">Coverage:</span> {railwayStatus.coverage_note}
                </div>
              )}

              {/* Train Explorer */}
              <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-white">Train Explorer</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search trains, stations…"
                      value={railwaySearch}
                      onChange={async (e) => {
                        setRailwaySearch(e.target.value);
                        const q = new URLSearchParams({ page: "1", limit: "20", search: e.target.value, train_type: railwayTypeFilter });
                        const res = await fetch(`${BACKEND_BASE_URL}/railway/trains?${q}`);
                        const payload = await res.json();
                        if (payload.success) { setRailwayTrains(payload.trains); setRailwayTotal(payload.total); setRailwayPage(1); }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                    />
                    <select
                      value={railwayTypeFilter}
                      onChange={async (e) => {
                        setRailwayTypeFilter(e.target.value);
                        const q = new URLSearchParams({ page: "1", limit: "20", search: railwaySearch, train_type: e.target.value });
                        const res = await fetch(`${BACKEND_BASE_URL}/railway/trains?${q}`);
                        const payload = await res.json();
                        if (payload.success) { setRailwayTrains(payload.trains); setRailwayTotal(payload.total); setRailwayPage(1); }
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="">All Types</option>
                      <option value="Rajdhani">Rajdhani</option>
                      <option value="Shatabdi">Shatabdi</option>
                      <option value="Duronto">Duronto</option>
                      <option value="Garib Rath">Garib Rath</option>
                      <option value="Humsafar">Humsafar</option>
                      <option value="Tejas">Tejas</option>
                      <option value="Mail">Mail/Express</option>
                      <option value="Superfast">Superfast</option>
                    </select>
                  </div>
                </div>

                {/* Train List Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-900/80">
                      <tr>
                        {["Train No.", "Name", "Type", "Zone", "From", "To", "Distance", "Stops", "Linked"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {railwayTrains.map((t: any) => (
                        <tr
                          key={t.id}
                          onClick={async () => {
                            const res = await fetch(`${BACKEND_BASE_URL}/railway/trains/${t.train_number}`);
                            const payload = await res.json();
                            if (payload.success) setSelectedTrain(payload.train);
                          }}
                          className="hover:bg-slate-900/50 cursor-pointer transition group"
                        >
                          <td className="px-4 py-3 font-mono font-bold text-amber-400 group-hover:text-amber-300">{t.train_number}</td>
                          <td className="px-4 py-3 text-slate-200 max-w-[180px] truncate" title={t.train_name}>{t.train_name}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                              {t.train_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono">{t.zone || "—"}</td>
                          <td className="px-4 py-3 text-slate-300">{t.from_station_code}</td>
                          <td className="px-4 py-3 text-slate-300">{t.to_station_code}</td>
                          <td className="px-4 py-3 text-slate-400">{t.total_distance_km ? `${t.total_distance_km.toLocaleString()} km` : "—"}</td>
                          <td className="px-4 py-3 text-slate-400">{t.total_stops}</td>
                          <td className="px-4 py-3">
                            {t.source_linked && t.destination_linked
                              ? <span className="text-emerald-400">✓ Both</span>
                              : <span className="text-amber-400">⚠ Partial</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{railwayTotal} trains total · Page {railwayPage} of {Math.ceil(railwayTotal / 20)}</span>
                  <div className="flex gap-2">
                    <button
                      disabled={railwayPage <= 1}
                      onClick={async () => {
                        const np = railwayPage - 1;
                        const q = new URLSearchParams({ page: String(np), limit: "20", search: railwaySearch, train_type: railwayTypeFilter });
                        const res = await fetch(`${BACKEND_BASE_URL}/railway/trains?${q}`);
                        const payload = await res.json();
                        if (payload.success) { setRailwayTrains(payload.trains); setRailwayPage(np); }
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      ← Prev
                    </button>
                    <button
                      disabled={railwayPage >= Math.ceil(railwayTotal / 20)}
                      onClick={async () => {
                        const np = railwayPage + 1;
                        const q = new URLSearchParams({ page: String(np), limit: "20", search: railwaySearch, train_type: railwayTypeFilter });
                        const res = await fetch(`${BACKEND_BASE_URL}/railway/trains?${q}`);
                        const payload = await res.json();
                        if (payload.success) { setRailwayTrains(payload.trains); setRailwayPage(np); }
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>

              {/* Train Detail View */}
              {selectedTrain && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-5 animate-fadeIn">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold text-amber-400 font-mono">{selectedTrain.train_number}</span>
                        <span className="text-sm font-bold text-white">{selectedTrain.train_name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">{selectedTrain.train_type}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {selectedTrain.from_station_code} → {selectedTrain.to_station_code}
                        {" · "}{selectedTrain.total_distance_km?.toLocaleString()} km
                        {" · "}{selectedTrain.running_days}
                        {" · "}Zone: {selectedTrain.zone || "—"}
                      </p>
                    </div>
                    <button onClick={() => setSelectedTrain(null)} className="text-[10px] uppercase font-mono text-slate-500 hover:text-slate-300 transition">✕ Close</button>
                  </div>

                  {/* Stop Timeline */}
                  <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">Stop-by-Stop Schedule ({selectedTrain.stops?.length} stops)</p>
                    {selectedTrain.stops?.map((s: any, idx: number) => (
                      <div key={idx} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs ${
                        idx === 0 ? "bg-emerald-500/10 border border-emerald-500/20"
                        : idx === (selectedTrain.stops.length - 1) ? "bg-rose-500/10 border border-rose-500/20"
                        : "bg-slate-900/50 border border-slate-800"
                      }`}>
                        <span className="font-mono text-slate-500 w-5 text-right shrink-0">{s.stop_number}</span>
                        <div className="flex-1">
                          <span className={`font-bold ${
                            idx === 0 ? "text-emerald-400" : idx === (selectedTrain.stops.length - 1) ? "text-rose-400" : "text-slate-200"
                          }`}>
                            {s.station_code}
                          </span>
                          <span className="text-slate-400 ml-2 truncate">{s.station_name}</span>
                          {s.station_linked && <span className="ml-2 text-[9px] text-emerald-500">✓ linked</span>}
                        </div>
                        <div className="text-right font-mono text-slate-400 shrink-0">
                          <span className="text-slate-500">arr</span> {s.arrival_time || "--:--"}
                          <span className="mx-1 text-slate-700">|</span>
                          <span className="text-slate-500">dep</span> {s.departure_time || "--:--"}
                        </div>
                        <span className="text-slate-600 font-mono shrink-0">{s.distance_from_source_km} km</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 12: COVERAGE INTELLIGENCE */}
          {activeTab === "coverage-intelligence" && coverageData && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Dataset Info Banner */}
              <div className="rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-cyan-500/10 border border-violet-500/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-violet-400 text-lg font-extrabold">📊 Coverage Intelligence Hub</span>
                    <span className="text-[10px] font-mono bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">Decision Support</span>
                  </div>
                  <p className="text-xs text-slate-400">Measure, observe, and continuously optimize verified travel datasets against synthetic fallback rates.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (filterCity) params.append("city", filterCity);
                      if (filterState) params.append("state", filterState);
                      if (filterCorridor) params.append("corridor", filterCorridor);
                      if (filterMode) params.append("transport_mode", filterMode);
                      if (filterStartDate) params.append("start_date", filterStartDate);
                      if (filterEndDate) params.append("end_date", filterEndDate);
                      window.location.href = `${BACKEND_BASE_URL}/coverage/export/pdf?${params.toString()}`;
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center transition shadow-lg shadow-rose-900/10"
                  >
                    Export Executive PDF
                  </button>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams();
                      if (filterCity) params.append("city", filterCity);
                      if (filterState) params.append("state", filterState);
                      if (filterCorridor) params.append("corridor", filterCorridor);
                      if (filterMode) params.append("transport_mode", filterMode);
                      if (filterStartDate) params.append("start_date", filterStartDate);
                      if (filterEndDate) params.append("end_date", filterEndDate);
                      window.location.href = `${BACKEND_BASE_URL}/coverage/export/excel?${params.toString()}`;
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center transition shadow-lg shadow-emerald-900/10"
                  >
                    Export Detailed Excel
                  </button>
                </div>
              </div>

              {/* Interactive Query Filters Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full flex items-center justify-between px-6 py-4 text-xs font-bold text-slate-200 bg-slate-950/30 hover:bg-slate-950/50 transition border-b border-slate-800/40"
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 6.586V4z" />
                    </svg>
                    <span>Interactive Query Filters</span>
                    {(filterCity || filterState || filterCorridor || filterMode || filterStartDate || filterEndDate) && (
                      <span className="bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded text-[10px] font-mono font-normal">Active Filters Applied</span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[10px]">{showFilters ? "▲ Hide Panel" : "▼ Show Panel"}</span>
                </button>

                {showFilters && (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-slate-900 animate-slideDown">
                    
                    {/* City Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block">City</label>
                      <select
                        value={filterCity}
                        onChange={(e) => setFilterCity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      >
                        <option value="">All Cities</option>
                        {citiesList.map((c: any) => (
                          <option key={c.id} value={c.city_name}>{c.city_name}</option>
                        ))}
                      </select>
                    </div>

                    {/* State Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block">State</label>
                      <select
                        value={filterState}
                        onChange={(e) => setFilterState(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      >
                        <option value="">All States</option>
                        {statesList.map((s: string) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* Corridor Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block">Corridor Pair</label>
                      <input
                        type="text"
                        placeholder="e.g. Delhi -> Patna"
                        value={filterCorridor}
                        onChange={(e) => setFilterCorridor(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {/* Mode Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block">Transport Mode</label>
                      <select
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      >
                        <option value="">All Modes</option>
                        <option value="Train">Train</option>
                        <option value="Flight">Flight</option>
                        <option value="Bus">Bus</option>
                      </select>
                    </div>

                    {/* Date Picker Start */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block">Start Date</label>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {/* Date Picker End */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500 block">End Date</label>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {/* Reset Button */}
                    <div className="lg:col-span-6 flex justify-end gap-2 pt-2 border-t border-slate-800/40">
                      <button
                        onClick={() => {
                          setFilterCity("");
                          setFilterState("");
                          setFilterCorridor("");
                          setFilterMode("");
                          setFilterStartDate("");
                          setFilterEndDate("");
                        }}
                        className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 text-xs font-semibold rounded-lg transition"
                      >
                        Reset All Filters
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* Step 1 Clickable Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                
                <div
                  onClick={() => setDrilldownType("overall-coverage")}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 hover:border-violet-500 cursor-pointer shadow-lg shadow-violet-950/10 hover:shadow-violet-950/20 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium group-hover:text-violet-400 transition-colors">Overall Verified Search Coverage</span>
                    <span className="text-[10px] text-violet-400 font-bold bg-violet-500/10 px-1.5 py-0.5 rounded">Drilldown ➜</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-white">{coverageData.metrics.overall_search_coverage_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${coverageData.metrics.overall_search_coverage_pct}%` }}></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Calculated from recent search logs</span>
                </div>

                <div
                  onClick={() => setDrilldownType("synthetic-fallback")}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 hover:border-amber-500 cursor-pointer shadow-lg shadow-amber-950/10 hover:shadow-amber-950/20 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium group-hover:text-amber-400 transition-colors">Synthetic Fallback Rate</span>
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">Drilldown ➜</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-amber-500">{coverageData.metrics.synthetic_fallback_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${coverageData.metrics.synthetic_fallback_pct}%` }}></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Portion of queries using dummy fallbacks</span>
                </div>

                <div
                  onClick={() => setDrilldownType("city-coverage")}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 hover:border-emerald-500 cursor-pointer shadow-lg shadow-emerald-950/10 hover:shadow-emerald-950/20 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium group-hover:text-emerald-400 transition-colors">Rail Station Coverage</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Drilldown ➜</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-white">{coverageData.metrics.station_coverage_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${coverageData.metrics.station_coverage_pct}%` }}></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Portion of stations linked to timetables</span>
                </div>

                <div
                  onClick={() => setDrilldownType("corridor-coverage")}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 hover:border-cyan-500 cursor-pointer shadow-lg shadow-cyan-950/10 hover:shadow-cyan-950/20 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium group-hover:text-cyan-400 transition-colors">Corridor Verification Matrix</span>
                    <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded">Drilldown ➜</span>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-white">{coverageData.metrics.corridor_coverage_pct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${coverageData.metrics.corridor_coverage_pct}%` }}></div>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Corridors with verified direct trains</span>
                </div>

              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* LEFT COLUMN */}
                <div className="space-y-8">
                  
                  {/* Dataset Details Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dataset Overview</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl space-y-1">
                        <span className="text-slate-500 text-xs font-medium">Total Imported Trains</span>
                        <span className="text-xl font-bold text-white block">{coverageData.metrics.total_trains}</span>
                      </div>
                      <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl space-y-1">
                        <span className="text-slate-500 text-xs font-medium">Total Stops</span>
                        <span className="text-xl font-bold text-white block">{coverageData.metrics.total_stops}</span>
                      </div>
                      <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl space-y-1">
                        <span className="text-slate-500 text-xs font-medium">Cities Covered</span>
                        <span className="text-xl font-bold text-white block">{coverageData.metrics.cities_covered} / {coverageData.metrics.total_cities}</span>
                      </div>
                      <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-xl space-y-1">
                        <span className="text-slate-500 text-xs font-medium">Total Corridors</span>
                        <span className="text-xl font-bold text-white block">{coverageData.metrics.total_corridors}</span>
                      </div>
                    </div>
                  </div>

                  {/* Transfer Intelligence Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transfer Intelligence</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-slate-500 text-xs font-medium">Direct Connection Pathways</span>
                        <span className="text-lg font-bold text-white block">{coverageData.transfers.direct_connections}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs font-medium">Disconnected Stations</span>
                        <span className="text-lg font-bold text-amber-500 block">{coverageData.transfers.disconnected_stations_count}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-slate-500 text-xs font-medium">Orphan Stations (No City)</span>
                        <span className="text-lg font-bold text-rose-400 block">{coverageData.transfers.orphan_stations_count}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-slate-500 text-xs font-medium">Sampled 1-Transfer Connections</span>
                        <span className="text-lg font-bold text-white block">{coverageData.transfers.sampled_one_transfer_paths}</span>
                      </div>
                    </div>
                    {coverageData.transfers.disconnected_stations.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Top Disconnected Stations</span>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2">
                          {coverageData.transfers.disconnected_stations.map((st: any) => (
                            <div key={st.code} className="flex justify-between items-center text-xs p-2 bg-slate-950/40 rounded border border-slate-800">
                              <span className="font-semibold text-slate-300">{st.name} ({st.code})</span>
                              <span className="text-slate-500">City: {st.city}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Top Missing Corridors Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-violet-500 cursor-pointer shadow-xl transition group" onClick={() => setDrilldownType("missing-corridors")}>
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-violet-400 transition-colors">Top Uncovered High-Demand Corridors</h4>
                      <span className="text-[10px] text-violet-400 font-bold bg-violet-500/10 px-1.5 py-0.5 rounded">Drilldown ➜</span>
                    </div>
                    <div className="overflow-x-auto pointer-events-none">
                      <table className="w-full text-xs text-slate-400">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500">
                            <th className="text-left py-2 font-semibold uppercase">Origin City</th>
                            <th className="text-left py-2 font-semibold uppercase">Destination City</th>
                            <th className="text-left py-2 font-semibold uppercase">Demand Level</th>
                            <th className="text-right py-2 font-semibold uppercase">Actionable Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {coverageData.corridors.top_missing_corridors.slice(0, 5).map((c: any) => (
                            <tr key={c.id} className="border-b border-slate-800/40 hover:bg-slate-950/30">
                              <td className="py-2 text-white font-medium">{c.source}</td>
                              <td className="py-2 text-white font-medium">{c.destination}</td>
                              <td className="py-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  c.demand === "Extreme" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                                }`}>
                                  {c.demand}
                                </span>
                              </td>
                              <td className="py-2 text-right text-violet-400 font-semibold">{c.estimated_impact} Impact</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-8">
                  
                  {/* Data Quality / Gap Analysis Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-violet-500 cursor-pointer shadow-xl transition group" onClick={() => setDrilldownType("data-quality")}>
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-violet-400 transition-colors">Data Gaps & Quality Health</h4>
                      <span className="text-[10px] text-violet-400 font-bold bg-violet-500/10 px-1.5 py-0.5 rounded">Drilldown ➜</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-800 pb-4 pointer-events-none">
                      <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-0.5">
                        <span className="text-slate-500">Unlinked Station Codes</span>
                        <span className="text-lg font-bold text-rose-400 block">{coverageData.gaps.missing_stations_count}</span>
                      </div>
                      <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-0.5">
                        <span className="text-slate-500">Trains with 0 Stops</span>
                        <span className="text-lg font-bold text-amber-400 block">{coverageData.gaps.trains_missing_stops_count}</span>
                      </div>
                      <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-0.5">
                        <span className="text-slate-500">Missing Stop Timings</span>
                        <span className="text-lg font-bold text-amber-400 block">{coverageData.gaps.missing_schedules_count}</span>
                      </div>
                      <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-0.5">
                        <span className="text-slate-500">Duplicate Stop Entries</span>
                        <span className="text-lg font-bold text-rose-400 block">{coverageData.gaps.duplicate_stops_count}</span>
                      </div>
                    </div>
                    {coverageData.gaps.missing_stations.length > 0 && (
                      <div className="space-y-2 pointer-events-none">
                        <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Top Unlinked Station Codes</span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {coverageData.gaps.missing_stations.slice(0, 10).map((st: any) => (
                            <span key={st.code} className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 rounded">
                              {st.code} ({st.name.substring(0, 10)})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coverage Optimization Engine (Step 6 Simulator) */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coverage Optimization Engine</h4>
                    <p className="text-xs text-slate-400">Select missing train schedules to simulate data acquisition impact on overall verified search coverage.</p>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border border-slate-850 p-3 rounded-xl bg-slate-950/20">
                      {coverageData.recommendations.map((rec: any) => {
                        const isChecked = selectedTrains.includes(rec.train_number);
                        return (
                          <label key={rec.train_number} className="flex items-start space-x-3 text-xs p-2.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedTrains(selectedTrains.filter(t => t !== rec.train_number));
                                } else {
                                  setSelectedTrains([...selectedTrains, rec.train_number]);
                                }
                              }}
                              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-800 text-violet-600 focus:ring-violet-500 bg-slate-950"
                            />
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white">{rec.train_number} - {rec.train_name}</span>
                                <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 px-1.5 py-0.25 rounded">+{rec.impact_score} Pts</span>
                              </div>
                              <div className="flex justify-between text-slate-500 text-[10px]">
                                <span>Unlocks: {rec.unlocked_corridor}</span>
                                <span className="font-medium text-slate-400">{rec.corridor_demand} Demand</span>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-semibold">{selectedTrains.length} trains selected</span>
                      <button
                        onClick={async () => {
                          if (selectedTrains.length === 0) return;
                          setSimulating(true);
                          try {
                            const res = await fetch("http://127.0.0.1:8000/admin/coverage/simulate", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ train_numbers: selectedTrains })
                            });
                            const payload = await res.json();
                            if (payload.success) {
                              setSimulatedResults(payload.simulation);
                            }
                          } catch (e) {
                            console.error("Failed to run coverage simulation", e);
                          } finally {
                            setSimulating(false);
                          }
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center shadow-lg shadow-indigo-900/20 transition"
                        disabled={simulating || selectedTrains.length === 0}
                      >
                        {simulating ? <Icons.Spinner /> : "Simulate Growth Impact"}
                      </button>
                    </div>

                    {/* Simulation Result Overlay Panel */}
                    {simulatedResults && (
                      <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/30 space-y-3 animate-slideIn">
                        <div className="flex justify-between items-center border-b border-violet-500/20 pb-2">
                          <span className="text-xs font-bold text-violet-300 uppercase tracking-wide">Simulation Results</span>
                          <button onClick={() => setSimulatedResults(null)} className="text-violet-400 hover:text-white text-xs">✕ Clear</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 block">Direct Corridors Unlocked</span>
                            <span className="text-sm font-bold text-white block">+{simulatedResults.unlocked_direct_journeys}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Additional Transfer Routes</span>
                            <span className="text-sm font-bold text-white block">+{simulatedResults.unlocked_transfers_estimate}</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-violet-500/10 flex justify-between items-center text-xs">
                          <span className="text-slate-400">Coverage Score Change</span>
                          <span className="text-emerald-400 font-black text-sm">{simulatedResults.current_coverage_pct}% → {simulatedResults.simulated_coverage_pct}% (+{simulatedResults.percentage_increase}%)</span>
                        </div>
                      </div>
                    )}

                  </div>

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

      {/* Coverage Drill-Down Modals */}
      {drilldownType && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="h-16 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="text-violet-400">📊</span>
                {drilldownType.replace("-", " ")} Drill-Down View
              </h3>
              <button
                onClick={() => setDrilldownType(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
              >
                ✕ Close Window
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* View 1: Overall Coverage */}
              {drilldownType === "overall-coverage" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Core Metrics Progression</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Overall Coverage Score</span>
                        <span className="text-xl font-bold text-white">{coverageData.metrics.overall_search_coverage_pct}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total Active Trains</span>
                        <span className="text-xl font-bold text-white">{coverageData.metrics.total_trains}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total Station Nodes</span>
                        <span className="text-xl font-bold text-white">{coverageData.metrics.total_stations}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Total Searchable Corridors</span>
                        <span className="text-xl font-bold text-white">{coverageData.metrics.total_corridors}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
                    <span className="text-xs text-slate-400 font-semibold block uppercase">Topology Path Breakdown</span>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Direct Rail Journeys</span>
                        <span className="font-bold">{coverageData.transfers.direct_connections} connected stations</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1">
                        <div className="bg-emerald-500 h-1 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Sampled One-Transfer Journeys (1 Stopover)</span>
                        <span className="font-bold">{coverageData.transfers.sampled_one_transfer_paths} pathways</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1">
                        <div className="bg-violet-500 h-1 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>Sampled Two-Transfer Journeys (2 Stopovers)</span>
                        <span className="font-bold">{coverageData.transfers.sampled_two_transfer_paths} pathways</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1">
                        <div className="bg-cyan-500 h-1 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View 2: Synthetic Fallback */}
              {drilldownType === "synthetic-fallback" && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl text-amber-400">
                    ⚠️ <b>Synthetic Fallback Notice:</b> Synthetic fallbacks represent corridor requests that are satisfied using generated/synthetic results because verified schedules are missing in the local database.
                  </div>
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-3">
                    <span className="font-bold text-white text-sm block">Fallback Diagnostics</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block">Total fallbacks logged:</span>
                        <span className="text-lg font-bold text-white">{Math.round(coverageData.metrics.synthetic_fallback_pct / 100 * 42)} searches</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Active fallback rate:</span>
                        <span className="text-lg font-bold text-amber-500">{coverageData.metrics.synthetic_fallback_pct}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View 3: Coverage by City */}
              {drilldownType === "city-coverage" && (
                <div className="space-y-4">
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Target Cities Mapped Coverage</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {citiesList.slice(0, 30).map((c: any) => {
                      const isCovered = c.primary_station_code !== null;
                      return (
                        <div key={c.id} className="p-4 bg-slate-950/30 border border-slate-850 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white block">{c.city_name}</span>
                            <span className="text-[10px] text-slate-500">{c.state}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCovered ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"
                          }`}>
                            {isCovered ? "Mapped" : "No Code"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View 4: Coverage by Corridor */}
              {drilldownType === "corridor-coverage" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-3">
                      <span className="text-xs font-bold text-emerald-400 block uppercase">Fully Mapped Corridors ({coverageData.corridors.fully_covered_count})</span>
                      <div className="max-h-80 overflow-y-auto space-y-2 pr-1 text-xs">
                        {coverageData.corridors.fully_covered_list.map((c: any, idx: number) => (
                          <div key={idx} className="flex justify-between p-2 bg-slate-900 border border-slate-850 rounded text-slate-300">
                            <span>{c.source} ➜ {c.destination}</span>
                            <span className="text-emerald-400 font-medium">{c.demand} Demand</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-3">
                      <span className="text-xs font-bold text-amber-400 block uppercase">Partially Covered Corridors ({coverageData.corridors.partially_covered_count})</span>
                      <div className="max-h-80 overflow-y-auto space-y-2 pr-1 text-xs">
                        {coverageData.corridors.partially_covered_list.map((c: any, idx: number) => (
                          <div key={idx} className="flex justify-between p-2 bg-slate-900 border border-slate-850 rounded text-slate-300">
                            <span>{c.source} ➜ {c.destination}</span>
                            <span className="text-amber-400 font-medium">Transfer ({c.demand})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* View 5: Top Missing Corridors */}
              {drilldownType === "missing-corridors" && (
                <div className="space-y-4">
                  <span className="text-xs text-slate-400 font-semibold block uppercase">All Uncovered High-Demand Corridors</span>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-slate-400">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="text-left py-2 font-semibold uppercase">Origin City</th>
                          <th className="text-left py-2 font-semibold uppercase">Destination City</th>
                          <th className="text-left py-2 font-semibold uppercase">Corridor Demand</th>
                          <th className="text-right py-2 font-semibold uppercase">Estimated Acquisition Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coverageData.corridors.unsupported_list.map((c: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-800/40 hover:bg-slate-950/20">
                            <td className="py-2.5 text-white font-medium">{c.source}</td>
                            <td className="py-2.5 text-white font-medium">{c.destination}</td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                c.demand === "Extreme" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                              }`}>
                                {c.demand}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-violet-400 font-bold">
                              {c.demand === "Extreme" ? "CRITICAL (P0)" : "HIGH (P1)"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* View 6: Data Quality Issues */}
              {drilldownType === "data-quality" && (
                <div className="space-y-6 text-xs">
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-3">
                    <span className="text-xs font-bold text-rose-400 block uppercase">Unlinked Station Codes in timetable stops ({coverageData.gaps.missing_stations_count})</span>
                    <p className="text-slate-400 mb-2">The following station codes are referenced in the train timetable stop sequence records but do not exist in the master stations table:</p>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-900 border border-slate-850 rounded">
                      {coverageData.gaps.missing_stations.map((st: any) => (
                        <span key={st.code} className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-850 rounded">
                          {st.code} - {st.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 space-y-3">
                    <span className="text-xs font-bold text-amber-400 block uppercase">Imported Trains Missing Schedule Stop Sequences ({coverageData.gaps.trains_missing_stops_count})</span>
                    <p className="text-slate-400 mb-2">The following trains have records in the database but do not have stop sequence schedules loaded:</p>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-900 border border-slate-850 rounded">
                      {coverageData.gaps.trains_missing_stops.map((t: any) => (
                        <div key={t.number} className="flex justify-between text-slate-400 font-mono text-[10px]">
                          <span>Train Number: {t.number}</span>
                          <span>Name: {t.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
