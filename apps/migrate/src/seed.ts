// Seed script: creates the demo user and starter data.
// Safe to re-run: every row is upserted by a fixed id.
// Run via: pnpm db:seed

import { randomBytes, scryptSync } from "node:crypto";
import { prisma } from "@project/db";

const colleges = [
  { id: "baruch", name: "Baruch College", borough: "Manhattan" },
  { id: "queens", name: "Queens College", borough: "Queens" },
  { id: "lehman", name: "Lehman College", borough: "Bronx" },
];

// same "salt:hash" scrypt format as packages/domain — the seed can't import
// domain (web-only, ADR-0009)
function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

async function main() {
  for (const { id, ...data } of colleges) {
    await prisma.college.upsert({ where: { id }, update: data, create: { id, ...data } });
  }
  console.log(`seed: ${colleges.length} colleges`);

  // id matches the identity stub's fallback, so the demo works with no header
  await prisma.student.upsert({
    where: { id: "demo-user" },
    update: {},
    create: {
      id: "demo-user",
      email: "jane.doe@qc.cuny.edu",
      passwordHash: hashPassword("demo-password"),
    },
  });
  console.log("seed: demo student jane.doe@qc.cuny.edu");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
