"use client";

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  ShieldAlert,
  Trash2,
  Eye,
  FileSpreadsheet,
  Filter,
  Tag as TagIcon,
  FolderOpen,
  Clock,
  ExternalLink,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { deleteDefendant } from "@/actions/defendants";

interface Defendant {
  id: string;
  firstName: string;
  lastName: string;
  dob: Date | null;
  ssn: string | null;
  tags: string[];
  createdAt: Date;
  bonds: { id: string; amount: number; status: string }[];
  courtAppearances: { id: string; courtDate: any }[];
}

interface DefendantsTableProps {
  defendants: Defendant[];
  uniqueTags?: string[];
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

export function DefendantsTable({
  defendants,
  uniqueTags = [],
  pagination,
}: DefendantsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") || "all";
  const currentTag = searchParams.get("tag") || "all";
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");

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

  const handleStatusTabClick = (statusFilter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    let statusVal = "all";
    if (statusFilter === "Active Defendants") statusVal = "active";
    else if (statusFilter === "Inactive Defendants") statusVal = "inactive";

    if (statusVal !== "all") {
      params.set("status", statusVal);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextTag = currentTag === tag ? "all" : tag;
    if (nextTag !== "all") {
      params.set("tag", nextTag);
    } else {
      params.delete("tag");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    router.push(pathname);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this defendant? This will remove all associated bonds, addresses, and contacts."
      )
    ) {
      startTransition(async () => {
        const res = await deleteDefendant(id);
        if (res.success) {
          router.refresh();
        } else {
          alert(res.error || "Failed to delete defendant");
        }
      });
    }
  };

  const formatSSN = (ssn: string | null) => {
    if (!ssn) return "N/A";
    if (ssn.length === 9) {
      return `***-**-${ssn.slice(-4)}`;
    }
    return ssn;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const exportToCSV = () => {
    const headers = ["First Name", "Last Name", "DOB", "SSN", "Tags", "Created At"];
    const rows = defendants.map((d) => [
      d.firstName,
      d.lastName,
      d.dob ? new Date(d.dob).toISOString().split("T")[0] : "",
      d.ssn || "",
      (d.tags || []).join(";"),
      new Date(d.createdAt).toISOString().split("T")[0],
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `defendants_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTagStyle = (tag: string) => {
    const colors: Record<string, string> = {
      "high risk": "bg-rose-50 text-rose-700 border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-450",
      vip: "bg-amber-50 text-amber-700 border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-400",
      "payment plan": "bg-blue-50 text-blue-700 border-blue-500/20 dark:bg-blue-950/20 dark:text-blue-400",
      fta: "bg-red-50 text-red-700 border-red-500/20 dark:bg-red-950/20 dark:text-red-400",
    };
    return (
      colors[tag.toLowerCase()] ||
      "bg-slate-50 text-slate-700 border-slate-500/20 dark:bg-slate-800/40 dark:text-slate-350"
    );
  };

  return (
    <div className="flex gap-6 h-full items-start flex-col xl:flex-row">
      {/* LEFT COLUMN: Sub-Sidebar */}
      <div className="w-full xl:w-64 shrink-0 flex flex-col gap-6">
        {/* 1. Section Navigator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Defendant Section</h3>
          </div>
          <div className="p-2 flex flex-col gap-1 text-xs">
            {[
              { name: "All Defendants", active: currentStatus === "all" },
              { name: "Active Defendants", active: currentStatus === "active" },
              { name: "Inactive Defendants", active: currentStatus === "inactive" },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleStatusTabClick(item.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                  item.active
                    ? "bg-blue-50 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-855"
                }`}
              >
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Quick Search */}
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
                className="text-xs bg-white dark:bg-slate-955 border border-slate-300 dark:border-slate-850 rounded-lg px-3 py-1.5 text-slate-900 dark:text-slate-100 outline-hidden flex-1"
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-md font-bold cursor-pointer"
              >
                Go
              </button>
            </form>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-850">
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

        {/* 4. Tag Filter Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <TagIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Filter by Tag</h3>
          </div>
          <div className="p-3 flex flex-wrap gap-2 text-xs">
            {["VIP", "High Risk", "Installment Plan", "Corporate", "Out of State", "First Time"].map((tag) => {
              const active = currentTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-100"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Defendants grid */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-xs p-6">
        
        {/* Action Button Strip */}
        <div className="flex flex-wrap gap-3 items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/defendants/new"
              className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white transition-colors text-sm flex items-center gap-2 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>New Defendant</span>
            </Link>
            <button
              onClick={exportToCSV}
              className="h-9 px-4 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm flex items-center gap-2 cursor-pointer font-semibold"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto border border-slate-300 dark:border-slate-800 rounded-xl">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Defendant Name</th>
                <th className="py-3 px-4">DOB</th>
                <th className="py-3 px-4">SSN</th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4">Active Bonds</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-250 dark:divide-slate-800">
              {defendants.length > 0 ? (
                defendants.map((d) => {
                  const activeBonds = d.bonds.filter((b) => b.status === "Active");
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-450">
                        <Link href={`/dashboard/defendants/${d.id}`} className="hover:underline">
                          {d.lastName}, {d.firstName}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-650 dark:text-slate-400 font-mono">
                        {formatDate(d.dob)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-650 dark:text-slate-400 font-mono">
                        {formatSSN(d.ssn)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {d.tags && d.tags.length > 0 ? (
                            d.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTagStyle(
                                  tag
                                )}`}
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[10px]">No Tags</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {activeBonds.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-450 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>
                              {activeBonds.length} Active ($
                              {activeBonds.reduce((acc, b) => acc + b.amount, 0).toLocaleString()})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-405 dark:text-slate-500 font-semibold">No Active Bonds</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/dashboard/defendants/${d.id}`}
                            className="p-1 rounded-md border text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-955/30 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(d.id)}
                            disabled={isPending}
                            className="p-1 rounded-md border text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-955/30 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Delete Defendant"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No defendants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-500">
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 cursor-pointer font-bold"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 cursor-pointer font-bold"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
