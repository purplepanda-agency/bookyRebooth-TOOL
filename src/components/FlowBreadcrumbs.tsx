import { Link } from "react-router-dom";
import type { FlowBreadcrumb } from "../flow/progress";

type FlowBreadcrumbsProps = {
  items: FlowBreadcrumb[];
};

export function FlowBreadcrumbs({ items }: FlowBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav className="flow-breadcrumbs" aria-label="Voortgang">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {index > 0 ? (
              <span className="flow-breadcrumbs-sep" aria-hidden="true">
                /
              </span>
            ) : null}
            {item.to ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
