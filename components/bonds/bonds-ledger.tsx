"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  FolderOpen,
  Filter,
  Printer,
  FileText,
  Tag,
  Clock,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

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
}

interface BondsLedgerProps {
  bonds: Bond[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

const LAST_OPENED = [
  "ANDERSON, TERRY",
  "VIGIL, ELINITA",
  "ASHAN, WARSI",
  "PAYTON, JOHN",
  "BIGSBY, GARY",
  "BLACK, TYRONE",
  "MICHEAL, GEORGER",
  "FRANKS, RHONDA",
  "ALDEEN, DOREEN",
  "GARCIA, TYRONE",
  "CASSO, NICOLAS",
  "ALDENE, JAMEST R",
  "BRADY, GARY",
];

const LABELS = [
  { name: "Credit Invest", color: "bg-red-500" },
  { name: "Bond Splits", color: "bg-orange-400" },
  { name: "Deed of Trust", color: "bg-yellow-500" },
  { name: "Cash Collateral", color: "bg-green-500" },
  { name: "Reinstated", color: "bg-purple-500" },
  { name: "No Label", color: "bg-slate-300 dark:bg-slate-700" },
];

export function BondsLedger({ bonds, pagination }: BondsLedgerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeFilter, setActiveFilter] = useState("Active Bonds");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [letterFilter, setLetterFilter] = useState(searchParams.get("letter") || "");
  const [insurer, setInsurer] = useState("All");
  const [office, setOffice] = useState("All");
  const [agent, setAgent] = useState("All");
  const [court, setCourt] = useState("All");

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set("query", searchQuery);
    } else {
      params.delete("query");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLetterClick = (letter: string) => {
    const nextLetter = letterFilter === letter ? "" : letter;
    setLetterFilter(nextLetter);

    const params = new URLSearchParams(searchParams.toString());
    if (nextLetter) {
      params.set("letter", nextLetter);
    } else {
      params.delete("letter");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusTabClick = (statusFilter: string) => {
    setActiveFilter(statusFilter);
    const params = new URLSearchParams(searchParams.toString());

    let statusVal = "all";
    if (statusFilter === "Active Bonds") statusVal = "Active";
    else if (statusFilter === "Discharged Bonds") statusVal = "Discharged";
    else if (statusFilter === "Saved Drafts") statusVal = "Draft";
    else if (statusFilter === "FTA Bonds") statusVal = "FTA";

    if (statusVal !== "all") {
      params.set("status", statusVal);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setLetterFilter("");
    router.push(pathname);
  };

  const totalLiability = bonds.reduce((acc, b) => acc + b.amount, 0);

  return (
    <div className="flex gap-6 h-full items-start flex-col xl:flex-row">
      {/* LEFT COLUMN: Sub-Sidebar */}
      <div className="w-full xl:w-64 shrink-0 flex flex-col gap-6">
        {/* 1. Bond Section Navigator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Bond Section</h3>
          </div>
          <div className="p-2 flex flex-col gap-1 text-xs">
            {[
              { name: "All Bonds", count: pagination.total },
              { name: "Active Bonds", count: null },
              { name: "Discharged Bonds", count: null },
              { name: "Saved Drafts", count: null },
              { name: "FTA Bonds", count: null },
            ].map((item, idx) => {
              const active = activeFilter === item.name;
              return (
                <button
                  key={idx}
                  onClick={() => handleStatusTabClick(item.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    active
                      ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  <span>{item.name}</span>
                  {item.count !== null && (
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full font-semibold">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Search Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Quick Search</h3>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-850 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-100 outline-hidden flex-1"
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md font-bold cursor-pointer"
              >
                Go
              </button>
            </form>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* 3. Last 15 Opened */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Last 15 Opened</h3>
          </div>
          <div className="p-2 flex flex-col max-h-60 overflow-y-auto no-scrollbar gap-2 text-xs">
            {LAST_OPENED.map((name, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchQuery(name.split(",")[0]);
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("query", name.split(",")[0]);
                  router.push(`${pathname}?${params.toString()}`);
                }}
                className="w-full text-left px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-md font-semibold hover:underline tracking-wide leading-normal cursor-pointer"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Bonds Ledger grid */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-xs p-6">
        {/* Title and Top Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Active Bonds Ledger
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage status labels, track active liabilities, and record discharges.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-2.5">
            <div className="flex flex-col">
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
                Total Liability
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-slate-50">
                ${totalLiability.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Top Filter Panel */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end bg-slate-50 dark:bg-slate-850/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase">Insurer</label>
            <select
              value={insurer}
              onChange={(e) => setInsurer(e.target.value)}
              className="text-xs border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 p-2 outline-hidden text-slate-700 dark:text-slate-300"
            >
              <option>All</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase">Office</label>
            <select
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              className="text-xs border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 p-2 outline-hidden text-slate-700 dark:text-slate-300"
            >
              <option>All</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase">Agent</label>
            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="text-xs border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 p-2 outline-hidden text-slate-700 dark:text-slate-300"
            >
              <option>All</option>
              <option>Inventory</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[10px] font-semibold text-slate-500 uppercase">Court Name</label>
            <select
              value={court}
              onChange={(e) => setCourt(e.target.value)}
              className="text-xs border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 p-2 outline-hidden text-slate-700 dark:text-slate-300"
            >
              <option>All</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase">Min Bond</label>
            <input
              type="text"
              placeholder="$10.00"
              className="text-xs border border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 p-2 outline-hidden"
            />
          </div>
          <button className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white transition-colors text-xs shadow-xs flex items-center justify-center cursor-pointer">
            Go
          </button>
        </div>

        {/* Labels bar */}
        <div className="flex flex-wrap gap-4 items-center justify-between text-xs py-2 px-1 border-y border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Labels:</span>
            <div className="flex flex-wrap gap-2">
              {LABELS.map((lbl, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2 py-0.5 border border-slate-200 dark:border-slate-800 rounded-full bg-slate-50 dark:bg-slate-800/40"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${lbl.color}`} />
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                    {lbl.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alphabetical jump bar */}
        <div className="flex flex-wrap justify-between items-center gap-1 bg-slate-50 dark:bg-slate-850/30 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => handleLetterClick("")}
            className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
              !letterFilter
                ? "bg-blue-600 text-white"
                : "text-slate-600 dark:text-slate-450 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            ALL
          </button>
          {alphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                letterFilter === letter
                  ? "bg-blue-600 text-white scale-105"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Action Button Strip */}
        <div className="flex flex-wrap gap-3 items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/bonds/new"
              className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white transition-colors text-xs flex items-center gap-2 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Bond Record</span>
            </Link>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="h-9 px-3 rounded-lg border border-slate-350 dark:border-slate-800 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center cursor-pointer"
              title="Print List"
            >
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto border border-slate-300 dark:border-slate-800 rounded-xl">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-4">Power Number</th>
                <th className="py-3 px-4">Bond Status</th>
                <th className="py-3 px-4">Defendant Name</th>
                <th className="py-3 px-4 text-right">Bond Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-250 dark:divide-slate-800">
              {bonds.length > 0 ? (
                bonds.map((bond) => {
                  const powerNum = bond.powers[0]?.powerNumber || "N/A";
                  return (
                    <tr
                      key={bond.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 font-mono">
                        {powerNum}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          bond.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-500/20"
                            : bond.status === "Discharged"
                            ? "bg-slate-100 text-slate-600 border-slate-300"
                            : "bg-amber-50 text-amber-700 border-amber-500/20"
                        }`}>
                          {bond.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                        <Link
                          href={`/dashboard/defendants/${bond.defendant.id}`}
                          className="hover:underline"
                        >
                          {bond.defendant.lastName}, {bond.defendant.firstName}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-slate-100 text-right">
                        ${bond.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={`/dashboard/bonds/${bond.id}`}
                          className="inline-block p-1 rounded-md border text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No active bonds match your current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
