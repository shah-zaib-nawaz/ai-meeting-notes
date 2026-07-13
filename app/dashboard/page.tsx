import { getSession } from "@/lib/get-session";
import { getActiveOrgId } from "@/lib/get-active-org";
import { getNotesForOrg } from "@/lib/notes";
import { createNote } from "@/lib/actions";
import { redirect } from "next/navigation";
import { canPerformAction } from "@/lib/entitlements"; // Entitlement check import

// Step 15: Naye components import kiye
import { UploadForm } from "@/components/upload-form";
import { NoteStatus } from "@/components/note-status";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orgId = await getActiveOrgId();
  const notes = orgId ? await getNotesForOrg(orgId) : [];

  // 🧪 TEMPORARY TEST: Entitlement check karne ke liye log
  if (orgId) {
    const check = await canPerformAction(orgId, "create_note");
    console.log("-----------------------------------------");
    console.log(`[Entitlement Engine Check for Org: ${orgId}]`);
    console.log("Can create note?:", check);
    console.log("-----------------------------------------");
  }

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name || session.user.email}!</p>
      <p style={{ color: "gray", fontSize: 12 }}>Active Org: {orgId}</p>

      {/* ---- NAYA NOTE FORM ---- */}
      <form
        action={createNote}
        style={{ display: "flex", flexDirection: "column", gap: 8, margin: "20px 0" }}
      >
        <input name="title" placeholder="Note ka title" required />
        <textarea name="content" placeholder="Yahan text paste karo..." rows={4} />
        <button type="submit">Note Save Karo</button>
      </form>

      {/* ---- Step 15: Upload Form (Yahan add kiya hai form ke neche) ---- */}
      <div style={{ margin: "20px 0", padding: "15px 0", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
        <UploadForm />
      </div>

      {/* ---- NOTES LIST ---- */}
      <h2>Aap ke Notes ({notes.length})</h2>
      {notes.length === 0 ? (
        <p>Abhi koi note nahi. Upar se ek banao!</p>
      ) : (
        <ul style={{ paddingLeft: 20, listStyleType: "none" }}>
          {notes.map((n) => (
            // Style ko margin-bottom: 12 kar diya hai jaisa instruction mein tha
            <li key={n.id} style={{ marginBottom: 12, padding: "8px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <strong>{n.title}</strong>
                {/* Step 15: NoteStatus add kiya, id pass karte hue */}
                <NoteStatus noteId={n.id} initialStatus={n.status} />
              </div>
              {n.content && <p style={{ margin: "4px 0 0 0", color: "gray" }}>{n.content}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}