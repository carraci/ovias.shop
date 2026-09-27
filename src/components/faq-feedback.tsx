"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export function FaqFeedback() {
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  if (feedback) {
    return (
      <div className="faq-feedback-response">
        <Check size={16} className="faq-feedback-check" />
        <span>
          {feedback === "yes"
            ? "Thank you for your feedback."
            : "Thank you. Our Client Advisors are available should you need further assistance."}
        </span>
      </div>
    );
  }

  return (
    <div className="faq-feedback-container">
      <span className="faq-feedback-prompt">Was this information helpful?</span>
      <div className="faq-feedback-buttons">
        <button
          type="button"
          onClick={() => setFeedback("yes")}
          className="faq-feedback-btn"
          aria-label="Yes, this information was helpful"
        >
          YES
        </button>
        <button
          type="button"
          onClick={() => setFeedback("no")}
          className="faq-feedback-btn"
          aria-label="No, this information was not helpful"
        >
          NO
        </button>
      </div>
    </div>
  );
}
