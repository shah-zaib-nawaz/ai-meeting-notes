"use client";

import { useEffect, useState } from "react";
import { getNoteStatus, retryNote } from "@/lib/actions";

export function NoteStatus({ noteId, initialStatus = "queued" }: { noteId: string; initialStatus?: string }) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    // 🛑 Optimization: Agar status pehle se done ya failed hai, toh database check mat karo
    if (status === "done" || status === "failed") {
      return;
    }

    const interval = setInterval(async () => {
      const s = await getNoteStatus(noteId);
      if (s) {
        setStatus(s.status);
        
        if (s.status === "done" || s.status === "failed") {
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [noteId, status]);

  return (
    <div>
      <span>Status: <strong>{status}</strong></span>
      {status === "failed" && (
        <button onClick={() => retryNote(noteId)} style={{ marginLeft: 10 }}>
          Dobara koshish karo
        </button>
      )}
    </div>
  );
}