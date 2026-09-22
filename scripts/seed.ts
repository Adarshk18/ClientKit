import { DEMO_PUBLIC_ID, ensureDemoDocument } from "../lib/demo";

async function main() {
  await ensureDemoDocument();
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  console.log("Seeded demo document");
  console.log(`  public: ${base}/s/${DEMO_PUBLIC_ID}`);
  console.log("  (demo login email: demo@clientkit.dev — password from SEED_PASSWORD or default)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
