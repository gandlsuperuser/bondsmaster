"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { bondSchema } from "@/lib/validations/bond";

export async function getBonds(params?: {
  query?: string;
  page?: number;
  pageSize?: number;
  status?: string;
  tag?: string;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const query = params?.query || "";
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const skip = (page - 1) * pageSize;
  const status = params?.status || "all";
  const tag = params?.tag || "";

  try {
    const where: any = {
      orgId: session.orgId,
    };

    if (status !== "all") {
      where.status = status;
    }

    if (tag) {
      where.defendant = {
        tags: { has: tag }
      };
    }

    if (query) {
      where.OR = [
        { powers: { some: { powerNumber: { contains: query, mode: "insensitive" } } } },
        { defendant: { firstName: { contains: query, mode: "insensitive" } } },
        { defendant: { lastName: { contains: query, mode: "insensitive" } } },
      ];
    }

    const [bonds, total] = await Promise.all([
      prisma.bond.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          defendant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          powers: {
            select: {
              powerNumber: true,
            },
          },
          payments: {
            select: {
              amount: true,
            },
          },
        },
      }),
      prisma.bond.count({ where }),
    ]);

    return {
      success: true,
      data: {
        bonds,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  } catch (error: any) {
    console.error("[getBonds]", error);
    return { success: false, error: "Failed to fetch bonds" };
  }
}

export async function getBondById(id: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const bond = await prisma.bond.findFirst({
      where: { id, orgId: session.orgId },
      include: {
        defendant: true,
        charges: true,
        statusHistory: { orderBy: { changedAt: "desc" } },
        powers: true,
        collateral: true,
        payments: true,
      },
    });

    if (!bond) return { success: false, error: "Bond not found" };
    return { success: true, data: bond };
  } catch (error: any) {
    console.error("[getBondById]", error);
    return { success: false, error: "Failed to fetch bond" };
  }
}

export async function getDefendantsList() {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const list = await prisma.defendant.findMany({
      where: { orgId: session.orgId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { lastName: "asc" },
    });
    return { success: true, data: list };
  } catch (error: any) {
    console.error("[getDefendantsList]", error);
    return { success: false, error: "Failed to fetch defendants list" };
  }
}

export async function createBond(formData: {
  defendantId: string;
  amount: number;
  status: "Draft" | "Active" | "FTA" | "Discharged";
  powerNumber: string;
  arrestDate?: string | null;
  releasedDate?: string | null;
  charges?: { description: string; degree?: string | null }[];
  collaterals?: { type: string; value: number; description?: string | null }[];
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = bondSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  try {
    const { defendantId, amount, status, powerNumber, arrestDate, releasedDate, charges, collaterals } =
      parsed.data;

    const bond = await prisma.bond.create({
      data: {
        orgId: session.orgId,
        defendantId,
        amount,
        status,
        arrestDate,
        releasedDate,
        powers: {
          create: {
            powerNumber,
            amount,
          },
        },
        charges: {
          create: charges.map((c) => ({
            description: c.description,
            degree: c.degree,
          })),
        },
        collateral: {
          create: collaterals.map((col) => ({
            type: col.type,
            value: col.value,
            description: col.description,
          })),
        },
        statusHistory: {
          create: {
            status,
          },
        },
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        orgId: session.orgId,
        userId: session.id,
        action: "bond_created",
        entityType: "Bond",
        entityId: bond.id,
        metadata: { powerNumber, amount },
      },
    });

    revalidatePath("/dashboard/bonds");
    return { success: true, data: bond };
  } catch (error: any) {
    console.error("[createBond]", error);
    return { success: false, error: "Failed to create bond" };
  }
}

export async function updateBondStatus(id: string, newStatus: "Draft" | "Active" | "FTA" | "Discharged") {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const existing = await prisma.bond.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) return { success: false, error: "Bond not found" };

    const updated = await prisma.bond.update({
      where: { id },
      data: {
        status: newStatus,
        statusHistory: {
          create: {
            status: newStatus,
          },
        },
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        orgId: session.orgId,
        userId: session.id,
        action: "bond_status_changed",
        entityType: "Bond",
        entityId: id,
        metadata: { from: existing.status, to: newStatus },
      },
    });

    revalidatePath("/dashboard/bonds");
    revalidatePath(`/dashboard/bonds/${id}`);
    revalidatePath(`/dashboard/defendants/${existing.defendantId}`);
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("[updateBondStatus]", error);
    return { success: false, error: "Failed to transition bond status" };
  }
}

export async function deleteBond(id: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const existing = await prisma.bond.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) return { success: false, error: "Bond not found" };

    await prisma.bond.delete({
      where: { id },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        orgId: session.orgId,
        userId: session.id,
        action: "bond_deleted",
        entityType: "Bond",
        entityId: id,
        metadata: { amount: existing.amount },
      },
    });

    revalidatePath("/dashboard/bonds");
    return { success: true };
  } catch (error: any) {
    console.error("[deleteBond]", error);
    return { success: false, error: "Failed to delete bond" };
  }
}
