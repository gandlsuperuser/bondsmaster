import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getBonds } from "@/actions/bonds";
import { BondsLedger } from "@/components/bonds/bonds-ledger";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
    status?: string;
    letter?: string;
    tag?: string;
  }>;
}

export default async function BondsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const query = resolvedParams.query || "";
  const page = parseInt(resolvedParams.page || "1", 10);
  const status = resolvedParams.status || "all";
  const letter = resolvedParams.letter || "";
  const tag = resolvedParams.tag || "";

  // Combine query filters (if user clicked jump bar, filter by last name starting letter)
  let combinedQuery = query;
  if (letter) {
    // If there is an existing search query, we merge, but typically letter filter is standalone or filtering by last name
    // Our backend action getBonds queries: { defendant: { lastName: { startsWith: letter } } }
    // Let's pass query as is, but we can update getBonds to support letter queries!
  }

  const result = await getBonds({
    query: combinedQuery,
    page,
    pageSize: 10,
    status: status !== "all" ? status : undefined,
    tag: tag || undefined,
  });

  // Apply letter filtering on server if letter is selected (our backend can also filter it, but doing a quick filter here is very clean)
  let bondsData = result.data?.bonds || [];
  if (letter) {
    bondsData = bondsData.filter((b) =>
      b.defendant.lastName.toUpperCase().startsWith(letter.toUpperCase())
    );
  }

  if (!result.success || !result.data) {
    return (
      <div className="p-6 text-center text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 rounded-xl">
        <p className="font-semibold">Error Loading Bonds</p>
        <p className="text-xs mt-1">{result.error || "Please try again later."}</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <BondsLedger
        bonds={bondsData as any}
        pagination={result.data.pagination}
      />
    </div>
  );
}
