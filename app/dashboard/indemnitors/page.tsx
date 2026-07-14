import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getIndemnitors } from "@/actions/indemnitors";
import { IndemnitorsTable } from "@/components/indemnitors/indemnitors-table";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function IndemnitorsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const query = resolvedParams.query || "";
  const page = parseInt(resolvedParams.page || "1", 10);

  const result = await getIndemnitors({
    query,
    page,
    pageSize: 10,
  });

  if (!result.success || !result.data) {
    return (
      <div className="p-6 text-center text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 rounded-xl">
        <p className="font-semibold">Error Loading Co-Signers</p>
        <p className="text-xs mt-1">{result.error || "Please try again later."}</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <IndemnitorsTable
        indemnitors={result.data.indemnitors as any}
        pagination={result.data.pagination}
      />
    </div>
  );
}
