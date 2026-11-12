const GTM_MARK = "data-booky-gtm";
const HEADER_MARK = "data-booky-header-scripts";
const FOOTER_MARK = "data-booky-footer-scripts";

function clearMarked(attr: string) {
  document.querySelectorAll(`[${attr}]`).forEach((node) => node.remove());
}

function appendExecutableNodes(html: string, parent: ParentNode, mark: string) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();

  Array.from(template.content.childNodes).forEach((node) => {
    if (node.nodeName === "SCRIPT") {
      const source = node as HTMLScriptElement;
      const script = document.createElement("script");
      for (const attr of Array.from(source.attributes)) {
        script.setAttribute(attr.name, attr.value);
      }
      script.text = source.textContent || "";
      script.setAttribute(mark, "1");
      parent.appendChild(script);
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
      const clone = node.cloneNode(true);
      if (clone.nodeType === Node.ELEMENT_NODE) {
        (clone as HTMLElement).setAttribute(mark, "1");
      }
      parent.appendChild(clone);
    }
  });
}

export function injectGtm(gtmId: string | null | undefined) {
  clearMarked(GTM_MARK);
  const id = gtmId?.trim().toUpperCase();
  if (!id || !/^GTM-[A-Z0-9]+$/.test(id)) return;

  const script = document.createElement("script");
  script.setAttribute(GTM_MARK, "1");
  script.text = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`;
  document.head.appendChild(script);

  const noscript = document.createElement("noscript");
  noscript.setAttribute(GTM_MARK, "1");
  noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
  document.body.insertBefore(noscript, document.body.firstChild);
}

export function injectHeaderScripts(html: string | null | undefined) {
  clearMarked(HEADER_MARK);
  const value = html?.trim();
  if (!value) return;
  appendExecutableNodes(value, document.head, HEADER_MARK);
}

export function injectFooterScripts(html: string | null | undefined) {
  clearMarked(FOOTER_MARK);
  const value = html?.trim();
  if (!value) return;
  appendExecutableNodes(value, document.body, FOOTER_MARK);
}

export function applyEntityTracking(input: {
  gtmId?: string | null;
  headerScripts?: string | null;
  footerScripts?: string | null;
}) {
  injectGtm(input.gtmId);
  injectHeaderScripts(input.headerScripts);
  injectFooterScripts(input.footerScripts);
}
