// Ye plans entitlement engine bhi padhega
export const PLANS = [
  {
    name: "pro",
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    annualDiscountPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
    limits: {
      notes: 100, // Pro = 100 notes/month
    },
  },
  {
    name: "team",
    priceId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID!,
    annualDiscountPriceId: process.env.STRIPE_TEAM_YEARLY_PRICE_ID!,
    limits: {
      notes: -1, // -1 ka matlab unlimited
    },
  },
];

// Free plan (Stripe pe nahi, code mein default)
export const FREE_LIMITS = {
  notes: 3, // Free = 3 notes/month
};
