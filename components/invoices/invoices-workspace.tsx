"use client";

import React, { useState } from "react";
import { Receipt, CreditCard, ExternalLink, Calendar, CheckCircle2, AlertCircle, Download } from "lucide-react";
import Link from "next/link";

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
  payments?: { amount: number; date: Date }[];
}

interface InvoicesWorkspaceProps {
  bonds: Bond[];
}

export function InvoicesWorkspace({ bonds }: InvoicesWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"ledger" | "plans">("ledger");

  // Generate Invoices from active bonds
  const invoices = bonds.map((bond) => {
    const premiumAmount = bond.amount * 0.1; // 10% standard premium
    const totalPaid = bond.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const balance = premiumAmount - totalPaid;
    const status = balance <= 0 ? "Paid" : "Unpaid";
    const dueDate = new Date(new Date(bond.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days due
    return {
      id: `INV-${bond.id.slice(0, 8).toUpperCase()}`,
      bondId: bond.id,
      powerNumber: bond.powers[0]?.powerNumber || "N/A",
      defendant: `${bond.defendant.lastName}, ${bond.defendant.firstName}`,
      premiumAmount,
      totalPaid,
      balance,
      status,
      dueDate,
    };
  });

  const handleDownloadPDF = (invoice: typeof invoices[0]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${invoice.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
            .meta { text-align: right; font-size: 12px; }
            .details { margin-bottom: 30px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f3f4f6; }
            .total-row { font-weight: bold; background-color: #eff6ff; }
            .footer { margin-top: 50px; font-size: 11px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">BondsMaster Invoice</div>
              <div>Bail Bonds Agency Services</div>
            </div>
            <div class="meta">
              <div><strong>Invoice ID:</strong> ${invoice.id}</div>
              <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
              <div><strong>Due Date:</strong> ${invoice.dueDate.toLocaleDateString()}</div>
            </div>
          </div>
          
          <div class="details">
            <p><strong>Bill To:</strong> ${invoice.defendant}</p>
            <p><strong>Bond Power Number:</strong> ${invoice.powerNumber}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount Due</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>10% Premium Rate on Posted Bail Bond Liability</td>
                <td style="text-align: right;">$${invoice.premiumAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td><strong>Total Paid Installments</strong></td>
                <td style="text-align: right; color: #10b981;">-$${invoice.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="total-row">
                <td>Remaining Balance Outstanding</td>
                <td style="text-align: right;">$${invoice.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            Thank you for your business. Please remit payments promptly.
          </div>
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
          Premium Invoices Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage payment premium balances, view billing statements, and review installment plans.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: "ledger" as const, label: "Invoice Ledger", icon: <Receipt className="h-4 w-4" /> },
          { id: "plans" as const, label: "Payment Plans & Installments", icon: <CreditCard className="h-4 w-4" /> },
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

      {/* ── Sub-tab View: Invoice Ledger ── */}
      {activeTab === "ledger" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Premium Billing Statements</h3>
          </div>

          {invoices.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center border rounded-xl">
              No invoice records found.
            </p>
          ) : (
            <div className="overflow-x-auto border border-slate-350 dark:border-slate-800 rounded-xl">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                    <th className="py-3 px-4">Invoice ID</th>
                    <th className="py-3 px-4">Power Number</th>
                    <th className="py-3 px-4">Defendant Name</th>
                    <th className="py-3 px-4 text-right">Premium Due</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Due Date</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-250 dark:divide-slate-800">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                        {inv.id}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {inv.powerNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {inv.defendant}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 text-right">
                        ${inv.premiumAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 text-right">
                        ${inv.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-right">
                        ${inv.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          inv.status === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-500/20"
                            : "bg-rose-50 text-rose-700 border-rose-500/20"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 font-mono">
                        {inv.dueDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="py-3.5 px-4 text-center flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleDownloadPDF(inv)}
                          className="inline-block p-1 rounded-md border border-slate-250 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-955/30 transition-colors cursor-pointer"
                          title="Download PDF Invoice"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <Link
                          href={`/dashboard/bonds/${inv.bondId}`}
                          className="inline-block p-1 rounded-md border border-slate-250 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-955/30 transition-colors"
                          title="View Bond details"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Sub-tab View: Payment Plans ── */}
      {activeTab === "plans" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Payment Installment Plans</h3>
            <p className="text-xs text-muted-foreground mt-0.5">List of co-signed payment arrangements and receipts.</p>
          </div>

          <div className="space-y-3">
            {bonds
              .filter((b) => (b.payments?.length || 0) > 0)
              .map((b) => (
                <div key={b.id} className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-950/30 text-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Defendant: {b.defendant.lastName}, {b.defendant.firstName}
                    </span>
                    <span className="font-mono text-slate-400">Power: {b.powers[0]?.powerNumber || "N/A"}</span>
                  </div>

                  <div className="space-y-1.5 border-t pt-2">
                    <p className="font-bold text-[10px] uppercase text-slate-400">Installment History</p>
                    {b.payments?.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] p-2 bg-white dark:bg-slate-900 border rounded-md">
                        <span>Payment #{idx + 1} - {new Date(p.date).toLocaleString()}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">+${p.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
