"use client";

import React, { useState } from "react";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Bond {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
  defendant: {
    id: string;
    firstName: string;
    lastName: string;
  };
  powers: { powerNumber: string }[];
  payments?: { amount: number }[];
}

interface ReportsWorkspaceProps {
  bonds: Bond[];
}

export function ReportsWorkspace({ bonds }: ReportsWorkspaceProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"liability" | "collection" | "auditing" | "pl">(
    (searchParams.get("tab") as any) || "liability"
  );

  const totalLiability = bonds.reduce((sum, b) => sum + b.amount, 0);
  const targetPremium = totalLiability * 0.1;
  const totalCollected = bonds.reduce(
    (sum, b) => sum + (b.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0),
    0
  );
  const collectionRate = targetPremium > 0 ? (totalCollected / targetPremium) * 100 : 0;

  // P&L Metrics
  const premiumOutstanding = targetPremium - totalCollected;
  const suretyFees = totalLiability * 0.015; // 1.5% of total liability
  const agentCommissions = totalCollected * 0.20; // 20% commission on collections
  const overhead = 1200; // Mock agency overhead
  const totalExpenses = suretyFees + agentCommissions + overhead;
  const netIncome = targetPremium - totalExpenses;

  const handlePrintPL = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>BondsMaster Profit & Loss Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
            .meta { font-size: 12px; margin-top: 5px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { padding: 12px; text-align: left; }
            .section-header { font-weight: bold; background-color: #f3f4f6; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; }
            .indented { padding-left: 24px; }
            .total-row { font-weight: bold; border-top: 2px solid #000; border-bottom: 2px double #000; }
            .text-right { text-align: right; }
            .text-green { color: #10b981; }
            .text-red { color: #ef4444; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">BondsMaster Bail Bonds Agency</div>
            <div class="title" style="font-size: 18px; margin-top: 5px; color: #555;">Profit & Loss Statement</div>
            <div class="meta">For period: Jan 1, 2026 - Dec 31, 2026 | Generated on ${new Date().toLocaleDateString()}</div>
          </div>
          
          <table>
            <tbody>
              <!-- REVENUE -->
              <tr class="section-header">
                <td colspan="2">Revenue (Income)</td>
              </tr>
              <tr class="indented">
                <td class="indented">Premium Collected (Installments Received)</td>
                <td class="text-right">$${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="indented">
                <td class="indented">Premium Receivables (Outstanding Balance)</td>
                <td class="text-right">$${premiumOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="total-row" style="border: none; font-weight: bold; background-color: #eff6ff;">
                <td>Total Revenue</td>
                <td class="text-right">$${targetPremium.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              
              <!-- EXPENSES -->
              <tr class="section-header" style="margin-top: 20px;">
                <td colspan="2">Expenses</td>
              </tr>
              <tr class="indented">
                <td class="indented">Surety Underwriting Fees (1.5% of liability)</td>
                <td class="text-right text-red">-$${suretyFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="indented">
                <td class="indented">Agent Commissions (20% of collections)</td>
                <td class="text-right text-red">-$${agentCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="indented">
                <td class="indented">Office & Administrative Overhead</td>
                <td class="text-right text-red">-$${overhead.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="total-row" style="border: none; font-weight: bold; background-color: #fef2f2;">
                <td>Total Expenses</td>
                <td class="text-right text-red">-$${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              
              <!-- NET INCOME -->
              <tr class="total-row">
                <td>Net Income / Net Profit</td>
                <td class="text-right ${netIncome >= 0 ? "text-green" : "text-red"}">
                  $${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-xl shadow-xs">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Agency Reports & Business Intelligence
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review financial risks, collections efficiency metrics, and active bond logs.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: "liability" as const, label: "Liability Analysis", icon: <Layers className="h-4 w-4" /> },
          { id: "collection" as const, label: "Collection Efficiency", icon: <TrendingUp className="h-4 w-4" /> },
          { id: "auditing" as const, label: "Auditing & Ledger Statuses", icon: <Activity className="h-4 w-4" /> },
          { id: "pl" as const, label: "Profit & Loss (P&L)", icon: <DollarSign className="h-4 w-4" /> },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 flex items-center gap-2 shrink-0 -mb-[1px] cursor-pointer ${
                active
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Sub-tab View: Liability Analysis ── */}
      {activeTab === "liability" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border p-6 rounded-xl flex items-center gap-4 shadow-xs">
              <div className="p-3.5 bg-blue-100 dark:bg-blue-955 text-blue-600 dark:text-blue-400 rounded-xl">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Posted Bonds</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  ${totalLiability.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border p-6 rounded-xl flex items-center gap-4 shadow-xs">
              <div className="p-3.5 bg-violet-100 dark:bg-violet-955 text-violet-600 dark:text-violet-400 rounded-xl">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Active Risk Exposure</span>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  ${bonds
                    .filter((b) => b.status === "Active")
                    .reduce((sum, b) => sum + b.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Liability Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b text-slate-500 font-semibold uppercase">
                    <th className="py-2.5 px-3">Power Number</th>
                    <th className="py-2.5 px-3">Defendant</th>
                    <th className="py-2.5 px-3 text-right">Bond Amount</th>
                    <th className="py-2.5 px-3 text-center">Date Posted</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bonds
                    .filter((b) => b.status === "Active")
                    .slice(0, 10)
                    .map((bond) => (
                      <tr key={bond.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="py-3 px-3 font-mono font-bold">{bond.powers[0]?.powerNumber || "N/A"}</td>
                        <td className="py-3 px-3 font-semibold">{bond.defendant.lastName}, {bond.defendant.firstName}</td>
                        <td className="py-3 px-3 font-bold text-right">${bond.amount.toLocaleString()}</td>
                        <td className="py-3 px-3 text-center text-slate-500 font-mono">
                          {new Date(bond.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-tab View: Collection Efficiency ── */}
      {activeTab === "collection" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-violet-100 dark:bg-violet-955 text-violet-600 dark:text-violet-400 rounded-xl">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Premium Goal (10%)</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  ${targetPremium.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-955 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Collected</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  ${totalCollected.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-955 text-amber-600 dark:text-amber-400 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Collection Rate</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {collectionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-tab View: Auditing ── */}
      {activeTab === "auditing" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Status Auditing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Active Bonds</span>
              <p className="text-xl font-bold mt-1">{bonds.filter(b=>b.status === "Active").length}</p>
            </div>
            <div className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Discharged Bonds</span>
              <p className="text-xl font-bold mt-1">{bonds.filter(b=>b.status === "Discharged").length}</p>
            </div>
            <div className="p-4 border rounded-xl bg-rose-50/20 dark:bg-rose-950/10 border-rose-500/10">
              <span className="text-[10px] font-bold text-rose-500 uppercase">Failure to Appear (FTA)</span>
              <p className="text-xl font-bold mt-1 text-rose-600">{bonds.filter(b=>b.status === "FTA").length}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-tab View: Profit & Loss (P&L) ── */}
      {activeTab === "pl" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Profit & Loss (P&L) Statement</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Calculated financial statement representing revenues, underwriting overheads, and net agency income.</p>
            </div>
            <button
              onClick={handlePrintPL}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Print P&L Statement
            </button>
          </div>

          <div className="space-y-4 text-sm font-medium">
            {/* Revenue */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Revenue (Income)</h4>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-lg">
                <span>Premium Collected (Installments Received)</span>
                <span className="font-bold">${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-lg">
                <span>Premium Receivables (Outstanding Balance)</span>
                <span className="font-bold">${premiumOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-150 font-bold text-slate-800 dark:text-slate-100 rounded-lg">
                <span>Total Revenue</span>
                <span>${targetPremium.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Expenses */}
            <div className="space-y-2 pt-2">
              <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Expenses</h4>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-lg">
                <span>Surety Underwriting Fees (1.5% of total liability)</span>
                <span className="font-bold text-rose-600">-${suretyFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-lg">
                <span>Agent Commissions (20% of collections)</span>
                <span className="font-bold text-rose-600">-${agentCommissions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-lg">
                <span>Office & Administrative Overhead</span>
                <span className="font-bold text-rose-600">-${overhead.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-150 font-bold text-rose-700 dark:text-rose-400 rounded-lg">
                <span>Total Expenses</span>
                <span>-${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Net Income */}
            <div className="pt-4 border-t-2 border-slate-300 dark:border-slate-800">
              <div className="flex justify-between p-4 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-extrabold text-sm rounded-lg text-slate-900 dark:text-white">
                <span>Net Income (Profit / Loss)</span>
                <span className={netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}>
                  ${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
