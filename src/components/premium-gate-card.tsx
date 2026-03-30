"use client";

interface PremiumGateCardProps {
  title: string;
  description: string;
  bullets?: string[];
}

export function PremiumGateCard({
  title,
  description,
  bullets = [],
}: PremiumGateCardProps) {
  return (
    <div className="upgrade-card premium-gate">
      <div className="space-between">
        <strong>{title}</strong>
        <span className="tag">Premium</span>
      </div>
      <p className="muted">{description}</p>
      {bullets.length > 0 ? (
        <ul className="compact-list">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
