"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { indemnitorSchema } from "@/lib/validations/indemnitor";

export async function getIndemnitors(params?: { query?: string; page?: number; pageSize?: number }) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const query = params?.query || "";
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const skip = (page - 1) * pageSize;

  try {
    const where: any = {
      orgId: session.orgId,
    };

    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ];
    }

    const [indemnitors, total] = await Promise.all([
      prisma.indemnitor.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { lastName: "asc" },
        include: {
          addresses: true,
          relationships: {
            include: {
              bond: {
                include: {
                  defendant: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.indemnitor.count({ where }),
    ]);

    return {
      success: true,
      data: {
        indemnitors,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    };
  } catch (error: any) {
    console.error("[getIndemnitors]", error);
    return { success: false, error: "Failed to fetch co-signers" };
  }
}

export async function getIndemnitorById(id: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const indemnitor = await prisma.indemnitor.findFirst({
      where: { id, orgId: session.orgId },
      include: {
        addresses: true,
        employments: true,
        relationships: {
          include: {
            bond: {
              include: {
                defendant: true,
              },
            },
          },
        },
      },
    });

    if (!indemnitor) return { success: false, error: "Co-signer not found" };
    return { success: true, data: indemnitor };
  } catch (error: any) {
    console.error("[getIndemnitorById]", error);
    return { success: false, error: "Failed to fetch co-signer" };
  }
}

export async function createIndemnitor(formData: {
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  employer?: string | null;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = indemnitorSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  try {
    const { firstName, lastName, phone, email, street, city, state, zip, employer } = parsed.data;

    const indemnitor = await prisma.indemnitor.create({
      data: {
        orgId: session.orgId,
        firstName,
        lastName,
        phone,
        email: email || null,
        addresses: {
          create: {
            street,
            city,
            state,
            zip,
          },
        },
        employments: employer
          ? {
              create: {
                employer,
              },
            }
          : undefined,
      },
    });

    revalidatePath("/dashboard/indemnitors");
    return { success: true, data: indemnitor };
  } catch (error: any) {
    console.error("[createIndemnitor]", error);
    return { success: false, error: "Failed to create co-signer" };
  }
}

export async function linkIndemnitorToBond(formData: {
  indemnitorId: string;
  bondId: string;
  relationship: string;
}) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const link = await prisma.indemnitorRelationship.create({
      data: {
        indemnitorId: formData.indemnitorId,
        bondId: formData.bondId,
        relationship: formData.relationship,
      },
    });

    revalidatePath("/dashboard/bonds/" + formData.bondId);
    revalidatePath("/dashboard/indemnitors/" + formData.indemnitorId);
    return { success: true, data: link };
  } catch (error: any) {
    console.error("[linkIndemnitorToBond]", error);
    return { success: false, error: "Failed to link co-signer to bond" };
  }
}

export async function unlinkIndemnitorFromBond(id: string, bondId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    await prisma.indemnitorRelationship.delete({
      where: { id },
    });

    revalidatePath("/dashboard/bonds/" + bondId);
    return { success: true };
  } catch (error: any) {
    console.error("[unlinkIndemnitorFromBond]", error);
    return { success: false, error: "Failed to unlink co-signer" };
  }
}

export async function deleteIndemnitor(id: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const existing = await prisma.indemnitor.findFirst({
      where: { id, orgId: session.orgId },
    });

    if (!existing) return { success: false, error: "Co-signer not found" };

    await prisma.indemnitor.delete({
      where: { id },
    });

    revalidatePath("/dashboard/indemnitors");
    return { success: true };
  } catch (error: any) {
    console.error("[deleteIndemnitor]", error);
    return { success: false, error: "Failed to delete co-signer" };
  }
}
