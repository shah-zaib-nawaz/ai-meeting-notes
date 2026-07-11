import { db } from "@/db";
import { note } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function getNotesForOrg(orgId : string){
    return await db.select().from(note).where(and(eq(note.organizationId, orgId), isNull(note.deletedAt)));
}