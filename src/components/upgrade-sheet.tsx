"use client";

interface UpgradeSheetProps {
  ctaLabel?: string;
  description?: string;
  onClose: () => void;
  onUpgrade: () => void;
  open: boolean;
  title?: string;
}

const defaultHighlights = [
  "Visa insights",
  "Document assistance",
  "Save multiple pathways",
  "Family visa pathways",
];

export function UpgradeSheet({
  ctaLabel = "Upgrade now",
  description = "Unlock deeper guidance and stronger application support.",
  onClose,
  onUpgrade,
  open,
  title = "Get Premium",
}: UpgradeSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div
        className="bottom-sheet upgrade-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-heading">
          <div>
            <p>Premium upgrade</p>
            <h2>{title}</h2>
            <span>{description}</span>
          </div>
          <button className="sheet-close" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="upgrade-sheet-copy">
          {defaultHighlights.map((highlight) => (
            <strong key={highlight}>{highlight}</strong>
          ))}
          <p>One time purchase, no subscription</p>
          <div className="upgrade-sheet-price">
            <strong>$11</strong>
            <span>/ mo billed annually</span>
          </div>
        </div>

        <button className="button upgrade-button wide-button" onClick={onUpgrade} type="button">
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
