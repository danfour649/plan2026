import "dotenv/config";

import { generateApiToken } from "../src/lib/api-auth-utils";
import { createScriptPrisma } from "./lib/prisma-for-scripts";

function usage(): never {
  console.error(`Usage: pnpm run api:create-token -- <user-email-or-id> [token-name]

Creates a personal API token for the standalone plan2026 API (Bearer auth).
The raw token is printed once; store it securely.

Example:
  pnpm run api:create-token -- you@example.com "CLI laptop"
`);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) usage();

  const userRef = args[0];
  const name = args[1]?.trim() || "API token";
  const prisma = createScriptPrisma();

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: userRef }, { id: userRef }],
      },
      select: { id: true, email: true },
    });

    if (!user) {
      console.error(`No user found for: ${userRef}`);
      process.exit(1);
    }

    const { rawToken, tokenHash, tokenPrefix } = generateApiToken();

    await prisma.apiToken.create({
      data: {
        userId: user.id,
        name,
        tokenHash,
        tokenPrefix,
      },
    });

    console.log(`User: ${user.email ?? user.id}`);
    console.log(`Name: ${name}`);
    console.log(`Prefix: ${tokenPrefix}…`);
    console.log("");
    console.log("Bearer token (shown once):");
    console.log(rawToken);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
