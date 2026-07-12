"use client";

import { authClient } from "@/lib/auth-client";

export default function PricingPage() {
  async function upgrade(plan: string) {
    // active org lo
    const { data: orgs } = await authClient.organization.list();
    const activeOrg = orgs?.[0];
    if (!activeOrg) {
      alert("Pehle ek org honi chahiye");
      return;
    }

    await authClient.subscription.upgrade({
      plan, // "pro" ya "team"
      referenceId: activeOrg.id,       // ⭐ org billing entity
      customerType: "organization",    // ⭐ org ke naam pe
      successUrl: "/dashboard?upgraded=true",
      cancelUrl: "/pricing",
    });
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 20 }}>
      <h1>Pricing</h1>
      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        {/* FREE */}
        <div style={{ border: "1px solid #ccc", padding: 20, borderRadius: 8, flex: 1 }}>
          <h2>Free</h2>
          <p>3 notes/month</p>
          <p>$0</p>
        </div>

        {/* PRO */}
        <div style={{ border: "1px solid #ccc", padding: 20, borderRadius: 8, flex: 1 }}>
          <h2>Pro</h2>
          <p>100 notes/month</p>
          <p>$20/month</p>
          <button onClick={() => upgrade("pro")}>Pro lo</button>
        </div>

        {/* TEAM */}
        <div style={{ border: "1px solid #ccc", padding: 20, borderRadius: 8, flex: 1 }}>
          <h2>Team</h2>
          <p>Unlimited notes</p>
          <p>$50/month</p>
          <button onClick={() => upgrade("team")}>Team lo</button>
        </div>
      </div>
    </div>
  );
}
