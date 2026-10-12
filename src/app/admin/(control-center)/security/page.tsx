"use client";
import { useLiveAdminRefresh } from "@/components/admin/use-live-admin-refresh";

import React, { useState, useEffect } from "react";
import { 
  Shield, Key, Lock, AlertTriangle, UserCheck, 
  RefreshCw, Laptop, Smartphone, Search, Filter, CheckCircle2, XCircle
} from "lucide-react";

export default function AdminSecurityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [sessions,setSessions]=useState<any[]>([]);
  const [error,setError]=useState("");
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionTerminated, setSessionTerminated] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/security", {cache:"no-store"});
      const data = await res.json();
      if(!res.ok || !data.success)throw new Error(data.error || "Could not load security data");
      setLogs(data.auditLogs);setSessions(data.securityOverview.activeSessions);setError("");
    } catch (e) {
      if (e instanceof Error && (e.name === "AbortError" || e.message.toLowerCase().includes("abort"))) {
        return;
      }
      setError(e instanceof Error ? e.message : "Could not load security data");
    } finally {
      setLoading(false);
    }
  }

  const handleTerminateOtherSessions = async () => {
    if(!confirm("Revoke all your other owner sessions?"))return;
    try{const response=await fetch("/api/admin/security",{method:"POST"});const data=await response.json();if(!response.ok || !data.success)throw new Error("Could not revoke sessions");setSessionTerminated(true);await fetchLogs(true);}catch(cause){setError(cause instanceof Error ? cause.message : "Could not revoke sessions");}
  };

  useLiveAdminRefresh(() => fetchLogs(true));

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== "ALL" && log.action !== filterAction) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.actor?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.resourceId?.toLowerCase().includes(q) ||
        log.resource?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111111]">Security & Immutable Audit Logs</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Monitor shop-owner access sessions, privilege verifications, and compliance audit trail.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchLogs()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#111111] bg-[#FFFFFF] border border-[#E5E5E5] rounded hover:bg-[#F7F7F5] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Logs
          </button>
          <button
            onClick={handleTerminateOtherSessions}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            Revoke All Other Sessions
          </button>
        </div>
      </div>

      {sessionTerminated && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          All secondary sessions revoked successfully. Only this current active session remains authorized.
        </div>
      )}

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#FFFFFF] border border-[#E5E5E5] rounded">
          <span className="text-[11px] uppercase tracking-wider text-[#6B6B6B]">Authorization Model</span>
          <div className="text-sm font-bold text-[#111111] mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Server-Side RBAC (OWNER)
          </div>
          <div className="text-[10px] text-[#6B6B6B] mt-1">HttpOnly Lax Cookie Protection</div>
        </div>

        <div className="p-4 bg-[#FFFFFF] border border-[#E5E5E5] rounded">
          <span className="text-[11px] uppercase tracking-wider text-[#6B6B6B]">Active Owner Sessions</span>
          <div className="text-sm font-bold text-[#111111] mt-1">{sessions.length} stored sessions</div>
          <div className="text-[10px] text-emerald-600 mt-1">Unexpired owner sessions</div>
        </div>

        <div className="p-4 bg-[#FFFFFF] border border-[#E5E5E5] rounded">
          <span className="text-[11px] uppercase tracking-wider text-[#6B6B6B]">Failed Customer Escalations</span>
          <div className="text-sm font-bold text-[#111111] mt-1">Not recorded</div>
          <div className="text-[10px] text-[#6B6B6B] mt-1">Customer /admin requests blocked (403)</div>
        </div>

        <div className="p-4 bg-[#FFFFFF] border border-[#E5E5E5] rounded">
          <span className="text-[11px] uppercase tracking-wider text-[#6B6B6B]">Database Encryption</span>
          <div className="text-sm font-bold text-[#111111] mt-1">Not reported</div>
          <div className="text-[10px] text-emerald-600 mt-1">Database encryption health is not measured</div>
        </div>
      </div>

      {error && <p role="alert">{error}</p>}
      <section className="admin-metric-panel"><h2>Current authorized sessions</h2>{sessions.map(session=><div className="admin-summary-row" key={session.id}><span>{session.device}<small>{session.ip} - {session.location}</small></span><span>{session.current ? "This session" : session.lastActive}</span></div>)}{!sessions.length && <p>No session records loaded.</p>}</section>

      {/* Audit Logs Table */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-[#111111] uppercase tracking-wider">
              Immutable Audit Events
            </h3>
            <p className="text-[11px] text-[#6B6B6B]">
              Recorded administrative actions from the store database.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
              <input
                type="text"
                placeholder="Search actor or resource..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-[#F7F7F5] border border-[#E5E5E5] rounded text-[#111111] focus:outline-none w-48"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="text-xs bg-[#FFFFFF] border border-[#E5E5E5] rounded px-2.5 py-1.5 text-[#111111] focus:outline-none"
            >
              <option value="ALL">All Actions</option>
              <option value="ORDER_STATUS_TRANSITION">Order Transitions</option>
              <option value="INVENTORY_ADJUSTMENT">Inventory Adjustments</option>
              <option value="OWNER_SIGN_IN">Owner Sign In</option>
              <option value="STORE_SETTINGS_UPDATE">Settings Changes</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#6B6B6B]">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6B6B6B]">No audit events matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F5] border-b border-[#E5E5E5] text-[#6B6B6B] font-medium">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Resource</th>
                  <th className="py-2.5 px-4">Resource ID</th>
                  <th className="py-2.5 px-4">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F7F7F5]/50 transition-colors font-mono text-[11px]">
                    <td className="py-2.5 px-4 text-[#6B6B6B]">
                      {new Date(log.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-4 text-[#111111]">{log.actor}</td>
                    <td className="py-2.5 px-4 font-semibold text-[#111111]">{log.action}</td>
                    <td className="py-2.5 px-4 text-[#6B6B6B]">{log.resource}</td>
                    <td className="py-2.5 px-4 text-[#111111] font-medium">{log.resourceId}</td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        log.result === "SUCCESS" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
