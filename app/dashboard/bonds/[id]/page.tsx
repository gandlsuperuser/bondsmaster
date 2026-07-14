import React from "react";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getBondById } from "@/actions/bonds";
import { BondDetails } from "@/components/bonds/bond-details";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BondDetailsPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const result = await getBondById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="py-6">
      <BondDetails bond={result.data as any} />
    </div>
  );
}
