import { useEffect } from "react";
import type { AvailabilitySeller } from "../api/client";
import { mediaUrl } from "../config";

type SellerPickerModalProps = {
  open: boolean;
  sellers: AvailabilitySeller[];
  selectedSellerId: string | null;
  onClose: () => void;
  onSelect: (sellerId: string | null) => void;
};

export function SellerPickerModal({
  open,
  sellers,
  selectedSellerId,
  onClose,
  onSelect,
}: SellerPickerModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="seller-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="seller-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="seller-modal-header">
          <h2 id="seller-modal-title">Kies een verkoper</h2>
          <button
            type="button"
            className="seller-modal-close"
            onClick={onClose}
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>

        <div className="seller-modal-list">
          <button
            type="button"
            className={`seller-option${selectedSellerId === null ? " is-selected" : ""}`}
            onClick={() => {
              onSelect(null);
              onClose();
            }}
          >
            <span className="seller-option-avatar seller-option-avatar-empty" aria-hidden>
              −
            </span>
            <span className="seller-option-name">Geen voorkeur</span>
          </button>

          {sellers.map((seller) => {
            const image = mediaUrl(seller.imageUrl);
            return (
              <button
                key={seller.sellerId}
                type="button"
                className={`seller-option${selectedSellerId === seller.sellerId ? " is-selected" : ""}`}
                onClick={() => {
                  onSelect(seller.sellerId);
                  onClose();
                }}
              >
                {image ? (
                  <img
                    className="seller-option-avatar"
                    src={image}
                    alt=""
                  />
                ) : (
                  <span
                    className="seller-option-avatar seller-option-avatar-fallback"
                    aria-hidden
                  >
                    {seller.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="seller-option-name">{seller.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
