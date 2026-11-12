import { Link } from "react-router-dom";
import type { PublicStepOption } from "../api/client";
import { mediaUrl } from "../config";

type ChoiceGridProps = {
  options: PublicStepOption[];
  toOption: (option: PublicStepOption) => string;
  variant?: "default" | "products";
  showAddress?: boolean;
  imageFit?: "contain" | "cover";
};

export function ChoiceGrid({
  options,
  toOption,
  variant = "default",
  showAddress = false,
  imageFit = "contain",
}: ChoiceGridProps) {
  const gridClass =
    variant === "products"
      ? "choice-grid choice-grid-products"
      : "choice-grid";
  const cardClass =
    variant === "products" ? "choice-card choice-card-product" : "choice-card";
  const imageFitClass =
    imageFit === "cover" ? "choice-card-image is-cover" : "choice-card-image";

  if (options.length === 0) {
    return (
      <div className="state-box muted">
        Er zijn geen keuzes beschikbaar voor deze stap.
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {options.map((option) => {
        const image = mediaUrl(option.imageUrl);
        const showImageArea = Boolean(image) || variant === "products";

        return (
          <Link
            key={option.id}
            className={`${cardClass}${showImageArea ? "" : " choice-card-text-only"}`}
            to={toOption(option)}
          >
            {image ? (
              <img className={imageFitClass} src={image} alt="" />
            ) : showImageArea ? (
              <div className={`${imageFitClass} placeholder`}>Geen afbeelding</div>
            ) : null}
            <div className="choice-card-body">
              <h2>{option.name}</h2>
              {showAddress && option.address ? (
                <p className="choice-card-address">{option.address}</p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
