import React from "react";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getIndemnitorById } from "@/actions/indemnitors";
import { IndemnitorDetails } from "@/components/indemnitors/indemnitor-details";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function IndemnitorDetailsPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const result = await getIndemnitorById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="py-6">
      <IndemnitorDetails indemnitor={result.data as any} />
    </div>
  );
}
