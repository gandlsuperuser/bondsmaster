import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getBonds } from "@/actions/bonds";
import { InvoicesWorkspace } from "@/components/invoices/invoices-workspace";

export default async function InvoicesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch all bonds for the organization to generate current invoice statements
  const result = await getBonds({
    page: 1,
    pageSize: 100, // get a larger batch for invoices view
  });

  if (!result.success || !result.data) {
    return (
      <div className="p-6 text-center text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 rounded-xl">
        <p className="font-semibold">Error Loading Invoices</p>
        <p className="text-xs mt-1">{result.error || "Please try again later."}</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <InvoicesWorkspace bonds={result.data.bonds as any} />
    </div>
  );
}
