import { createPrismaClient } from "../src/lib/database/create-prisma-client";
import { seedCore } from "./seed-core";
import { resolveSeedProfile } from "./seed-data";

const prisma = createPrismaClient();

async function main() {
  const profile = resolveSeedProfile();
  const started = Date.now();

  await seedCore(prisma);

  console.log(
    `Seed [${profile}] done in ${Date.now() - started}ms — demo tenant, roles, permissions, users, sample documents. See database/seed-users.md`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
