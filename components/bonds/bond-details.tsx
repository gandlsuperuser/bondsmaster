"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  User,
  Activity,
  DollarSign,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Plus,
  Loader2,
  Calendar,
  Shield,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { updateBondStatus, deleteBond } from "@/actions/bonds";
import { createPaymentAction } from "@/actions/defendant-details";

interface BondDetailsProps {
  bond: {
    id: string;
    amount: number;
    status: string;
    arrestDate: Date | null;
    releasedDate: Date | null;
    createdAt: Date;
    defendant: {
      id: string;
      firstName: string;
      lastName: string;
    };
    powers: { id: string; powerNumber: string }[];
    charges: { id: string; description: string; degree: string | null }[];
    collateral: { id: string; type: string; value: number; description: string | null }[];
    statusHistory: { id: string; status: string; changedAt: Date }[];
    payments: { id: string; amount: number; date: Date }[];
  };
}

export function BondDetails({ bond }: BondDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [status, setStatus] = useState(bond.status);

  const formatDateTime = (date: any) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as any;
    setStatus(nextStatus);

    startTransition(async () => {
      const res = await updateBondStatus(bond.id, nextStatus);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to update status");
        setStatus(bond.status); // revert
      }
    });
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) return;

    startTransition(async () => {
      const res = await createPaymentAction(bond.id, amt, bond.defendant.id);
      if (res.success) {
        setPaymentAmount("");
        router.refresh();
      } else {
        alert(res.error || "Failed to record payment");
      }
    });
  };

  const handleDeleteBond = async () => {
    if (confirm("Are you sure you want to delete this bond record?")) {
      startTransition(async () => {
        const res = await deleteBond(bond.id);
        if (res.success) {
          router.push("/dashboard/bonds");
        } else {
          alert(res.error || "Failed to delete bond");
        }
      });
    }
  };

  const totalPaid = bond.payments.reduce((sum, p) => sum + p.amount, 0);
  const powerNumber = bond.powers[0]?.powerNumber || "N/A";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-xl shadow-xs">
        <div className="space-y-1">
          <Link
            href="/dashboard/bonds"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Bonds
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white pt-1">
            Bond Power: <span className="font-mono text-blue-600 dark:text-blue-400">{powerNumber}</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Defendant:{" "}
            <Link
              href={`/dashboard/defendants/${bond.defendant.id}`}
              className="font-semibold text-slate-700 dark:text-slate-300 hover:underline"
            >
              {bond.defendant.lastName}, {bond.defendant.firstName}
            </Link>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status selector */}
          <div className="relative">
            <select
              value={status}
              onChange={handleStatusChange}
              disabled={isPending}
              className="pl-8 pr-8 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:outline-hidden font-bold"
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="FTA">FTA</option>
              <option value="Discharged">Discharged</option>
            </select>
            <Activity className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>

          <button
            onClick={handleDeleteBond}
            disabled={isPending}
            className="p-1.5 rounded-lg border bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-500/10 hover:bg-rose-100 transition-colors cursor-pointer"
            title="Delete Bond Record"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Details & Charges */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-blue-500" />
              General Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-medium">Bond Amount</span>
                <p className="text-base font-bold text-slate-850 dark:text-slate-100">
                  ${bond.amount.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-medium">Record Created</span>
                <p className="text-slate-700 dark:text-slate-300 font-mono">
                  {formatDateTime(bond.createdAt)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-medium">Arrest Date</span>
                <p className="text-slate-700 dark:text-slate-300">{formatDate(bond.arrestDate)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-medium">Released Date</span>
                <p className="text-slate-700 dark:text-slate-300">{formatDate(bond.releasedDate)}</p>
              </div>
            </div>
          </div>

          {/* Charges */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-purple-500" />
              Charges Listed
            </h3>
            {bond.charges.length === 0 ? (
              <p className="text-xs text-muted-foreground">No charges registered on this bond.</p>
            ) : (
              <div className="space-y-2">
                {bond.charges.map((charge) => (
                  <div key={charge.id} className="flex justify-between items-center text-xs p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-lg">
                    <span className="font-semibold text-slate-850 dark:text-slate-200">{charge.description}</span>
                    {charge.degree && (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                        {charge.degree}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Collaterals */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Collateral Tracked
            </h3>
            {bond.collateral.length === 0 ? (
              <p className="text-xs text-muted-foreground">No collateral registered on this bond.</p>
            ) : (
              <div className="space-y-3">
                {bond.collateral.map((col) => (
                  <div key={col.id} className="p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-lg text-xs space-y-1 flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{col.type}</p>
                      {col.description && <p className="text-slate-400 mt-0.5">{col.description}</p>}
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">${col.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Payments & Status History */}
        <div className="space-y-6">
          {/* Premium & Payments */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Premium Payments
            </h3>

            <div className="bg-slate-50 dark:bg-slate-950/20 p-4 border rounded-xl flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-400 font-medium">Total Paid</span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ${totalPaid.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Record Payment Form */}
            <form onSubmit={handleAddPayment} className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Amount ($)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 200"
                  required
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Log Payment
              </button>
            </form>

            {/* Payments List */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Payments Log</h4>
              {bond.payments.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">No payments logged yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {bond.payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-[11px] p-2 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-md">
                      <span>{formatDateTime(p.date)}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">+${p.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-rose-500" />
              Status Transitions
            </h3>

            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 pl-4 space-y-4 py-1 text-xs">
              {bond.statusHistory.map((hist) => (
                <div key={hist.id} className="relative">
                  <span className="absolute -left-[21px] top-0.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full">
                    <CheckCircle className="h-2 w-2 text-blue-500" />
                  </span>
                  <p className="font-bold text-slate-850 dark:text-slate-100">{hist.status}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{formatDateTime(hist.changedAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
