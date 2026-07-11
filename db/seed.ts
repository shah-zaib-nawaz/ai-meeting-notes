import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./index";
import { organization, note } from "./schema";

async function seed() {
  const [org] = await db
    .insert(organization)
    .values({ name: "Test Org", slug: "test-org" })
    .returning();

  await db.insert(note).values({
    organizationId: org.id,
    title: "Meri pehli meeting note",
    content: "Ye test note hai.",
  });

  console.log("Seed ho gaya! Org id:", org.id);
}

seed();
