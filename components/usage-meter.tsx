export function UsageMeter({ used, limit }: { used: number; limit: number }) {
  const unlimited = limit === -1;
  return (
    <div style={{ margin: "12px 0" }}>
      <p>
        Notes: {used}
        {unlimited ? " (Unlimited)" : ` / ${limit}`}
      </p>
      {!unlimited && used >= limit && (
        <a href="/pricing" style={{ color: "blue" }}>
          Limit khatam — Upgrade karo →
        </a>
      )}
    </div>
  );
}
