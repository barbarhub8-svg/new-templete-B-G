import { useState } from "react";
import { Sparkles } from "lucide-react";

export interface AIResult {
  title: string;
  short: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  x: string;
  code: string;
  terms: string;
}
const resultLabels: Record<keyof AIResult, string> = {
  title: "Offer title",
  short: "Short text",
  whatsapp: "WhatsApp message",
  instagram: "Instagram caption",
  facebook: "Facebook post",
  x: "X post",
  code: "Coupon code",
  terms: "Terms",
};

/** This component displays deterministic mock content, never an AI API response. */
export function AIContentPreview({
  result,
  onEdit,
}: {
  result: AIResult;
  onEdit: () => void;
}) {
  const [tab, setTab] = useState<keyof AIResult>("title");
  return (
    <div className="m-panel">
      <div className="m-panel-title">
        <div>
          <span className="m-eyebrow">YOUR CREATIVE, READY TO GO</span>
          <h3>AI-generated preview</h3>
        </div>
        <button className="m-btn secondary" onClick={onEdit}>
          Edit result
        </button>
      </div>
      <div className="m-ai-banner">
        <Sparkles />
        <span>MADE FOR YOUR BUSINESS</span>
        <h2>{result.title}</h2>
        <strong>{result.code}</strong>
      </div>
      <div
        className="m-tabs m-ai-tabs"
        role="tablist"
        aria-label="Generated content"
      >
        {(Object.keys(resultLabels) as (keyof AIResult)[]).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {resultLabels[key]}
          </button>
        ))}
      </div>
      <div className="m-result" role="tabpanel">
        <b>{resultLabels[tab]}</b>
        <p>{result[tab]}</p>
      </div>
    </div>
  );
}
