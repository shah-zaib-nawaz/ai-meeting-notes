import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  vector,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// ==========================================
// 1. BETTER AUTH + STRIPE TABLES
// ==========================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  stripeCustomerId: text("stripe_customer_id"), // Added by Stripe plugin
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activeOrganizationId: text("active_organization_id"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const organization = pgTable(
  "organization",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    createdAt: timestamp("created_at").notNull(),
    metadata: text("metadata"),
    stripeCustomerId: text("stripe_customer_id"), // Added by Stripe plugin
  },
  (table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const member = pgTable(
  "member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").default("member").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [
    index("member_organizationId_idx").on(table.organizationId),
    index("member_userId_idx").on(table.userId),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role"),
    status: text("status").default("pending").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    inviterId: text("inviter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("invitation_organizationId_idx").on(table.organizationId),
    index("invitation_email_idx").on(table.email),
  ],
);

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  plan: text("plan").notNull(),
  referenceId: text("reference_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").default("incomplete"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  cancelAt: timestamp("cancel_at"),
  canceledAt: timestamp("canceled_at"),
  endedAt: timestamp("ended_at"),
  seats: integer("seats"),
  billingInterval: text("billing_interval"),
  stripeScheduleId: text("stripe_schedule_id"),
});

// ==========================================
// 2. CORE APP TABLES
// ==========================================

export const note = pgTable("note", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  status: text("status").default("draft").notNull(),
  audioKey: text("audio_key"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: text("deleted_by"),
});

export const transcript = pgTable("transcript", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  noteId: text("note_id")
    .notNull()
    .references(() => note.id, { onDelete: "cascade" }),
  fullText: text("full_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: text("deleted_by"),
});

export const summary = pgTable("summary", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  noteId: text("note_id")
    .notNull()
    .references(() => note.id, { onDelete: "cascade" }),
  tldr: text("tldr"),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  deletedBy: text("deleted_by"),
});

export const documentChunk = pgTable(
  "document_chunk",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    noteId: text("note_id")
      .notNull()
      .references(() => note.id, { onDelete: "cascade" }),
    chunkText: text("chunk_text").notNull(),
    embedding: vector("embedding", { dimensions: 768 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by"),
  },
  (table) => [
    index("embedding_hnsw_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

export const usageEvent = pgTable("usage_event", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 3. DRIZZLE RELATIONS (COMPLETED)
// ==========================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  notes: many(note),
  transcripts: many(transcript),
  summaries: many(summary),
  documentChunks: many(documentChunk),
  usageEvents: many(usageEvent),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const noteRelations = relations(note, ({ one, many }) => ({
  organization: one(organization, {
    fields: [note.organizationId],
    references: [organization.id],
  }),
  transcripts: many(transcript),
  summaries: many(summary),
  documentChunks: many(documentChunk),
}));

export const transcriptRelations = relations(transcript, ({ one }) => ({
  note: one(note, {
    fields: [transcript.noteId],
    references: [note.id],
  }),
  organization: one(organization, {
    fields: [transcript.organizationId],
    references: [organization.id],
  }),
}));

export const summaryRelations = relations(summary, ({ one }) => ({
  note: one(note, {
    fields: [summary.noteId],
    references: [note.id],
  }),
  organization: one(organization, {
    fields: [summary.organizationId],
    references: [organization.id],
  }),
}));

export const documentChunkRelations = relations(documentChunk, ({ one }) => ({
  note: one(note, {
    fields: [documentChunk.noteId],
    references: [note.id],
  }),
  organization: one(organization, {
    fields: [documentChunk.organizationId],
    references: [organization.id],
  }),
}));

export const usageEventRelations = relations(usageEvent, ({ one }) => ({
  organization: one(organization, {
    fields: [usageEvent.organizationId],
    references: [organization.id],
  }),
}));