import type { PublicContentBlock } from "../api/client";

type Props = {
  blocks?: PublicContentBlock[] | null;
};

export function StepContentBlocks({ blocks }: Props) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="step-content-blocks">
      {blocks.map((block) => (
        <section key={block.id} className="step-content-block">
          <div className="step-content-block-copy">
            <h2 className="step-content-block-title">{block.title}</h2>
            <p className="step-content-block-text">{block.text}</p>
          </div>
          {block.buttons.length > 0 ? (
            <div className="step-content-block-actions">
              {block.buttons.map((button) => (
                <a
                  key={`${block.id}-${button.label}-${button.url}`}
                  className="step-content-block-btn"
                  href={button.url}
                  {...(/^https?:\/\//i.test(button.url)
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {button.label}
                </a>
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
