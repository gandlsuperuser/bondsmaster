"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Plus, Trash2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { createBond } from "@/actions/bonds";

interface DefendantOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface BondFormProps {
  defendants: DefendantOption[];
}

export function BondForm({ defendants }: BondFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [defendantId, setDefendantId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<"Draft" | "Active" | "FTA" | "Discharged">("Active");
  const [powerNumber, setPowerNumber] = useState("");
  const [arrestDate, setArrestDate] = useState("");
  const [releasedDate, setReleasedDate] = useState("");

  // Dynamic lists
  const [charges, setCharges] = useState<{ description: string; degree: string }[]>([]);
  const [collaterals, setCollaterals] = useState<{ type: string; value: string; description: string }[]>([]);

  // Charge Handlers
  const handleAddCharge = () => {
    setCharges((prev) => [...prev, { description: "", degree: "" }]);
  };

  const handleRemoveCharge = (idx: number) => {
    setCharges((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleChargeChange = (idx: number, field: string, value: string) => {
    setCharges((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  };

  // Collateral Handlers
  const handleAddCollateral = () => {
    setCollaterals((prev) => [...prev, { type: "", value: "", description: "" }]);
  };

  const handleRemoveCollateral = (idx: number) => {
    setCollaterals((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCollateralChange = (idx: number, field: string, value: string) => {
    setCollaterals((prev) =>
      prev.map((col, i) => (i === idx ? { ...col, [field]: value } : col))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!defendantId) {
      setError("Please select a defendant.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid bond amount.");
      return;
    }

    if (!powerNumber.trim()) {
      setError("Power number is required.");
      return;
    }

    startTransition(async () => {
      const payload = {
        defendantId,
        amount: parsedAmount,
        status,
        powerNumber: powerNumber.trim(),
        arrestDate: arrestDate || null,
        releasedDate: releasedDate || null,
        charges: charges.filter((c) => c.description.trim() !== ""),
        collaterals: collaterals
          .filter((col) => col.type.trim() !== "")
          .map((col) => ({
            type: col.type,
            value: parseFloat(col.value) || 0,
            description: col.description || null,
          })),
      };

      const res = await createBond(payload);

      if (res.success) {
        router.push("/dashboard/bonds");
        router.refresh();
      } else {
        setError(res.error || "Failed to create bond. Please try again.");
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/bonds"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Bonds Ledger
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Create New Bond Record</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Link a defendant, assign a power number, specify collateral details, and log charges.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex gap-2 items-start p-3.5 text-xs rounded-lg border bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-500/20">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Defendant Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Defendant Link <span className="text-rose-500">*</span>
              </label>
              <select
                value={defendantId}
                onChange={(e) => setDefendantId(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-slate-200"
              >
                <option value="">-- Choose Defendant --</option>
                {defendants.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.lastName}, {d.firstName}
                  </option>
                ))}
              </select>
            </div>

            {/* Power Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Power Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={powerNumber}
                onChange={(e) => setPowerNumber(e.target.value)}
                required
                placeholder="e.g. 2018AA-987"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Bond Amount ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="e.g. 5000"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:outline-hidden"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:outline-hidden"
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="FTA">FTA</option>
                <option value="Discharged">Discharged</option>
              </select>
            </div>

            {/* Arrest Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Arrest Date
              </label>
              <input
                type="date"
                value={arrestDate}
                onChange={(e) => setArrestDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:outline-hidden [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Charges Section */}
          <div className="space-y-3 border-t border-slate-200 dark:border-slate-850 pt-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase text-slate-500">Charges Associated</h3>
              <button
                type="button"
                onClick={handleAddCharge}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Charge
              </button>
            </div>

            {charges.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No charges added yet.</p>
            ) : (
              <div className="space-y-2.5">
                {charges.map((charge, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Charge Description (e.g. Grand Theft)"
                      value={charge.description}
                      onChange={(e) => handleChargeChange(idx, "description", e.target.value)}
                      required
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Degree/Class (e.g. Felony)"
                      value={charge.degree}
                      onChange={(e) => handleChargeChange(idx, "degree", e.target.value)}
                      className="w-40 px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCharge(idx)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Collateral Section */}
          <div className="space-y-3 border-t border-slate-200 dark:border-slate-850 pt-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase text-slate-500">Collateral Tracked</h3>
              <button
                type="button"
                onClick={handleAddCollateral}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add Collateral
              </button>
            </div>

            {collaterals.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No collateral registered yet.</p>
            ) : (
              <div className="space-y-2.5">
                {collaterals.map((col, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Type (e.g. Cash, Real Estate)"
                      value={col.type}
                      onChange={(e) => handleCollateralChange(idx, "type", e.target.value)}
                      required
                      className="w-48 px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Value ($)"
                      value={col.value}
                      onChange={(e) => handleCollateralChange(idx, "value", e.target.value)}
                      required
                      className="w-32 px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Description/Location details"
                      value={col.description}
                      onChange={(e) => handleCollateralChange(idx, "description", e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCollateral(idx)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-850 pt-5 flex items-center justify-end gap-3">
            <Link
              href="/dashboard/bonds"
              className="px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Create Bond Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
