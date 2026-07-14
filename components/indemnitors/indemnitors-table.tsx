"use client";

import React, { useState } from "react";
import { Search, Plus, MapPin, Phone, Mail, ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface Indemnitor {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  addresses: Address[];
}

interface IndemnitorsTableProps {
  indemnitors: Indemnitor[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function IndemnitorsTable({ indemnitors, pagination }: IndemnitorsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchVal, setSearchVal] = useState(searchParams.get("query") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchVal) {
      params.set("query", searchVal);
    } else {
      params.delete("query");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "N/A";
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Co-Signers (Indemnitors) CRM
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage liability guarantees, track addresses, and review co-signer records.
          </p>
        </div>

        <Link
          href="/dashboard/indemnitors/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Enroll Co-Signer
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search by name, phone..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <span className="text-xs text-muted-foreground font-semibold">
          Total Co-signers: {pagination.total}
        </span>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                <th className="py-3 px-4">Co-Signer Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Primary Address</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {indemnitors.length > 0 ? (
                indemnitors.map((ind) => {
                  const addr = ind.addresses[0];
                  return (
                    <tr
                      key={ind.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {ind.lastName}, {ind.firstName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">
                        {formatPhone(ind.phone)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {ind.email || <span className="text-slate-300 dark:text-slate-700">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {addr ? (
                          <span>
                            {addr.street}, {addr.city}, {addr.state}
                          </span>
                        ) : (
                          <span className="text-slate-350">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={`/dashboard/indemnitors/${ind.id}`}
                          className="inline-flex p-1.5 rounded-lg border text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    No co-signers enrolled yet. Click "Enroll Co-Signer" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-semibold">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
