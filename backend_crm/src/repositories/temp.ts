import { Permission } from "@prisma/client";
import { prisma } from "../prisma-client";
import { PLAN_CONFIG } from "../utils/plans";

export async function backfillAdminContractPermissions() {
  const contractPermissions: Permission[] = [
    "CONTRACT_CREATE",
    "CONTRACT_READ",
    "CONTRACT_UPDATE",
    "CONTRACT_DELETE",
  ];

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      plan: true,
    },
  });

  const eligibleCompanies = companies.filter(
    (company) => PLAN_CONFIG[company.plan].features.GENERATEDCONTRACT,
  );

  let updated = 0;

  for (const company of eligibleCompanies) {
    for (const permission of contractPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          companyId_role_permission: {
            companyId: company.id,
            role: "ADMIN",
            permission,
          },
        },
        create: {
          companyId: company.id,
          role: "ADMIN",
          permission,
          allowed: true,
        },
        update: {
          allowed: true,
        },
      });

      updated++;
    }
  }

  return {
    companiesUpdated: eligibleCompanies.length,
    permissionsUpdated: updated,
  };
}

async function main() {
  const result = await backfillAdminContractPermissions();

  console.log("Atualização concluída:", result);
}

main().catch((error) => {
  console.error("Erro ao atualizar permissões:", error);
  process.exitCode = 1;
});
