"use client";

import React, { useState, useEffect } from "react";
import styles from "./settings.module.css";
import { 
  Save, RefreshCw, CheckCircle2, Shield, 
  Store, DollarSign, Percent, Truck, Box, Lock
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState("store");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    }
    if(new URLSearchParams(window.location.search).get("section")==="shipping")setActiveSection("shipping");
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        alert("Failed to update settings");
      }
    } catch {
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { id: "store", label: "Store Profile", icon: Store },
    { id: "taxes", label: "Taxes & GST", icon: Percent },
    { id: "inventory", label: "Inventory Thresholds", icon: Box },
    { id: "shipping", label: "Shipping & Fulfillment", icon: Truck },
    { id: "security", label: "Security & Sessions", icon: Lock },
  ];

  if (loading || !settings) {
    return (
      <div className="p-16 text-center text-xs text-[#6B6B6B]">
        <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2" />
        Loading administrative configuration...
      </div>
    );
  }

  return (
    <div className={styles.settings}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Store & Operational Settings</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Configure legal identifiers, tax rates, inventory reservation timeouts, and fulfillment policies.
          </p>
        </div>
        <div className={styles.actions}>
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#111111] rounded hover:bg-black transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Navigation Sidebar */}
        <div className={styles.navigation}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                data-active={activeSection===item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-xs font-medium text-left transition-colors ${
                  activeSection === item.id
                    ? "bg-[#111111] text-[#FFFFFF]"
                    : "text-[#6B6B6B] hover:text-[#111111] hover:bg-[#F7F7F5]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className={styles.content}>
          {activeSection === "store" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#111111] border-b border-[#E5E5E5] pb-2">
                Brand & Legal Entity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[#6B6B6B] mb-1 font-medium">Store Display Name</label>
                  <input
                    type="text"
                    value={settings.store.name}
                    onChange={(e) => setSettings({ ...settings, store: { ...settings.store, name: e.target.value } })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#6B6B6B] mb-1 font-medium">Support & Concierge Email</label>
                  <input
                    type="email"
                    value={settings.store.supportEmail}
                    onChange={(e) => setSettings({ ...settings, store: { ...settings.store, supportEmail: e.target.value } })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#6B6B6B] mb-1 font-medium">Concierge Direct Phone</label>
                  <input
                    type="text"
                    value={settings.store.phone}
                    onChange={(e) => setSettings({ ...settings, store: { ...settings.store, phone: e.target.value } })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#6B6B6B] mb-1 font-medium">GST Identification Number (GSTIN)</label>
                  <input
                    type="text"
                    value={settings.store.gstin}
                    onChange={(e) => setSettings({ ...settings, store: { ...settings.store, gstin: e.target.value } })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[#111111] font-mono focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[#6B6B6B] mb-1 font-medium">Registered Office Address</label>
                  <input
                    type="text"
                    value={settings.store.address}
                    onChange={(e) => setSettings({ ...settings, store: { ...settings.store, address: e.target.value } })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[#111111] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === "taxes" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#111111] border-b border-[#E5E5E5] pb-2">
                Tax Compliance & Calculations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[#6B6B6B] mb-1 font-medium">Standard GST Rate (%)</label>
                  <input
                    type="number"
                    value={settings.taxes.standardGSTRate}
                    onChange={(e) => setSettings({ ...settings, taxes: { ...settings.taxes, standardGSTRate: Number(e.target.value) } })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#6B6B6B] mb-1 font-medium">Default HSN Classification</label>
                  <input
                    type="text"
                    value={settings.taxes.hsnCodeDefault}
                    onChange={(e) => setSettings({ ...settings, taxes: { ...settings.taxes, hsnCodeDefault: e.target.value } })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[#111111] font-mono focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.taxes.inclusivePricing}
                      onChange={(e) => setSettings({ ...settings, taxes: { ...settings.taxes, inclusivePricing: e.target.checked } })}
                      className="rounded border-[#E5E5E5] text-[#111111] focus:ring-0"
                    />
                    <span className="text-[#111111] font-medium">
                      All catalog retail prices are inclusive of GST (Luxury Retail Standard)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === "inventory" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#111111] border-b border-[#E5E5E5] pb-2">
                Inventory Safeguards & Reservation Limits
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[#6B6B6B] mb-1 font-medium">Low Stock Warning Threshold</label>
                  <input
                    type="number"
                    value={settings.inventory.lowStockThreshold}
                    onChange={(e) => setSettings({ ...settings, inventory: { ...settings.inventory, lowStockThreshold: Number(e.target.value) } })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[#111111] focus:outline-none"
                  />
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">Triggers dashboard alert when available stock dips below this value.</p>
                </div>
                <div>
                  <label className="block text-[#6B6B6B] mb-1 font-medium">Checkout Hold / Reservation Duration (Minutes)</label>
                  <input
                    type="number"
                    value={settings.inventory.reserveDurationMinutes}
                    onChange={(e) => setSettings({ ...settings, inventory: { ...settings.inventory, reserveDurationMinutes: Number(e.target.value) } })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[#111111] focus:outline-none"
                  />
                  <p className="text-[10px] text-[#6B6B6B] mt-0.5">Locks units during active payment window to prevent overselling.</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === "shipping" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#111111] border-b border-[#E5E5E5] pb-2">
                Fulfillment Rules & Logistics Defaults
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {([['standardShippingFee','Standard Shipping (₹)'],['freeShippingThreshold','Free Shipping Threshold (₹)']] as const).map(([field,label])=><label key={field} className="block text-[#6B6B6B] font-medium">{label}<input aria-label={label} type="number" min="0" step="0.01" value={settings.shipping[field]} onChange={(event)=>setSettings({...settings,shipping:{...settings.shipping,[field]:Number(event.target.value)}})} className="mt-1 w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded text-[#111111]"/></label>)}
                <div>
                  <label className="block text-[#6B6B6B] mb-1 font-medium">Primary Courier Partner</label>
                  <input
                    type="text"
                    value={settings.shipping.defaultCourier}
                    onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, defaultCourier: e.target.value } })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#6B6B6B] mb-1 font-medium">Primary Hub / Dispatch Origin</label>
                  <input
                    type="text"
                    value={settings.shipping.defaultWarehouse}
                    onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, defaultWarehouse: e.target.value } })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[#111111] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.shipping.autoGenerateAWB}
                      onChange={(e) => setSettings({ ...settings, shipping: { ...settings.shipping, autoGenerateAWB: e.target.checked } })}
                      className="rounded border-[#E5E5E5] text-[#111111] focus:ring-0"
                    />
                    <span className="text-[#111111] font-medium">
                      Automatically generate Delhivery AWB upon order payment confirmation
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#111111] border-b border-[#E5E5E5] pb-2">
                Admin Session Security & Rate Limits
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[#6B6B6B] mb-1 font-medium">Admin Session Inactivity Timeout (Minutes)</label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeoutMinutes}
                    onChange={(e) => setSettings({ ...settings, security: { ...settings.security, sessionTimeoutMinutes: Number(e.target.value) } })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[#111111] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#6B6B6B] mb-1 font-medium">Rate Limiting (Max Requests / Minute / IP)</label>
                  <input
                    type="number"
                    value={settings.security.rateLimitRequestsPerMinute}
                    onChange={(e) => setSettings({ ...settings, security: { ...settings.security, rateLimitRequestsPerMinute: Number(e.target.value) } })}
                    className="w-full px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] rounded text-[#111111] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.requireTwoFactorForRefunds}
                      onChange={(e) => setSettings({ ...settings, security: { ...settings.security, requireTwoFactorForRefunds: e.target.checked } })}
                      className="rounded border-[#E5E5E5] text-[#111111] focus:ring-0"
                    />
                    <span className="text-[#111111] font-medium">
                      Enforce Step-Up Verification for high-value refunds above ₹50,000
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
