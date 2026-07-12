import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "@/db";
import { stripe } from "@better-auth/stripe";
import { stripeClient } from "./stripe";
import { PLANS } from "./plans";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // Temporary Console Log for Development (Day 9 pe Resend configure hoga)
      console.log(`\n========================================`);
      console.log(`📩 VERIFICATION LINK FOR: ${user.email}`);
      console.log(`🔗 URL: ${url}`);
      console.log(`========================================\n`);
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  // Auto-create workspace organization for new users
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await auth.api.createOrganization({
            body: {
              name: `${user.name || "My"}'s Workspace`,
              slug: `org-${user.id.slice(0, 8)}`,
              userId: user.id,
            },
          });
        },
      },
    },
  },

  plugins: [
    organization(),
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true, // signup pe Stripe customer bhi banao

      subscription: {
        enabled: true,
        plans: PLANS,

        // ⭐ org billing entity hai (user nahi)
        // sirf owner/admin billing chhu sakte hain
        authorizeReference: async ({ user, referenceId }) => {
          const member = await db.query.member.findFirst({
            where: (m, { and, eq }) =>
              and(
                eq(m.userId, user.id),
                eq(m.organizationId, referenceId)
              ),
          });
          return member?.role === "owner" || member?.role === "admin";
        },
      },

      // organizations ko billing entity banao
      organization: {
        enabled: true,
      },
    }),
  ],
});
