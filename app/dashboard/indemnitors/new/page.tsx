import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { IndemnitorForm } from "@/components/indemnitors/indemnitor-form";

export default async function NewIndemnitorPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="py-6">
      <IndemnitorForm />
    </div>
  );
}
