"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  MapPin,
  Briefcase,
  ShieldAlert,
  Link2,
  Trash2,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { deleteIndemnitor } from "@/actions/indemnitors";

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface Employment {
  id: string;
  employer: string;
}

interface BondRelationship {
  id: string;
  relationship: string;
  bond: {
    id: string;
    amount: number;
    status: string;
    defendant: {
      firstName: string;
      lastName: string;
    };
  };
}

interface IndemnitorDetailsProps {
  indemnitor: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    addresses: Address[];
    employments: Employment[];
    relationships: BondRelationship[];
  };
}

export function IndemnitorDetails({ indemnitor }: IndemnitorDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this co-signer record? This action cannot be undone.")) {
      startTransition(async () => {
        const res = await deleteIndemnitor(indemnitor.id);
        if (res.success) {
          router.push("/dashboard/indemnitors");
          router.refresh();
        } else {
          alert(res.error || "Failed to delete co-signer");
        }
      });
    }
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "N/A";
    if (phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-6 rounded-xl shadow-xs">
        <div className="space-y-1">
          <Link
            href="/dashboard/indemnitors"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Co-signers CRM
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white pt-1">
            {indemnitor.lastName}, {indemnitor.firstName}
          </h1>
          <p className="text-xs text-muted-foreground">Co-signer profile details</p>
        </div>

        <button
          onClick={handleDelete}
          disabled={isPending}
          className="px-3 py-1.5 rounded-lg border bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-500/10 hover:bg-rose-100 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete Co-Signer
        </button>
      </div>

      {/* Grid columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: General Contact & Addresses */}
        <div className="md:col-span-2 space-y-6">
          {/* Contact Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2 flex items-center gap-1.5">
              <User className="h-4 w-4 text-blue-500" />
              General Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Phone Number
                </span>
                <p className="font-mono text-slate-700 dark:text-slate-300">
                  {formatPhone(indemnitor.phone)}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> Email Address
                </span>
                <p className="text-slate-700 dark:text-slate-300">{indemnitor.email || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-500" />
              Addresses
            </h3>

            {indemnitor.addresses.length === 0 ? (
              <p className="text-xs text-muted-foreground">No address records linked.</p>
            ) : (
              <div className="space-y-3">
                {indemnitor.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-lg text-xs"
                  >
                    <p className="font-bold text-slate-800 dark:text-slate-100">{addr.street}</p>
                    <p className="text-slate-400 mt-0.5">
                      {addr.city}, {addr.state} {addr.zip}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Employment */}
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-amber-500" />
              Employment Info
            </h3>

            {indemnitor.employments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No employment records logged.</p>
            ) : (
              <div className="space-y-3">
                {indemnitor.employments.map((emp) => (
                  <div
                    key={emp.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {emp.employer}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Linked Bonds & Guarantees */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b pb-2 flex items-center gap-1.5">
              <Link2 className="h-4 w-4 text-purple-500" />
              Liability Guarantees
            </h3>

            {indemnitor.relationships.length === 0 ? (
              <p className="text-xs text-muted-foreground">This co-signer has not co-signed any active bonds.</p>
            ) : (
              <div className="space-y-3">
                {indemnitor.relationships.map((rel) => (
                  <div
                    key={rel.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        Bond: ${rel.bond.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-500/10 px-2 py-0.5 rounded-full uppercase">
                        {rel.relationship}
                      </span>
                    </div>

                    <div className="flex flex-col text-[11px] text-slate-500">
                      <span>
                        Defendant: {rel.bond.defendant.lastName}, {rel.bond.defendant.firstName}
                      </span>
                      <span className="mt-0.5 font-medium">Status: {rel.bond.status}</span>
                    </div>

                    <Link
                      href={`/dashboard/bonds/${rel.bond.id}`}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline pt-1.5"
                    >
                      <FileText className="h-3 w-3" /> View Bond Record
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
