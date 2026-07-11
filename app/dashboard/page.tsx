import { db } from "@/db";
import { member } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/get-session";
import { getActiveOrgId } from "@/lib/get-active-org";
import { getNotesForOrg } from "@/lib/notes";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // 1. Pehle session se active org check karo
  let orgId = await getActiveOrgId();

  // 2. ⭐ FALLBACK: Agar session mein nahi hai, to DB se user ki pehli org nikalo
  if (!orgId) {
    const userMemberRecord = await db
      .select()
      .from(member)
      .where(eq(member.userId, session.user.id))
      .limit(1);

    if (userMemberRecord.length > 0) {
      orgId = userMemberRecord[0].organizationId;
    }
  }

  // 3. Ab notes fetch karo
  const notes = orgId ? await getNotesForOrg(orgId) : [];

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Dashboard</h1>
      <p>Welcome, <strong>{session.user.name || session.user.email}</strong>!</p>
      
      <div style={{ background: "#f0f0f0", padding: "10px 20px", borderRadius: 6, margin: "20px 0" }}>
        <p style={{ margin: 0 }}>
          <strong>Active Org ID:</strong> {orgId ? <code>{orgId}</code> : <span style={{ color: "red" }}>No Org Found</span>}
        </p>
      </div>

      <h2>Aap ke Notes ({notes.length})</h2>
      {notes.length === 0 ? (
        <p style={{ color: "#666" }}>Abhi koi notes nahi hain. Drizzle Studio se is Org ID par ek test row daalein!</p>
      ) : (
        <ul>
          {notes.map((n) => (
            <li key={n.id}><strong>{n.title}</strong> - {n.content}</li>
          ))}
        </ul>
      )}
    </div>
  );
}