// Before Better Auth Schema

// import {
//   pgTable,
//   text,
//   timestamp,
//   vector,
//   integer,
//   index,
// } from "drizzle-orm/pg-core";
// import { createId } from "@paralleldrive/cuid2";

// // ---------- USER (log jo login karte hain) ----------
// // Note: Better Auth Day 3 pe iski poori tables banayega,
// // abhi hum ek simple version rakh rahe hain reference ke liye.
// export const user = pgTable("user", {
//   id: text("id").primaryKey().$defaultFn(() => createId()),
//   name: text("name"),
//   email: text("email").notNull().unique(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });

// // ---------- ORGANIZATION (company / team) ----------
// export const organization = pgTable("organization", {
//   id: text("id").primaryKey().$defaultFn(() => createId()),
//   name: text("name").notNull(),
//   slug: text("slug").unique(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });

// // ---------- NOTE (meeting note) ----------
// export const note = pgTable("note", {
//   id: text("id").primaryKey().$defaultFn(() => createId()),

//   // ⭐ MULTI-TENANCY: har note kis org ka hai (data leak rokta hai)
//   organizationId: text("organization_id")
//     .notNull()
//     .references(() => organization.id),

//   title: text("title").notNull(),
//   content: text("content"),
//   status: text("status").default("draft").notNull(),

//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   updatedAt: timestamp("updated_at").defaultNow().notNull(),

//   // ⭐ SOFT-DELETE: delete karne pe mitane ke bajaye ye bhar denge
//   deletedAt: timestamp("deleted_at"),
//   deletedBy: text("deleted_by"),
// });

// // ---------- TRANSCRIPT (recording ka likha hua text) ----------
// export const transcript = pgTable("transcript", {
//   id: text("id").primaryKey().$defaultFn(() => createId()),
//   organizationId: text("organization_id").notNull().references(() => organization.id),
//   noteId: text("note_id").notNull().references(() => note.id),
//   fullText: text("full_text").notNull(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   deletedAt: timestamp("deleted_at"),
//   deletedBy: text("deleted_by"),
// });

// // ---------- SUMMARY (khulasa) ----------
// export const summary = pgTable("summary", {
//   id: text("id").primaryKey().$defaultFn(() => createId()),
//   organizationId: text("organization_id").notNull().references(() => organization.id),
//   noteId: text("note_id").notNull().references(() => note.id),
//   tldr: text("tldr"),
//   content: text("content"),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   deletedAt: timestamp("deleted_at"),
//   deletedBy: text("deleted_by"),
// });

// // ---------- DOCUMENT_CHUNK (text ke tukray + AI vector) ----------
// export const documentChunk = pgTable(
//   "document_chunk",
//   {
//     id: text("id").primaryKey().$defaultFn(() => createId()),
//     organizationId: text("organization_id").notNull().references(() => organization.id),
//     noteId: text("note_id").notNull().references(() => note.id),
//     chunkText: text("chunk_text").notNull(),

//     // ⭐ VECTOR column — AI embeddings yahan store honge (Day 6 pe use hoga)
//     // gemini-embedding-001 = 768 dimensions (numbers)
//     embedding: vector("embedding", { dimensions: 768 }),

//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     deletedAt: timestamp("deleted_at"),
//     deletedBy: text("deleted_by"),
//   },
//   (table) => [
//     // ⭐ HNSW index — vector search fast karta hai
//     // Zaroori: vector_cosine_ops likhna parta hai (warna error aata hai)
//     index("embedding_hnsw_idx").using(
//       "hnsw",
//       table.embedding.op("vector_cosine_ops")
//     ),
//   ]
// );

// // ---------- USAGE_EVENT (kis ne kitna use kiya — counting ke liye) ----------
// export const usageEvent = pgTable("usage_event", {
//   id: text("id").primaryKey().$defaultFn(() => createId()),
//   organizationId: text("organization_id").notNull().references(() => organization.id),
//   eventType: text("event_type").notNull(), // jaise "note_created"
//   quantity: integer("quantity").default(1).notNull(),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
// });
