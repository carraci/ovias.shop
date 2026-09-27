import React from "react";
import Link from "next/link";

interface FaqContentRendererProps {
  content: string;
  className?: string;
}

function parseInline(text: string): React.ReactNode[] {
  // Regex to match markdown links [text](url) and bold **text**
  const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*)/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const [, linkText, href] = match;
        const isInternal = href.startsWith("/") || href.includes("ovias.shop");
        const internalHref = href.replace(/^https?:\/\/(www\.)?ovias\.shop/, "");
        if (isInternal) {
          return (
            <Link key={i} href={internalHref || "/"} className="faq-content-link">
              {linkText}
            </Link>
          );
        }
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="faq-content-link"
          >
            {linkText}
          </a>
        );
      }
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={i} className="faq-content-strong">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function FaqContentRenderer({
  content,
  className = "",
}: FaqContentRendererProps) {
  if (!content) return null;

  // Split into raw blocks separated by blank lines
  const rawBlocks = content.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className={`faq-article-content ${className}`}>
      {rawBlocks.map((block, blockIndex) => {
        // Heading block
        if (block.startsWith("### ")) {
          const headingText = block.replace(/^###\s+/, "");
          return (
            <h3 key={blockIndex} className="faq-content-h3">
              {parseInline(headingText)}
            </h3>
          );
        }

        if (block.startsWith("## ")) {
          const headingText = block.replace(/^##\s+/, "");
          return (
            <h3 key={blockIndex} className="faq-content-h3">
              {parseInline(headingText)}
            </h3>
          );
        }

        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const isAllListItems = lines.every(
          (l) => l.startsWith("* ") || l.startsWith("- ")
        );

        if (isAllListItems) {
          return (
            <ul key={blockIndex} className="faq-content-ul">
              {lines.map((line, liIndex) => (
                <li key={liIndex} className="faq-content-li">
                  {parseInline(line.replace(/^[*\-]\s+/, ""))}
                </li>
              ))}
            </ul>
          );
        }

        // Check if block has leading text followed by list items
        const hasListItems = lines.some(
          (l) => l.startsWith("* ") || l.startsWith("- ")
        );

        if (hasListItems) {
          const nonListLines: string[] = [];
          const listLines: string[] = [];
          let seenList = false;

          for (const line of lines) {
            if (line.startsWith("* ") || line.startsWith("- ")) {
              seenList = true;
              listLines.push(line.replace(/^[*\-]\s+/, ""));
            } else if (!seenList) {
              nonListLines.push(line);
            } else {
              // If text occurs after list items, append
              listLines.push(line);
            }
          }

          return (
            <div key={blockIndex} className="faq-content-mixed-block">
              {nonListLines.length > 0 && (
                <p className="faq-content-p">
                  {parseInline(nonListLines.join(" "))}
                </p>
              )}
              {listLines.length > 0 && (
                <ul className="faq-content-ul">
                  {listLines.map((li, liIndex) => (
                    <li key={liIndex} className="faq-content-li">
                      {parseInline(li)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={blockIndex} className="faq-content-p">
            {parseInline(lines.join(" "))}
          </p>
        );
      })}
    </div>
  );
}
