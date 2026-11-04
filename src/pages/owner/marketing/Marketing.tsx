import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Gift,
  Image,
  Link2,
  Megaphone,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Target,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import "./marketing.css";
import { AIContentPreview } from "./AIGenerator";
import { generateMockOffer } from "./aiUtils";
import { PosterPreview, type PosterData } from "./PosterCreator";
import { downloadPoster } from "./posterUtils";
import { useLocalMarketingState } from "./useLocalMarketingState";
import { validateOffer, posterForOffer } from "./marketingUtils";
import type { AIResult } from "./AIGenerator";

import {
  type Offer,
  type Campaign,
  blank,
  sample,
  initialCampaigns,
  festivalTemplates,
  festivals,
  groups,
  eligibility,
  platforms,
  formats,
  sections,
  customers,
  eligibleAudience,
  campaignMetrics,
} from "./marketingData";
const Button = ({
  children,
  onClick,
  kind = "secondary",
  disabled = false,
}: any) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`m-btn ${kind}`}
  >
    {children}
  </button>
);
const Field = ({ label, children }: any) => (
  <label className="m-field">
    <span>{label}</span>
    {children}
  </label>
);
const Input = ({ value, onChange, ...props }: any) => (
  <input
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    {...props}
  />
);
const Select = ({ value, onChange, options }: any) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}>
    {options.map((x: string) => (
      <option key={x}>{x}</option>
    ))}
  </select>
);
const Badge = ({ children }: any) => (
  <span className="m-badge">{children}</span>
);
export function MarketingMetricCard({ icon: Icon, label, value, note }: any) {
  return (
    <div className="m-metric">
      <div className="m-metric-top">
        <span>{label}</span>
        <Icon size={17} />
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
export function ConsentBadge({ allowed }: any) {
  return (
    <span className={allowed ? "m-consent yes" : "m-consent"}>
      {allowed ? "Allowed" : "Not allowed"}
    </span>
  );
}
export function MessagePreview({ message }: any) {
  return (
    <div className="m-message">
      <div className="m-message-head">
        <MessageCircle size={15} /> MESSAGE PREVIEW
      </div>
      <p>{message || "Your message preview will appear here."}</p>
      <small>Preview only · No message will be sent</small>
    </div>
  );
}
export function ReminderTimeline({
  frequency = "Every 2 days",
  custom = "2",
  max = "3",
}: any) {
  const interval =
    frequency === "Weekly"
      ? 7
      : frequency === "Every 3 days"
        ? 3
        : frequency === "Custom"
          ? Math.max(1, Number(custom) || 1)
          : 2;
  const count = Math.min(3, Math.max(1, Number(max) || 1));
  return (
    <div className="m-timeline">
      {Array.from({ length: count + 1 }, (_, i) => {
        const label =
          i === 0
            ? "First message"
            : i === count
              ? "Final reminder"
              : `Reminder ${i}`;
        return (
          <div key={i}>
            <span /> Day {1 + i * interval} — {label}
          </div>
        );
      })}
    </div>
  );
}
export function AudienceSelector({ value, onChange }: any) {
  return (
    <Field label="Customer group">
      <Select value={value} onChange={onChange} options={groups} />
    </Field>
  );
}
export function FestivalTemplateCard({ template, onUse }: any) {
  return (
    <div className="m-festival">
      <div className="m-festival-art" style={{ background: template.banner }}>
        <span>{template.symbol}</span>
        <small>THE CELEBRATION EDIT</small>
        <strong>{template.name}</strong>
        <em>Special offers for the season</em>
      </div>
      <div className="m-festival-body">
        <h3>{template.title}</h3>
        <p>{template.message}</p>
        <small>
          Recommended: {template.services.join(", ")} · {template.discount}% off
        </small>
        <Button onClick={onUse}>
          Use template <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
}

export function OfferCard({
  offer,
  onAction,
  previewOnly = false,
}: {
  offer: Offer;
  onAction: (action: string, offer: Offer) => void;
  previewOnly?: boolean;
}) {
  return (
    <div className="m-offer">
      <div
        className="m-offer-image"
        style={
          offer.image ? { backgroundImage: `url(${offer.image})` } : undefined
        }
      >
        <span className="m-offer-brand">
          NEXORA <i>✦</i> OFFERS
        </span>
        <div>
          <small>TAKE A MOMENT FOR YOU</small>
          <strong>
            {offer.value
              ? offer.type === "Percentage discount"
                ? `${offer.value}% OFF`
                : offer.type === "Fixed amount discount"
                  ? `₹${offer.value} OFF`
                  : offer.type
              : "SPECIAL OFFER"}
          </strong>
          <em>{offer.title}</em>
        </div>
      </div>
      <div className="m-offer-body">
        <div className="m-offer-title">
          <div>
            <Badge>{offer.status}</Badge>
            <h3>{offer.title}</h3>
          </div>
          <Gift size={18} />
        </div>
        <p>{offer.description || "A special offer for your customers."}</p>
        <div className="m-offer-meta">
          <span>
            {offer.type}: {offer.value || "—"}
          </span>
          <span>{offer.services || "All services"}</span>
          <span>
            {offer.start?.slice(0, 10) || "No start"} →{" "}
            {offer.end?.slice(0, 10) || "No end"}
          </span>
          <span>
            Code: <b>{offer.code || "—"}</b>
          </span>
        </div>
        <div className="m-offer-stats">
          <span>
            <Eye size={14} /> {offer.views} views
          </span>
          <span>↗ {offer.shares} shares</span>
          <span>✓ {offer.redemptions} redeemed</span>
        </div>
        {!previewOnly && (
          <div className="m-offer-actions">
            {[
              "Edit",
              "Duplicate",
              "Preview",
              ...(offer.status === "Active" ? ["Share"] : []),
              ...(["Active", "Scheduled", "Paused"].includes(offer.status)
                ? [offer.status === "Paused" ? "Resume" : "Pause"]
                : []),
              "Delete",
            ].map((action) => (
              <button key={action} onClick={() => onAction(action, offer)}>
                {action}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export function CampaignCard({
  campaign,
  onAction,
}: {
  campaign: Campaign;
  onAction: (action: string, campaign: Campaign) => void;
}) {
  const stats = campaignMetrics(campaign);
  return (
    <div className="m-campaign">
      <div>
        <Badge>{campaign.status}</Badge>
        <h3>{campaign.name}</h3>
        <p>
          {campaign.offer || "No offer"} · WhatsApp · {campaign.group}
        </p>
        <small>
          Scheduled: {campaign.date?.replace("T", " ") || "Not scheduled"}
        </small>
      </div>
      <div className="m-campaign-numbers">
        <span>
          <b>{stats.sent}</b>Sent
        </span>
        <span>
          <b>{stats.delivered}</b>Delivered
        </span>
        <span>
          <b>{stats.opened}</b>Opened
        </span>
        <span>
          <b>{stats.clicked}</b>Clicked
        </span>
        <span>
          <b>{stats.bookings}</b>Bookings
        </span>
        <span>
          <b>{stats.ctr.toFixed(1)}%</b>CTR
        </span>
        <span>
          <b>{stats.roi === null ? "—" : `${stats.roi.toFixed(0)}%`}</b>ROI
        </span>
      </div>
      <div className="m-offer-actions">
        {[
          "View Report",
          "Duplicate",
          ...(["Running", "Scheduled"].includes(campaign.status)
            ? ["Pause"]
            : []),
          ...(campaign.status === "Paused" ? ["Resume"] : []),
          ...(["Running", "Scheduled", "Paused"].includes(campaign.status)
            ? ["Stop"]
            : []),
        ].map((a) => (
          <button key={a} onClick={() => onAction(a, campaign)}>
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
export function SocialShareSheet({ platform, message, onClose, onCopy }: any) {
  return (
    <div className="m-overlay" onClick={onClose}>
      <div className="m-modal m-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="m-panel-title">
          <h3>Share on {platform}</h3>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <MessagePreview message={message} />
        {["Instagram", "Snapchat"].includes(platform) && (
          <p>Download poster and copy caption</p>
        )}
        <div className="m-actions">
          <Button kind="primary" onClick={onCopy}>
            <Copy size={15} /> Copy text
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export default function Marketing() {
  const [params, setParams] = useSearchParams();
  const screen = params.get("section") || "overview";
  const go = (s: string) => {
    setParams(s === "overview" ? {} : { section: s });
    window.scrollTo(0, 0);
  };
  const { toast } = useToast();
  const notify = (title: string, description = "Saved on this device only.") =>
    toast({ title, description });
  const [offers, setOffers] = useLocalMarketingState<Offer[]>(
    "nexora-marketing-offers",
    sample,
  );
  const [campaigns, setCampaigns] = useLocalMarketingState<Campaign[]>(
    "nexora-marketing-campaigns",
    initialCampaigns,
  );
  const [links, setLinks] = useLocalMarketingState<Record<string, string>>(
    "nexora-marketing-links",
    {},
  );
  const [linkDraft, setLinkDraft] = useLocalMarketingState(
    "nexora-marketing-link-draft",
    links,
  );
  const [form, setForm] = useLocalMarketingState<Offer>(
    "nexora-marketing-form",
    blank,
  );
  const [chartMetric, setChartMetric] = useState<
    "delivered" | "opened" | "clicked"
  >("delivered");
  const [tab, setTab] = useState("All");
  const [historyTab, setHistoryTab] = useState("Scheduled");
  const [modal, setModal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useLocalMarketingState(
    "nexora-marketing-selected",
    "1",
  );
  const [ai, setAi] = useLocalMarketingState("nexora-marketing-ai", {
    goal: "Increase bookings",
    customer: "All customers",
    occasion: "None",
    services: "Haircut and styling",
    discount: "20% off",
    validity: "30 days",
    language: "English",
    tone: "Warm",
  });
  const [result, setResult] = useLocalMarketingState<AIResult | null>(
    "nexora-marketing-ai-result",
    null,
  );
  const [generating, setGenerating] = useState(false);
  const [poster, setPoster] = useLocalMarketingState<PosterData>(
    "nexora-marketing-poster",
    {
      shop: "YOUR SALON",
      title: "Glow Up Weekend",
      discount: "20% OFF",
      service: "Haircut & Facial",
      validity: "",
      phone: "",
      link: "",
      logo: "",
      align: "center",
      qr: true,
      template: "Classic",
      background: "",
      foreground: "",
    },
  );
  const [format, setFormat] = useLocalMarketingState(
    "nexora-marketing-poster-format",
    "Instagram Post",
  );
  const [sharePlatform, setSharePlatform] = useState("WhatsApp");
  const [shareTexts, setShareTexts] = useLocalMarketingState<
    Record<string, string>
  >("nexora-marketing-share-texts", {});
  const setShareText = (text: string) =>
    setShareTexts((previous) => ({ ...previous, [sharePlatform]: text }));
  const [bookingLink, setBookingLink] = useLocalMarketingState(
    "nexora-marketing-booking-link",
    "",
  );
  const [shareCode, setShareCode] = useState(true);
  const [shareExpiry, setShareExpiry] = useState(true);
  const [audienceService, setAudienceService] = useLocalMarketingState(
    "nexora-marketing-audience-service",
    "",
  );
  const [audienceDate, setAudienceDate] = useLocalMarketingState(
    "nexora-marketing-audience-date",
    "",
  );
  const [camp, setCamp] = useLocalMarketingState(
    "nexora-marketing-campaign-form",
    {
      name: "",
      offer: "",
      group: groups[0],
      message:
        "Hello! Discover our latest offer and book your next visit today.",
      link: "",
      code: "",
      date: "",
      timing: "Schedule",
    },
  );
  const [rem, setRem] = useLocalMarketingState("nexora-marketing-reminder", {
    enabled: false,
    group: groups[0],
    start: "",
    end: "",
    time: "10:00",
    offer: "",
    message: "A friendly reminder: your special offer is waiting!",
    max: "3",
    frequency: "Every 2 days",
    custom: "2",
    stopBooking: true,
    stopExpiry: true,
    skip: true,
    exclude: true,
    hoursStart: "09:00",
    hoursEnd: "18:00",
  });
  const [filters, setFilters] = useState({
    unsubscribed: true,
    invalid: true,
    blocked: true,
    noConsent: true,
  });
  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal]);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);
  const change = (key: keyof Offer, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  const saveOffer = (status: string) => {
    const error = validateOffer(form);
    if (error) {
      notify("Check your offer", error);
      return;
    }
    if (
      status === "Active" &&
      form.end &&
      new Date(form.end).getTime() <= Date.now()
    ) {
      notify(
        "Check your dates",
        "An offer cannot be published after its end date.",
      );
      return;
    }
    const actualStatus =
      status === "Active" &&
      form.start &&
      new Date(form.start).getTime() > Date.now()
        ? "Scheduled"
        : status;
    const item = {
      ...form,
      id: form.id || Date.now().toString(),
      status: actualStatus,
    };
    setOffers((xs) => [item, ...xs.filter((x) => x.id !== item.id)]);
    setSelected(item.id);
    setForm(blank);
    notify(
      status === "Draft" ? "Draft saved" : "Offer published",
      "This is a local preview; nothing was published online.",
    );
    go("offers");
  };
  const actionOffer = (action: string, o: Offer) => {
    setSelected(o.id);
    if (action === "Edit") {
      setForm(o);
      go("create");
    } else if (action === "Duplicate") {
      setOffers((xs) => [
        {
          ...o,
          id: Date.now().toString(),
          title: o.title + " (copy)",
          status: "Draft",
          views: 0,
          shares: 0,
          redemptions: 0,
        },
        ...xs,
      ]);
      notify("Offer duplicated");
    } else if (action === "Preview") setModal({ type: "offer", offer: o });
    else if (action === "Share") {
      if (o.status !== "Active") {
        notify("Publish this offer first", "Only active offers can be shared.");
        return;
      }
      setPoster((p) => posterForOffer(p, o));
      setShareTexts({});
      go("share");
    } else if (action === "Pause" || action === "Resume") {
      setOffers((xs) =>
        xs.map((x) =>
          x.id === o.id
            ? action === "Pause"
              ? { ...x, status: "Paused", pausedFrom: x.status }
              : {
                  ...x,
                  status: x.pausedFrom || "Active",
                  pausedFrom: undefined,
                }
            : x,
        ),
      );
      notify("Offer status updated");
    } else setModal({ type: "delete", offer: o });
  };
  const actionCampaign = (action: string, c: Campaign) => {
    if (action === "View Report") setModal({ type: "report", campaign: c });
    else if (action === "Duplicate") {
      setCampaigns((xs) => [
        {
          ...c,
          id: Date.now().toString(),
          name: c.name + " (copy)",
          status: "Draft",
          stats: undefined,
        },
        ...xs,
      ]);
      notify("Campaign duplicated");
    } else if (action === "Pause") setModal({ type: "pause", campaign: c });
    else {
      setCampaigns((xs) =>
        xs.map((x) =>
          x.id === c.id
            ? {
                ...x,
                status:
                  action === "Resume" ? x.pausedFrom || "Running" : "Completed",
                pausedFrom: undefined,
              }
            : x,
        ),
      );
      notify(
        "Campaign updated",
        "Mock campaign updated locally; no messages are sent.",
      );
    }
  };
  const [generationCount, setGenerationCount] = useState(0);
  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setResult(generateMockOffer(ai, generationCount));
      setGenerationCount((n) => n + 1);
      setGenerating(false);
    }, 700);
  };
  const saveAIResult = (status: "Draft" | "Active") => {
    if (!result) return;
    const percent = ai.discount.match(/(\d+(?:\.\d+)?)\s*%/);
    const item: Offer = {
      ...blank,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: result.title,
      description: result.short,
      services: ai.services,
      code: result.code,
      terms: result.terms,
      value: percent ? percent[1] : "",
      status,
    };
    const error = validateOffer(item);
    if (error) {
      notify("Check generated offer", error);
      return;
    }
    setOffers((xs) => [item, ...xs]);
    setSelected(item.id);
    setPoster((p) => posterForOffer(p, item));
    setShareTexts({});
    notify(
      status === "Draft"
        ? "AI offer saved as draft"
        : "AI offer published locally",
      "Nothing was published online.",
    );
  };
  const copy = (text: string) => {
    if (!navigator.clipboard?.writeText) {
      notify(
        "Could not copy",
        "Clipboard access is unavailable. Please copy the text manually.",
      );
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => notify("Copied to clipboard", "Your text is ready to share."))
      .catch(() => notify("Could not copy", "Please copy the text manually."));
  };
  const shareOffer =
    offers.find((o) => o.id === selected && o.status === "Active") ||
    offers.find((o) => o.status === "Active");
  const sharePoster = shareOffer ? posterForOffer(poster, shareOffer) : poster;
  const defaultMessage = [
    shareOffer?.title || "Special offer",
    shareOffer?.description || "",
    shareCode && shareOffer?.code ? `Use code ${shareOffer.code}.` : "",
    shareExpiry && shareOffer?.end
      ? `Ends ${shareOffer.end.slice(0, 10)}.`
      : "",
    bookingLink ? `Book: ${bookingLink}` : "",
    sharePlatform === "Instagram" ? "#SelfCare #Salon" : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const message = shareTexts[sharePlatform] ?? defaultMessage;
  const updateCamp = (k: string, v: string) =>
    setCamp((c) => ({ ...c, [k]: v }));
  const updateRem = (k: string, v: any) =>
    setRem((r: any) => ({ ...r, [k]: v }));
  const campaignSave = (status: string) => {
    if (!camp.name.trim()) {
      notify("Add a campaign name");
      return;
    }
    if (
      status !== "Draft" &&
      eligibleAudience(camp.group, audienceService, audienceDate).length === 0
    ) {
      notify(
        "No eligible customers",
        "Choose an audience with opted-in customers.",
      );
      return;
    }
    if (status === "Scheduled" && !camp.date) {
      notify("Choose a schedule date and time");
      return;
    }
    if (
      status === "Scheduled" &&
      (!Number.isFinite(new Date(camp.date).getTime()) ||
        new Date(camp.date).getTime() <= Date.now())
    ) {
      notify("Check the schedule", "Choose a future date and time.");
      return;
    }
    if (status !== "Draft" && !camp.message.trim()) {
      notify("Add a message first");
      return;
    }
    setCampaigns((xs) => [
      {
        id: Date.now().toString(),
        name: camp.name,
        offer: camp.offer,
        group: camp.group,
        date: camp.date,
        status,
        message: camp.message,
      },
      ...xs,
    ]);
    setModal(null);
    setCamp((c) => ({ ...c, name: "", offer: "", code: "", date: "" }));
    notify(
      status === "Draft"
        ? "Campaign draft saved"
        : "Campaign scheduled locally",
      "Demo only. No WhatsApp messages will be sent.",
    );
    go("history");
    setHistoryTab(status);
  };
  const upload = (file: File | undefined, cb: (s: string) => void) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 1024 * 1024) {
      notify(
        "Image not added",
        "Choose an image smaller than 1 MB so it can be stored locally.",
      );
      return;
    }
    const reader = new FileReader();
    reader.onerror = () =>
      notify("Image not added", "The selected image could not be read.");
    reader.onload = () => cb(String(reader.result));
    reader.readAsDataURL(file);
  };
  const download = () => {
    downloadPoster(screen === "share" ? sharePoster : poster, format);
    notify("Mockup downloaded", "Your SVG mockup is ready.");
  };
  const heading = (title: string, sub: string) => (
    <div className="m-page-heading">
      <div>
        <span className="m-eyebrow">
          MARKETING STUDIO <ChevronRight size={12} />{" "}
          {sections.find((x) => x[0] === screen)?.[1]?.toUpperCase() ||
            "CREATE OFFER"}
        </span>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
    </div>
  );
  return (
    <div className="marketing">
      <div className="m-topline">
        <div>
          <span className="m-top-icon">
            <Megaphone size={17} />
          </span>
          <span>
            <b>Marketing studio</b>
            <small>GROW YOUR BUSINESS</small>
          </span>
        </div>
        <span className="m-demo">✦ &nbsp; FRONTEND DEMO</span>
      </div>
      <div className="m-layout">
        <aside className="m-sidebar">
          <p>YOUR WORKSPACE</p>
          {sections.map(([id, label], i) => (
            <button
              className={screen === id ? "active" : ""}
              key={id}
              onClick={() => go(id)}
            >
              {React.createElement(
                [
                  BarChart3,
                  Gift,
                  Sparkles,
                  Wand2,
                  Image,
                  Link2,
                  Send,
                  MessageCircle,
                  CalendarDays,
                  Target,
                  Users,
                ][i],
                { size: 16 },
              )}
              {label}
              {screen === id && <span />}
            </button>
          ))}
          <div className="m-side-note">
            <Sparkles size={17} />
            <b>A little marketing magic</b>
            <p>
              Thoughtful offers turn first visits into lasting relationships.
            </p>
          </div>
        </aside>
        <main className="m-content">
          <div className="m-mobile-nav">
            <select
              aria-label="Marketing section"
              value={screen === "create" ? "offers" : screen}
              onChange={(e) => go(e.target.value)}
            >
              {sections.map(([id, label]) => (
                <option value={id} key={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {loading ? (
            <div className="m-skeleton">
              <div />
              <div />
              <div />
            </div>
          ) : (
            <>
              {screen === "overview" && (
                <>
                  {heading(
                    "A little growth looks good on you.",
                    "Everything you need to bring customers back, all in one place.",
                  )}
                  <div className="m-hero">
                    <div className="m-hero-copy">
                      <span className="m-eyebrow">
                        ✦ &nbsp; YOUR MARKETING, MADE SIMPLE
                      </span>
                      <h2>
                        Good things happen
                        <br />
                        <em>when you show up.</em>
                      </h2>
                      <p>
                        Make every message count. Create offers your customers
                        will love and give them a reason to come back.
                      </p>
                      <Button
                        kind="primary"
                        onClick={() => {
                          setForm(blank);
                          go("create");
                        }}
                      >
                        Create an offer <ArrowRight size={16} />
                      </Button>
                    </div>
                    <div className="m-hero-art">
                      <div className="m-orbit one" />
                      <div className="m-orbit two" />
                      <div className="m-hero-card">
                        <span>✦</span>
                        <small>A LITTLE SOMETHING FOR YOU</small>
                        <strong>
                          Good hair.
                          <br />
                          <em>Good mood.</em>
                        </strong>
                        <b>20% OFF</b>
                        <small>YOUR NEXT VISIT</small>
                      </div>
                      <div className="m-float">
                        ✦ &nbsp; Made for your customers
                      </div>
                    </div>
                  </div>
                  <div className="m-section-head">
                    <div>
                      <span className="m-eyebrow">THE BIG PICTURE</span>
                      <h2>Marketing overview</h2>
                      <p>A snapshot of how your marketing is doing.</p>
                    </div>
                    <span className="m-period">Mock data · This month</span>
                  </div>
                  <div className="m-metrics">
                    {[
                      [
                        Gift,
                        "Active offers",
                        offers.filter((x) => x.status === "Active").length,
                        "Ready to share",
                      ],
                      [
                        CalendarDays,
                        "Scheduled campaigns",
                        campaigns.filter((x) => x.status === "Scheduled")
                          .length,
                        "Coming up",
                      ],
                      [
                        Users,
                        "Customers reached",
                        campaigns.reduce(
                          (n, c) => n + campaignMetrics(c).delivered,
                          0,
                        ),
                        "Mock delivered messages",
                      ],
                      [
                        Eye,
                        "Offer views",
                        offers.reduce((n, o) => n + o.views, 0),
                        "All offer views",
                      ],
                      [
                        MessageCircle,
                        "WhatsApp messages",
                        campaigns.reduce(
                          (n, c) => n + campaignMetrics(c).sent,
                          0,
                        ),
                        "Mock messages",
                      ],
                      [
                        Check,
                        "Offer redemptions",
                        offers.reduce((n, o) => n + o.redemptions, 0),
                        "Happy visits",
                      ],
                    ].map(([icon, label, value, note]: any) => (
                      <MarketingMetricCard
                        key={label}
                        {...{ icon, label, value, note }}
                      />
                    ))}
                  </div>
                  <div className="m-panel m-chart">
                    <div className="m-panel-title">
                      <div>
                        <span className="m-eyebrow">CAMPAIGN ENGAGEMENT</span>
                        <h3>How your campaigns connect</h3>
                        <p>Mock analytics · Select a metric to explore</p>
                      </div>
                      <div className="m-tabs">
                        {(["delivered", "opened", "clicked"] as const).map(
                          (metric) => (
                            <button
                              key={metric}
                              className={chartMetric === metric ? "active" : ""}
                              onClick={() => setChartMetric(metric)}
                            >
                              {metric}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                    <div className="m-chart-bars">
                      {campaigns
                        .filter((c) => c.stats && c.stats.sent > 0)
                        .map((c) => {
                          const stats = campaignMetrics(c);
                          return (
                            <div
                              key={c.id}
                              title={`${c.name}: ${stats[chartMetric]}`}
                            >
                              <span>{stats[chartMetric]}</span>
                              <div
                                style={{
                                  height: `${Math.max(4, (stats[chartMetric] / Math.max(...campaigns.map((x) => campaignMetrics(x)[chartMetric]), 1)) * 100)}%`,
                                }}
                              />
                              <small>{c.name}</small>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                  <div className="m-section-head">
                    <div>
                      <span className="m-eyebrow">LET'S GET STARTED</span>
                      <h2>What would you like to do?</h2>
                    </div>
                  </div>
                  <div className="m-quick">
                    {[
                      [
                        Plus,
                        "Create new offer",
                        "Make something special",
                        "create",
                      ],
                      [
                        Sparkles,
                        "Create festival offer",
                        "Celebrate the season",
                        "festival",
                      ],
                      [
                        Wand2,
                        "Generate with AI",
                        "Find your next big idea",
                        "ai",
                      ],
                      [
                        Send,
                        "Share existing offer",
                        "Get the word out",
                        "share",
                      ],
                      [
                        CalendarDays,
                        "Schedule reminder",
                        "Stay top of mind",
                        "reminder",
                      ],
                    ].map(([Icon, title, sub, id]: any) => (
                      <button
                        key={id}
                        onClick={() => {
                          if (id === "create") setForm(blank);
                          go(id);
                        }}
                      >
                        <span>
                          <Icon size={18} />
                        </span>
                        <b>{title}</b>
                        <small>{sub}</small>
                        <ArrowRight size={15} />
                      </button>
                    ))}
                  </div>
                  <div className="m-overview-grid">
                    <div className="m-panel">
                      <div className="m-panel-title">
                        <div>
                          <span className="m-eyebrow">LIVE NOW</span>
                          <h3>Active offers</h3>
                        </div>
                        <button
                          className="m-text-button"
                          onClick={() => go("offers")}
                        >
                          View all <ArrowRight size={14} />
                        </button>
                      </div>
                      {offers.filter((x) => x.status === "Active").length ? (
                        offers
                          .filter((x) => x.status === "Active")
                          .slice(0, 3)
                          .map((o, i) => (
                            <div className="m-list-row" key={o.id}>
                              <div className={"m-mini-art art" + i}>✦</div>
                              <div>
                                <b>{o.title}</b>
                                <small>
                                  {o.services} · {o.code}
                                </small>
                              </div>
                              <Badge>Active</Badge>
                              <button onClick={() => actionOffer("Share", o)}>
                                <ChevronRight size={17} />
                              </button>
                            </div>
                          ))
                      ) : (
                        <p className="m-empty">
                          No offers created yet. Create your first offer to get
                          started.
                        </p>
                      )}
                    </div>
                    <div className="m-panel">
                      <div className="m-panel-title">
                        <div>
                          <span className="m-eyebrow">WHAT'S NEXT</span>
                          <h3>Upcoming campaigns</h3>
                        </div>
                        <button
                          className="m-text-button"
                          onClick={() => go("history")}
                        >
                          View all <ArrowRight size={14} />
                        </button>
                      </div>
                      {campaigns.filter((x) => x.status === "Scheduled")
                        .length ? (
                        campaigns
                          .filter((x) => x.status === "Scheduled")
                          .slice(0, 2)
                          .map((c) => (
                            <div className="m-list-row" key={c.id}>
                              <div className="m-mini-icon">
                                <CalendarDays size={18} />
                              </div>
                              <div>
                                <b>{c.name}</b>
                                <small>
                                  {c.group} · {c.date.slice(0, 10)}
                                </small>
                              </div>
                              <Badge>Scheduled</Badge>
                            </div>
                          ))
                      ) : (
                        <p className="m-empty">No campaigns scheduled yet.</p>
                      )}
                      <button
                        className="m-dashed"
                        onClick={() => go("whatsapp")}
                      >
                        + &nbsp; Plan a campaign
                      </button>
                    </div>
                  </div>
                  <div className="m-overview-grid">
                    <div className="m-panel">
                      <div className="m-panel-title">
                        <div>
                          <span className="m-eyebrow">RECENTLY</span>
                          <h3>Marketing activity</h3>
                        </div>
                      </div>
                      <div className="m-activity">
                        <span>✦</span>
                        <p>
                          <b>Your marketing studio is ready</b>
                          <small>
                            Explore your tools and create something lovely.
                          </small>
                        </p>
                        <small>Today</small>
                      </div>
                      <div className="m-activity">
                        <span>↗</span>
                        <p>
                          <b>Offer views are growing</b>
                          <small>
                            Your offers are catching customers' attention.
                          </small>
                        </p>
                        <small>Mock activity</small>
                      </div>
                    </div>
                    <div className="m-panel">
                      <div className="m-panel-title">
                        <div>
                          <span className="m-eyebrow">YOUR TOP PICKS</span>
                          <h3>Best performing offers</h3>
                        </div>
                        <BarChart3 size={18} />
                      </div>
                      {offers
                        .slice()
                        .sort((a, b) => b.views - a.views)
                        .slice(0, 3)
                        .map((o, i) => (
                          <div className="m-performance" key={o.id}>
                            <div>
                              <b>{o.title}</b>
                              <small>{o.views} views</small>
                            </div>
                            <div>
                              <span
                                style={{
                                  width: `${Math.max(5, 100 - i * 30)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
              {screen === "offers" && (
                <>
                  {heading(
                    "Offers & discounts",
                    "Create a little something your customers can’t resist.",
                  )}
                  <div className="m-toolbar">
                    <div className="m-tabs">
                      {["All", "Active", "Scheduled", "Expired", "Drafts"].map(
                        (t) => (
                          <button
                            className={tab === t ? "active" : ""}
                            onClick={() => setTab(t)}
                            key={t}
                          >
                            {t}
                          </button>
                        ),
                      )}
                    </div>
                    <Button
                      kind="primary"
                      onClick={() => {
                        setForm(blank);
                        go("create");
                      }}
                    >
                      <Plus size={16} /> Create offer
                    </Button>
                  </div>
                  <div className="m-offers">
                    {offers
                      .filter(
                        (o) =>
                          tab === "All" ||
                          o.status === (tab === "Drafts" ? "Draft" : tab),
                      )
                      .map((o) => (
                        <OfferCard
                          key={o.id}
                          offer={o}
                          onAction={actionOffer}
                        />
                      ))}
                  </div>
                  {!offers.filter(
                    (o) =>
                      tab === "All" ||
                      o.status === (tab === "Drafts" ? "Draft" : tab),
                  ).length && (
                    <div className="m-empty m-panel">
                      No offers created in this category.{" "}
                      <button
                        onClick={() => {
                          setForm(blank);
                          go("create");
                        }}
                      >
                        Create an offer
                      </button>
                    </div>
                  )}
                </>
              )}
              {screen === "create" && (
                <>
                  {heading(
                    form.id ? "Edit offer" : "Create an offer",
                    "The best offers start with a thoughtful idea.",
                  )}
                  <div className="m-panel">
                    <div className="m-panel-title">
                      <div>
                        <span className="m-eyebrow">THE DETAILS</span>
                        <h3>Make it yours</h3>
                      </div>
                      <Gift size={20} />
                    </div>
                    <div className="m-form-grid">
                      <Field label="Offer title *">
                        <Input
                          value={form.title}
                          onChange={(v: string) => change("title", v)}
                          placeholder="e.g. Glow Up Weekend"
                        />
                      </Field>
                      <Field label="Short description">
                        <Input
                          value={form.description}
                          onChange={(v: string) => change("description", v)}
                          placeholder="Tell customers what makes it special"
                        />
                      </Field>
                      <Field label="Offer image">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            upload(e.target.files?.[0], (v) =>
                              change("image", v),
                            )
                          }
                        />
                      </Field>
                      <Field label="Discount type">
                        <Select
                          value={form.type}
                          onChange={(v: string) => change("type", v)}
                          options={[
                            "Percentage discount",
                            "Fixed amount discount",
                            "Buy One Get One",
                            "Free add-on service",
                          ]}
                        />
                      </Field>
                      <Field
                        label={
                          form.type === "Percentage discount"
                            ? "Percentage discount"
                            : form.type === "Fixed amount discount"
                              ? "Fixed amount discount"
                              : "Discount / add-on details"
                        }
                      >
                        <Input
                          type={
                            [
                              "Percentage discount",
                              "Fixed amount discount",
                            ].includes(form.type)
                              ? "number"
                              : "text"
                          }
                          min={
                            [
                              "Percentage discount",
                              "Fixed amount discount",
                            ].includes(form.type)
                              ? 0
                              : undefined
                          }
                          max={
                            form.type === "Percentage discount"
                              ? 100
                              : undefined
                          }
                          step="any"
                          value={form.value}
                          onChange={(v: string) => change("value", v)}
                          placeholder="e.g. 20"
                        />
                      </Field>
                      <Field label="Applicable services">
                        <Input
                          value={form.services}
                          onChange={(v: string) => change("services", v)}
                          placeholder="e.g. Haircut, facial"
                        />
                      </Field>
                      {[
                        ["minimum", "Minimum bill amount"],
                        ["maximum", "Maximum discount"],
                        ["code", "Coupon code *"],
                        ["start", "Start date and time"],
                        ["end", "End date and time"],
                        ["limit", "Usage limit"],
                      ].map(([k, l]) => (
                        <Field key={k} label={l}>
                          <Input
                            type={
                              k === "start" || k === "end"
                                ? "datetime-local"
                                : "text"
                            }
                            value={(form as any)[k]}
                            onChange={(v: string) =>
                              change(k as keyof Offer, v)
                            }
                          />
                        </Field>
                      ))}
                      <Field label="Customer eligibility">
                        <Select
                          value={form.eligibility}
                          onChange={(v: string) => change("eligibility", v)}
                          options={eligibility}
                        />
                      </Field>
                      <Field label="Terms and conditions">
                        <textarea
                          value={form.terms}
                          onChange={(e) => change("terms", e.target.value)}
                          placeholder="Add any conditions"
                        />
                      </Field>
                    </div>
                    <div className="m-actions">
                      <Button onClick={() => saveOffer("Draft")}>
                        Save draft
                      </Button>
                      <Button
                        onClick={() => setModal({ type: "offer", offer: form })}
                      >
                        Preview
                      </Button>
                      <Button
                        kind="primary"
                        onClick={() => saveOffer("Active")}
                      >
                        Publish offer <ArrowRight size={15} />
                      </Button>
                    </div>
                  </div>
                </>
              )}
              {screen === "festival" && (
                <>
                  {heading(
                    "Celebrate every little occasion.",
                    "Ready-to-use ideas for the moments your customers love.",
                  )}
                  <div className="m-festival-grid">
                    {festivalTemplates.map((template) => (
                      <FestivalTemplateCard
                        key={template.name}
                        template={template}
                        onUse={() => {
                          setForm({
                            ...blank,
                            title: template.title,
                            description: template.message,
                            services: template.services.join(", "),
                            value: String(template.discount),
                            code: template.code,
                          });
                          go("create");
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
              {screen === "ai" && (
                <>
                  {heading(
                    "A little help from AI.",
                    "Turn your ideas into a ready-to-share campaign in seconds.",
                  )}
                  <div className="m-notice">
                    ✦ &nbsp; This is a mock AI experience. No AI service is
                    connected and generated content is for preview only.
                  </div>
                  <div className="m-two-col">
                    <div className="m-panel">
                      <span className="m-eyebrow">TELL US YOUR IDEA</span>
                      <h3>Let's make something good</h3>
                      <div className="m-form-stack">
                        {(
                          [
                            [
                              "goal",
                              "Campaign goal",
                              [
                                "Increase bookings",
                                "Bring back inactive customers",
                                "Promote a new service",
                                "Fill empty slots",
                                "Festival promotion",
                                "Increase repeat visits",
                                "Increase weekday bookings",
                              ],
                            ],
                            ["customer", "Customer type", eligibility],
                            [
                              "occasion",
                              "Festival or occasion",
                              ["None", ...festivals],
                            ],
                            [
                              "language",
                              "Communication language",
                              ["Hindi", "English", "Hinglish"],
                            ],
                            [
                              "tone",
                              "Tone",
                              ["Warm", "Professional", "Playful", "Luxury"],
                            ],
                          ] as any[]
                        ).map(([k, l, opts]) => (
                          <Field label={l} key={k}>
                            <Select
                              value={(ai as any)[k]}
                              onChange={(v: string) => setAi({ ...ai, [k]: v })}
                              options={opts}
                            />
                          </Field>
                        ))}
                        {[
                          ["services", "Services to promote"],
                          ["discount", "Discount preference"],
                          ["validity", "Offer validity"],
                        ].map(([k, l]) => (
                          <Field label={l} key={k}>
                            <Input
                              value={(ai as any)[k]}
                              onChange={(v: string) => setAi({ ...ai, [k]: v })}
                            />
                          </Field>
                        ))}
                        <Button
                          kind="primary"
                          disabled={generating}
                          onClick={generate}
                        >
                          <Sparkles size={16} />
                          {generating
                            ? "Generating preview…"
                            : result
                              ? "Generate again"
                              : "Generate offer"}
                        </Button>
                      </div>
                    </div>
                    <div>
                      {generating ? (
                        <div className="m-panel m-skeleton" aria-live="polite">
                          <p>Generating mock preview…</p>
                          <div />
                          <div />
                          <div />
                        </div>
                      ) : result ? (
                        <>
                          <AIContentPreview
                            result={result}
                            onEdit={() => setModal({ type: "aiEdit" })}
                          />
                          <div className="m-actions">
                            <Button onClick={() => saveAIResult("Draft")}>
                              Save as draft
                            </Button>
                            <Button
                              kind="primary"
                              onClick={() => saveAIResult("Active")}
                            >
                              Publish
                            </Button>
                            <Button
                              onClick={() => {
                                const published = offers.find(
                                  (o) =>
                                    o.status === "Active" &&
                                    o.title === result.title &&
                                    o.code === result.code,
                                );
                                if (!published) {
                                  notify(
                                    "Publish this offer first",
                                    "Share is available after the generated offer is published locally.",
                                  );
                                  return;
                                }
                                setSelected(published.id);
                                setPoster((p) => posterForOffer(p, published));
                                setShareTexts({ WhatsApp: result.whatsapp });
                                setSharePlatform("WhatsApp");
                                go("share");
                              }}
                            >
                              Share
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="m-panel m-ai-empty">
                          <Sparkles size={30} />
                          <h3>Your next great idea starts here.</h3>
                          <p>
                            Tell us a little about your goals and we’ll create a
                            mock offer preview for you.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              {screen === "poster" && (
                <>
                  {heading(
                    "Make it picture perfect.",
                    "Create a promotional poster that feels just like your business.",
                  )}
                  <div className="m-two-col">
                    <div className="m-panel">
                      <span className="m-eyebrow">DESIGN YOUR POSTER</span>
                      <h3>The creative details</h3>
                      <div className="m-form-stack">
                        <Field label="Select offer">
                          <select
                            value={
                              offers.some((o) => o.id === selected)
                                ? selected
                                : offers[0]?.id || ""
                            }
                            onChange={(e) => {
                              const o = offers.find(
                                (x) => x.id === e.target.value,
                              );
                              setSelected(e.target.value);
                              if (o) setPoster((p) => posterForOffer(p, o));
                            }}
                          >
                            {offers.map((o) => (
                              <option value={o.id} key={o.id}>
                                {o.title}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Select template">
                          <Select
                            value={poster.template}
                            onChange={(v: string) =>
                              setPoster({ ...poster, template: v })
                            }
                            options={["Classic", "Minimal", "Celebration"]}
                          />
                        </Field>
                        <Field label="Upload shop logo">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              upload(e.target.files?.[0], (v) =>
                                setPoster({ ...poster, logo: v }),
                              )
                            }
                          />
                        </Field>
                        {[
                          ["shop", "Shop name"],
                          ["title", "Offer title"],
                          ["discount", "Discount"],
                          ["service", "Service name"],
                          ["validity", "Validity date"],
                          ["phone", "Phone number"],
                          ["link", "Booking link"],
                        ].map(([k, l]) => (
                          <Field label={l} key={k}>
                            <Input
                              type={k === "validity" ? "date" : "text"}
                              value={(poster as any)[k]}
                              onChange={(v: string) =>
                                setPoster({ ...poster, [k]: v })
                              }
                            />
                          </Field>
                        ))}
                        <Field label="Background color">
                          <input
                            type="color"
                            value={poster.background || "#554638"}
                            onChange={(e) =>
                              setPoster({
                                ...poster,
                                background: e.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Text color">
                          <input
                            type="color"
                            value={poster.foreground || "#eadac0"}
                            onChange={(e) =>
                              setPoster({
                                ...poster,
                                foreground: e.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Text alignment">
                          <Select
                            value={poster.align}
                            onChange={(v: string) =>
                              setPoster({ ...poster, align: v })
                            }
                            options={["left", "center", "right"]}
                          />
                        </Field>
                        <label className="m-check">
                          <input
                            type="checkbox"
                            checked={poster.qr}
                            onChange={(e) =>
                              setPoster({ ...poster, qr: e.target.checked })
                            }
                          />{" "}
                          Add QR placeholder
                        </label>
                      </div>
                    </div>
                    <div>
                      <div className="m-panel">
                        <Field label="Preview format">
                          <Select
                            value={format}
                            onChange={setFormat}
                            options={formats}
                          />
                        </Field>
                        <PosterPreview data={sharePoster} format={format} />
                        <div className="m-actions">
                          <Button onClick={() => notify("Preview updated")}>
                            Preview
                          </Button>
                          <Button
                            onClick={() => {
                              notify("Design saved");
                            }}
                          >
                            Save design
                          </Button>
                          <Button onClick={download}>
                            <Download size={15} /> Download mockup
                          </Button>
                          <Button onClick={() => go("share")}>Share</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {screen === "social" && (
                <>
                  {heading(
                    "Stay connected.",
                    "Keep your social profiles together in one handy place.",
                  )}
                  <div className="m-notice">
                    Links are saved on this device only. Connected means a link
                    has been saved, not that an account has been authenticated.
                  </div>
                  {!Object.values(links).some(Boolean) && (
                    <p className="m-empty">No social account added yet.</p>
                  )}
                  <div className="m-panel">
                    {[
                      "WhatsApp number",
                      "Facebook page",
                      "Instagram profile",
                      "Telegram channel",
                      "LinkedIn page",
                      "X profile",
                      "Snapchat profile",
                      "YouTube channel",
                      "Website URL",
                      "Google Business Profile",
                    ].map((p, i) => (
                      <div className="m-social-row" key={p}>
                        <span className="m-social-icon">
                          {
                            [
                              "W",
                              "f",
                              "◎",
                              "➤",
                              "in",
                              "𝕏",
                              "S",
                              "▶",
                              "🌐",
                              "G",
                            ][i]
                          }
                        </span>
                        <div>
                          <b>{p}</b>
                          <small>
                            {links[p] ? "Connected" : "Not Connected"}
                          </small>
                        </div>
                        <Input
                          value={linkDraft[p] || ""}
                          onChange={(v: string) =>
                            setLinkDraft({ ...linkDraft, [p]: v })
                          }
                          placeholder={
                            i === 0
                              ? "Phone number including country code"
                              : "https://"
                          }
                        />
                        <button
                          onClick={() => {
                            const v = linkDraft[p];
                            if (!v) {
                              notify("Add a link first");
                              return;
                            }
                            const url =
                              i === 0
                                ? `https://wa.me/${v.replace(/\D/g, "")}`
                                : v;
                            try {
                              const parsed = new URL(url);
                              if (
                                !["http:", "https:"].includes(parsed.protocol)
                              )
                                throw Error();
                              window.open(
                                parsed.href,
                                "_blank",
                                "noopener,noreferrer",
                              );
                            } catch {
                              notify(
                                "Invalid link",
                                "Enter a valid http or https URL.",
                              );
                            }
                          }}
                        >
                          Test link
                        </button>
                        <button
                          onClick={() => {
                            const n = { ...linkDraft, [p]: "" };
                            setLinkDraft(n);
                            setLinks({ ...links, [p]: "" });
                            notify("Link removed");
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="m-actions">
                      <Button
                        kind="primary"
                        onClick={() => {
                          setLinks(linkDraft);
                          notify("Social links saved");
                        }}
                      >
                        Save links
                      </Button>
                    </div>
                  </div>
                  {Object.values(links).some(Boolean) && (
                    <div className="m-panel">
                      <h3>Profile preview</h3>
                      <div className="m-profile-preview">
                        {Object.entries(links)
                          .filter(([, v]) => v)
                          .map(([k, v]) => (
                            <div key={k}>
                              <b>{k}</b>
                              <small>{v}</small>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {screen === "share" && (
                <>
                  {heading(
                    "Share something special.",
                    "A good offer deserves to be seen.",
                  )}
                  <div className="m-two-col">
                    <div className="m-panel">
                      <Field label="Select published offer">
                        <select
                          value={shareOffer?.id || ""}
                          onChange={(e) => {
                            const chosen = offers.find(
                              (o) => o.id === e.target.value,
                            );
                            setSelected(e.target.value);
                            if (chosen)
                              setPoster((p) => posterForOffer(p, chosen));
                            setShareTexts({});
                          }}
                        >
                          {offers
                            .filter((o) => o.status === "Active")
                            .map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.title}
                              </option>
                            ))}
                        </select>
                      </Field>
                      {!offers.some((o) => o.status === "Active") && (
                        <p className="m-empty">
                          No published offers available.
                        </p>
                      )}
                      <div className="m-platforms">
                        {platforms.map((p) => (
                          <button
                            className={sharePlatform === p ? "active" : ""}
                            key={p}
                            onClick={() => setSharePlatform(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <div className="m-form-stack">
                        <Field label={`${sharePlatform} message`}>
                          <textarea
                            value={message}
                            onChange={(e) => setShareText(e.target.value)}
                          />
                        </Field>
                        <Field label="Booking link">
                          <Input
                            value={bookingLink}
                            onChange={setBookingLink}
                            placeholder="https://"
                          />
                        </Field>
                        <label className="m-check">
                          <input
                            type="checkbox"
                            checked={shareCode}
                            onChange={(e) => setShareCode(e.target.checked)}
                          />{" "}
                          Add coupon code
                        </label>
                        <label className="m-check">
                          <input
                            type="checkbox"
                            checked={shareExpiry}
                            onChange={(e) => setShareExpiry(e.target.checked)}
                          />{" "}
                          Add expiry date
                        </label>
                        <Field label="Poster format">
                          <Select
                            value={format}
                            onChange={setFormat}
                            options={formats}
                          />
                        </Field>
                      </div>
                      <div className="m-actions">
                        <Button onClick={() => copy(message)}>
                          <Copy size={15} /> Copy text
                        </Button>
                        <Button
                          onClick={() =>
                            bookingLink
                              ? copy(bookingLink)
                              : notify(
                                  "Add a booking link first",
                                  "Local demo offers do not have a public URL.",
                                )
                          }
                        >
                          Copy link
                        </Button>
                        <Button
                          onClick={async () => {
                            if (navigator.share) {
                              try {
                                await navigator.share({
                                  title: shareOffer?.title,
                                  text: message,
                                });
                                notify(
                                  "Share completed",
                                  "Your device share sheet was opened.",
                                );
                              } catch {
                                notify(
                                  "Share cancelled",
                                  "Nothing was posted.",
                                );
                              }
                            } else
                              setModal({
                                type: "share",
                                platform: "Native Share",
                              });
                          }}
                        >
                          Native share
                        </Button>
                        <Button onClick={download}>Download poster</Button>
                        <Button
                          kind="primary"
                          onClick={() => {
                            const text = encodeURIComponent(message);
                            if (!shareOffer) {
                              notify(
                                "No published offers",
                                "Publish an offer locally before sharing.",
                              );
                              return;
                            }
                            if (
                              ["Facebook", "LinkedIn", "Telegram"].includes(
                                sharePlatform,
                              ) &&
                              !bookingLink
                            ) {
                              notify(
                                "Add a booking link first",
                                "Local demo offers do not have a public URL.",
                              );
                              return;
                            }
                            const url = encodeURIComponent(bookingLink);
                            const targets: Record<string, string> = {
                              WhatsApp: `https://wa.me/?text=${text}`,
                              Facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                              Telegram: `https://t.me/share/url?url=${url}&text=${text}`,
                              LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
                              X: `https://twitter.com/intent/tweet?text=${text}`,
                            };
                            if (targets[sharePlatform]) {
                              window.open(
                                targets[sharePlatform],
                                "_blank",
                                "noopener,noreferrer",
                              );
                              notify(
                                "Share window opened",
                                "Review your message before sharing; nothing was posted automatically.",
                              );
                            } else
                              setModal({
                                type: "share",
                                platform: sharePlatform,
                              });
                          }}
                        >
                          Open share action
                        </Button>
                      </div>
                    </div>
                    <div>
                      <MessagePreview message={message} />
                      <p className="m-notice">
                        For Instagram and Snapchat: Download poster and copy
                        caption. Nothing is automatically published.
                      </p>
                      <PosterPreview data={poster} format={format} />
                    </div>
                  </div>
                </>
              )}
              {screen === "whatsapp" && (
                <>
                  {heading(
                    "A message worth opening.",
                    "Plan a thoughtful WhatsApp campaign for the right customers.",
                  )}
                  <div className="m-notice">
                    Frontend demo only. No messages are sent or scheduled with
                    WhatsApp.
                  </div>
                  <div className="m-two-col">
                    <div className="m-panel">
                      <span className="m-eyebrow">CAMPAIGN DETAILS</span>
                      <h3>Start a conversation</h3>
                      <div className="m-form-stack">
                        <Field label="Campaign name">
                          <Input
                            value={camp.name}
                            onChange={(v: string) => updateCamp("name", v)}
                            placeholder="Name your campaign"
                          />
                        </Field>
                        <Field label="Select offer">
                          <select
                            value={camp.offer}
                            onChange={(e) =>
                              updateCamp("offer", e.target.value)
                            }
                          >
                            <option value="">Select an offer</option>
                            {offers.map((o) => (
                              <option key={o.id}>{o.title}</option>
                            ))}
                          </select>
                        </Field>
                        <AudienceSelector
                          value={camp.group}
                          onChange={(v: string) => updateCamp("group", v)}
                        />
                        {camp.group === "Customers by service" && (
                          <Field label="Service">
                            <Input
                              value={audienceService}
                              onChange={setAudienceService}
                              placeholder="e.g. Facial"
                            />
                          </Field>
                        )}
                        {camp.group === "Customers by last visit" && (
                          <Field label="Last visit on or before">
                            <Input
                              type="date"
                              value={audienceDate}
                              onChange={setAudienceDate}
                            />
                          </Field>
                        )}
                        <div className="m-estimate">
                          <Users size={17} /> Estimated recipients:{" "}
                          <b>
                            {
                              eligibleAudience(
                                camp.group,
                                audienceService,
                                audienceDate,
                              ).length
                            }
                          </b>{" "}
                          <small>mock records · opted-in only</small>
                        </div>
                        {eligibleAudience(
                          camp.group,
                          audienceService,
                          audienceDate,
                        ).length === 0 && (
                          <p className="m-empty">
                            No eligible customers in this mock group.
                          </p>
                        )}
                        <Field label="Quick templates">
                          <select
                            onChange={(e) =>
                              updateCamp(
                                "message",
                                `Hello! ${e.target.value} — we'd love to see you. Book your next visit today!`,
                              )
                            }
                          >
                            <option>Select a template</option>
                            {[
                              "New offer",
                              "Festival offer",
                              "Appointment reminder",
                              "We miss you",
                              "Birthday offer",
                              "Empty slot available",
                              "Weekend booking",
                              "Membership promotion",
                            ].map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Message template">
                          <textarea
                            value={camp.message}
                            onChange={(e) =>
                              updateCamp("message", e.target.value)
                            }
                          />
                        </Field>
                        <Field label="Booking link">
                          <Input
                            value={camp.link}
                            onChange={(v: string) => updateCamp("link", v)}
                          />
                        </Field>
                        <Field label="Coupon code">
                          <Input
                            value={camp.code}
                            onChange={(v: string) => updateCamp("code", v)}
                          />
                        </Field>
                        <Field label="Delivery">
                          <Select
                            value={camp.timing}
                            onChange={(v: string) => updateCamp("timing", v)}
                            options={["Schedule", "Send now"]}
                          />
                        </Field>
                        <Field label="Schedule date and time">
                          <Input
                            type="datetime-local"
                            value={camp.date}
                            onChange={(v: string) => updateCamp("date", v)}
                          />
                        </Field>
                      </div>
                      <div className="m-actions">
                        <Button onClick={() => setModal({ type: "message" })}>
                          Preview message
                        </Button>
                        <Button
                          onClick={() =>
                            notify(
                              "Test preview ready",
                              "No real test message was sent.",
                            )
                          }
                        >
                          Send test
                        </Button>
                        <Button onClick={() => campaignSave("Draft")}>
                          Save draft
                        </Button>
                        <Button
                          kind="primary"
                          onClick={() => setModal({ type: "confirmCampaign" })}
                        >
                          Schedule
                        </Button>
                      </div>
                    </div>
                    <MessagePreview
                      message={`${camp.message} ${camp.code} ${camp.link}`}
                    />
                  </div>
                </>
              )}
              {screen === "reminder" && (
                <>
                  {heading(
                    "A gentle reminder goes a long way.",
                    "Stay in touch thoughtfully, with your customers’ consent.",
                  )}
                  <div className="m-warning">
                    Frequent promotional messages may annoy customers. Send only
                    to customers who have agreed to receive marketing messages.
                  </div>
                  <div className="m-two-col">
                    <div className="m-panel">
                      <label className="m-toggle">
                        <span>
                          <b>Send a WhatsApp reminder every 2 days</b>
                          <small>
                            Demo configuration only; no messages will be sent.
                          </small>
                        </span>
                        <input
                          type="checkbox"
                          checked={rem.enabled}
                          onChange={(e) =>
                            e.target.checked
                              ? setModal({ type: "activate" })
                              : updateRem("enabled", false)
                          }
                        />
                      </label>
                      <div className="m-form-stack">
                        <AudienceSelector
                          value={rem.group}
                          onChange={(v: string) => updateRem("group", v)}
                        />
                        {([
                          ["start", "Start date", "date"],
                          ["end", "End date", "date"],
                          ["time", "Send time", "time"],
                          ["hoursStart", "Business hours start", "time"],
                          ["hoursEnd", "Business hours end", "time"],
                          ["max", "Maximum reminders", "number"],
                        ] as const).map(([k, l, t]) => (
                          <Field label={l} key={k}>
                            <Input
                              type={t}
                              min={k === "max" ? 1 : undefined}
                              max={k === "max" ? 3 : undefined}
                              value={rem[k]}
                              onChange={(v: string) =>
                                updateRem(
                                  k,
                                  k === "max"
                                    ? String(
                                        Math.min(
                                          3,
                                          Math.max(1, Number(v) || 1),
                                        ),
                                      )
                                    : v,
                                )
                              }
                            />
                          </Field>
                        ))}
                        <Field label="Selected offer">
                          <select
                            value={rem.offer}
                            onChange={(e) => updateRem("offer", e.target.value)}
                          >
                            <option value="">Select an offer</option>
                            {offers
                              .filter((o) => o.status === "Active")
                              .map((o) => (
                                <option key={o.id}>{o.title}</option>
                              ))}
                          </select>
                        </Field>
                        <Field label="Frequency">
                          <Select
                            value={rem.frequency}
                            onChange={(v: string) => updateRem("frequency", v)}
                            options={[
                              "Every 2 days",
                              "Every 3 days",
                              "Weekly",
                              "Custom",
                            ]}
                          />
                        </Field>
                        {rem.frequency === "Custom" && (
                          <Field label="Custom interval (days)">
                            <Input
                              type="number"
                              min="1"
                              value={rem.custom}
                              onChange={(v: string) => updateRem("custom", v)}
                            />
                          </Field>
                        )}
                        <Field label="Message template">
                          <textarea
                            value={rem.message}
                            onChange={(e) =>
                              updateRem("message", e.target.value)
                            }
                          />
                        </Field>
                        {([
                          ["stopBooking", "Stop after booking"],
                          ["stopExpiry", "Stop after offer expiry"],
                          ["skip", "Skip customers contacted recently"],
                          ["exclude", "Exclude unsubscribed customers"],
                        ] as const).map(([k, l]) => (
                          <label className="m-check" key={k}>
                            <input
                              type="checkbox"
                              checked={rem[k]}
                              disabled={k === "exclude" || k === "stopBooking"}
                              onChange={(e) => updateRem(k, e.target.checked)}
                            />
                            {l}
                          </label>
                        ))}
                        <p className="m-note">
                          Consent is required. Unsubscribed customers are
                          excluded. Reminders stop after booking and are never
                          sent outside selected business hours. Maximum 3
                          reminders.
                        </p>
                      </div>
                      <div className="m-actions">
                        <Button onClick={() => setModal({ type: "timeline" })}>
                          Preview sequence
                        </Button>
                        <Button
                          kind="primary"
                          onClick={() => setModal({ type: "activate" })}
                        >
                          Activate reminder
                        </Button>
                        <Button
                          onClick={() => {
                            updateRem("enabled", false);
                            notify("Reminder paused");
                          }}
                        >
                          Pause
                        </Button>
                        <Button
                          onClick={() =>
                            notify(
                              "Edit settings",
                              "Change the settings above; they save locally.",
                            )
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => {
                            updateRem("enabled", false);
                            notify("Campaign stopped");
                          }}
                        >
                          Stop campaign
                        </Button>
                      </div>
                    </div>
                    <div className="m-panel">
                      <span className="m-eyebrow">EXAMPLE SEQUENCE</span>
                      <h3>Your reminder timeline</h3>
                      <p>
                        Preview based on your selected frequency and reminder
                        limit.
                      </p>
                      <ReminderTimeline
                        frequency={rem.frequency}
                        custom={rem.custom}
                        max={rem.max}
                      />
                    </div>
                  </div>
                </>
              )}
              {screen === "history" && (
                <>
                  {heading(
                    "Campaign history",
                    "A little look back at everything you’ve planned.",
                  )}
                  <div className="m-tabs">
                    {[
                      "Draft",
                      "Scheduled",
                      "Running",
                      "Completed",
                      "Paused",
                    ].map((t) => (
                      <button
                        className={historyTab === t ? "active" : ""}
                        key={t}
                        onClick={() => setHistoryTab(t)}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="m-stack">
                    {campaigns
                      .filter((c) => c.status === historyTab)
                      .map((c) => (
                        <CampaignCard
                          key={c.id}
                          campaign={c}
                          onAction={actionCampaign}
                        />
                      ))}
                  </div>
                  {!campaigns.some((c) => c.status === historyTab) && (
                    <div className="m-panel m-empty">
                      {historyTab === "Scheduled"
                        ? "No campaigns scheduled yet."
                        : `No ${historyTab.toLowerCase()} campaigns yet.`}
                    </div>
                  )}
                </>
              )}
              {screen === "consent" && (
                <>
                  {heading(
                    "Respect every preference.",
                    "A thoughtful marketing strategy always starts with consent.",
                  )}
                  <div className="m-notice">
                    Customer consent is read-only. These are mock preferences;
                    owners cannot change consent here.
                  </div>
                  <div className="m-panel">
                    <span className="m-eyebrow">AUDIENCE SAFEGUARDS</span>
                    <h3>Exclude customers who should not be contacted</h3>
                    <div className="m-filter-grid">
                      {[
                        ["unsubscribed", "Unsubscribed customers"],
                        ["invalid", "Invalid mobile numbers"],
                        ["blocked", "Blocked customers"],
                        ["noConsent", "Customers without marketing consent"],
                      ].map(([k, l]) => (
                        <label className="m-check" key={k}>
                          <input
                            type="checkbox"
                            checked={(filters as any)[k]}
                            disabled={k === "unsubscribed" || k === "noConsent"}
                            onChange={(e) =>
                              setFilters({ ...filters, [k]: e.target.checked })
                            }
                          />{" "}
                          {l}
                        </label>
                      ))}
                    </div>
                    <p className="m-note">
                      Consent and unsubscribe exclusions are always enforced in
                      this demo.
                    </p>
                  </div>
                  <div className="m-panel">
                    <h3>Customer communication preferences</h3>
                    <div className="m-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            {[
                              "Customer",
                              "Marketing consent",
                              "WhatsApp",
                              "Email",
                              "Push",
                              "Unsubscribed",
                              "Last consent update",
                            ].map((x) => (
                              <th key={x}>{x}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {customers
                            .filter(
                              (c) =>
                                (!filters.unsubscribed || !c.unsubscribed) &&
                                (!filters.noConsent || c.marketingConsent) &&
                                (!filters.invalid || c.validMobile) &&
                                (!filters.blocked || !c.blocked),
                            )
                            .map((c) => (
                              <tr key={c.name}>
                                <td>{c.name}</td>
                                <td>
                                  {c.marketingConsent
                                    ? "Consented"
                                    : "Not consented"}
                                </td>
                                <td>
                                  <ConsentBadge allowed={c.whatsapp} />
                                </td>
                                <td>
                                  <ConsentBadge allowed={c.email} />
                                </td>
                                <td>
                                  <ConsentBadge allowed={c.push} />
                                </td>
                                <td>{c.unsubscribed ? "Yes" : "No"}</td>
                                <td>{c.updated}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>
      {modal && (
        <div className="m-overlay" onClick={() => setModal(null)}>
          <div
            className="m-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Marketing dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="m-panel-title">
              <h3>
                {
                  (
                    {
                      delete: "Delete offer?",
                      pause: "Pause campaign?",
                      confirmCampaign: "Confirm campaign",
                      activate: "Before you activate",
                      offer: "Offer preview",
                      message: "Message preview",
                      timeline: "Reminder sequence",
                      report: "Campaign report",
                      aiEdit: "Edit generated result",
                      share: "Share offer",
                    } as any
                  )[modal.type]
                }
              </h3>
              <button aria-label="Close dialog" onClick={() => setModal(null)}>
                <X size={20} />
              </button>
            </div>
            {modal.type === "delete" && (
              <>
                <p>Delete “{modal.offer.title}”? This cannot be undone.</p>
                <div className="m-actions">
                  <Button onClick={() => setModal(null)}>Cancel</Button>
                  <Button
                    kind="primary"
                    onClick={() => {
                      setOffers((xs) =>
                        xs.filter((x) => x.id !== modal.offer.id),
                      );
                      setModal(null);
                      notify("Offer deleted");
                    }}
                  >
                    Delete offer
                  </Button>
                </div>
              </>
            )}
            {modal.type === "pause" && (
              <>
                <p>
                  Pause “{modal.campaign.name}”? This only changes its local
                  demo status.
                </p>
                <div className="m-actions">
                  <Button onClick={() => setModal(null)}>Cancel</Button>
                  <Button
                    kind="primary"
                    onClick={() => {
                      setCampaigns((xs) =>
                        xs.map((c) =>
                          c.id === modal.campaign.id
                            ? { ...c, status: "Paused", pausedFrom: c.status }
                            : c,
                        ),
                      );
                      setModal(null);
                      notify("Campaign paused");
                    }}
                  >
                    Pause campaign
                  </Button>
                </div>
              </>
            )}
            {modal.type === "confirmCampaign" && (
              <>
                <p>
                  Confirm this campaign for {camp.group}. This is a frontend
                  demo; no real messages will be sent.
                </p>
                <div className="m-actions">
                  <Button onClick={() => setModal(null)}>Cancel</Button>
                  <Button
                    kind="primary"
                    onClick={() =>
                      campaignSave(
                        camp.timing === "Send now" ? "Running" : "Scheduled",
                      )
                    }
                  >
                    Confirm campaign
                  </Button>
                </div>
              </>
            )}
            {modal.type === "activate" && (
              <>
                <p>
                  Frequent promotional messages may annoy customers. Send only
                  to customers who have agreed to receive marketing messages.
                </p>
                <p>
                  This activates a local demo only. No real reminders will be
                  sent.
                </p>
                <div className="m-actions">
                  <Button onClick={() => setModal(null)}>Cancel</Button>
                  <Button
                    kind="primary"
                    onClick={() => {
                      if (rem.start && rem.end && rem.end <= rem.start) {
                        notify(
                          "Check your dates",
                          "End date must be after start date.",
                        );
                        return;
                      }
                      if (
                        rem.time < rem.hoursStart ||
                        rem.time > rem.hoursEnd
                      ) {
                        notify(
                          "Check business hours",
                          "Send time must be within selected business hours.",
                        );
                        return;
                      }
                      if (
                        !rem.time ||
                        !rem.hoursStart ||
                        !rem.hoursEnd ||
                        rem.hoursStart >= rem.hoursEnd
                      ) {
                        notify(
                          "Check business hours",
                          "Enter a valid start, end and send time.",
                        );
                        return;
                      }
                      if (
                        rem.frequency === "Custom" &&
                        (!Number.isInteger(Number(rem.custom)) ||
                          Number(rem.custom) < 1)
                      ) {
                        notify(
                          "Check frequency",
                          "Custom interval must be a positive whole number.",
                        );
                        return;
                      }
                      if (
                        !rem.offer ||
                        !offers.some(
                          (o) => o.title === rem.offer && o.status === "Active",
                        )
                      ) {
                        notify("Select an active offer first");
                        return;
                      }
                      updateRem("enabled", true);
                      setModal(null);
                      notify(
                        "Reminder activated locally",
                        "No real reminders will be sent.",
                      );
                    }}
                  >
                    Activate reminder
                  </Button>
                </div>
              </>
            )}
            {modal.type === "offer" && (
              <OfferCard
                offer={modal.offer}
                previewOnly
                onAction={(a: string, o: Offer) => {
                  setModal(null);
                  actionOffer(a, o);
                }}
              />
            )}
            {modal.type === "message" && (
              <MessagePreview
                message={`${camp.message} ${camp.code} ${camp.link}`}
              />
            )}
            {modal.type === "timeline" && (
              <ReminderTimeline
                frequency={rem.frequency}
                custom={rem.custom}
                max={rem.max}
              />
            )}
            {modal.type === "report" && (
              <>
                <p>Mock analytics for {modal.campaign.name}</p>
                <p>
                  Sent: {campaignMetrics(modal.campaign).sent} · Delivered:{" "}
                  {campaignMetrics(modal.campaign).delivered} · Opened:{" "}
                  {campaignMetrics(modal.campaign).opened} · Clicked:{" "}
                  {campaignMetrics(modal.campaign).clicked} · Bookings:{" "}
                  {campaignMetrics(modal.campaign).bookings}
                </p>
                <p>
                  Click-through rate:{" "}
                  {campaignMetrics(modal.campaign).ctr.toFixed(1)}% · ROI:{" "}
                  {campaignMetrics(modal.campaign).roi == null ? "—" : `${campaignMetrics(modal.campaign).roi?.toFixed(0)}%`}
                </p>
              </>
            )}
            {modal.type === "aiEdit" && result && (
              <div className="m-form-stack">
                {(Object.keys(result) as Array<keyof AIResult>).map((k) => (
                  <Field key={k} label={k}>
                    <textarea
                      value={result[k]}
                      onChange={(e) => {
                        const value = e.target.value;
                        setResult((previous) => previous ? { ...previous, [k]: value } : previous);
                      }}
                    />
                  </Field>
                ))}
                <Button kind="primary" onClick={() => setModal(null)}>
                  Done
                </Button>
              </div>
            )}
            {modal.type === "share" && (
              <>
                <MessagePreview message={message} />
                <p>
                  Download poster and copy caption. No post is automatically
                  published.
                </p>
                <div className="m-actions">
                  <Button onClick={() => copy(message)}>Copy text</Button>
                  <Button onClick={download}>Download poster</Button>
                  <Button onClick={() => setModal(null)}>Done</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
