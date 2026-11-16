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
          <h2 className="step-content-block-title">{block.title}</h2>
          <p className="step-content-block-text">{block.text}</p>
          {block.buttonLabel && block.buttonUrl ? (
            <a
              className="step-content-block-btn"
              href={block.buttonUrl}
              {...(/^https?:\/\//i.test(block.buttonUrl)
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {block.buttonLabel}
            </a>
          ) : null}
        </section>
      ))}
    </div>
  );
}
