"use client";

import { useState } from "react";
import { getUploadUrl } from "@/lib/upload";
import { startProcessing } from "@/lib/actions";

export function UploadForm() {
  const [status, setStatus] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1. Server se presigned URL maango
      setStatus("Permission le rahe hain...");
      const { uploadUrl, objectKey } = await getUploadUrl(
        file.name,
        file.type,
        file.size
      );

      // 2. ⭐ Browser SEEDHA R2 pe upload kare (server se ho kar nahi)
      setStatus("Upload ho rahi hai...");
      const res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) throw new Error("Upload fail hui");

      // 3. Upload complete → server ko batao, pipeline shuru karo
      setStatus("Processing shuru...");
      await startProcessing(objectKey, file.name);

      setStatus("Ho gaya! Processing chal rahi hai.");
    } catch (err) {
      // ESLint error fixed here safely
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setStatus("Error: " + errorMessage);
    }
  }

  return (
    <div style={{ margin: "20px 0" }}>
      <input type="file" accept="audio/*" onChange={handleUpload} />
      <p>{status}</p>
    </div>
  );
}