import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDefendantsList } from "@/actions/bonds";
import { BondForm } from "@/components/bonds/bond-form";

export default async function NewBondPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const result = await getDefendantsList();

  if (!result.success || !result.data) {
    return (
      <div className="p-6 text-center text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 rounded-xl">
        <p className="font-semibold">Error Loading Defendants List</p>
        <p className="text-xs mt-1">{result.error || "Please try again later."}</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <BondForm defendants={result.data} />
    </div>
  );
}
