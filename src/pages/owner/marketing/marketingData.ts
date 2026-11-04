/** Local demo data. None of these records are fetched from, or written to, a server. */
export interface Offer {
  id: string;
  title: string;
  description: string;
  image: string;
  type: string;
  value: string;
  services: string;
  minimum: string;
  maximum: string;
  code: string;
  start: string;
  end: string;
  eligibility: string;
  limit: string;
  terms: string;
  status: string;
  pausedFrom?: string;
  views: number;
  shares: number;
  redemptions: number;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bookings: number;
  revenue: number;
  cost: number;
}
export interface Campaign {
  id: string;
  name: string;
  offer: string;
  group: string;
  date: string;
  status: string;
  pausedFrom?: string;
  message: string;
  stats?: CampaignStats;
}
export interface FestivalTemplate {
  name: string;
  title: string;
  message: string;
  services: string[];
  discount: number;
  code: string;
  banner: string;
  symbol: string;
}
export interface MockCustomer {
  name: string;
  segment: "New" | "Repeat" | "Inactive" | "VIP" | "Birthday" | "Membership";
  service: string;
  lastVisit: string;
  marketingConsent: boolean;
  whatsapp: boolean;
  email: boolean;
  push: boolean;
  unsubscribed: boolean;
  blocked: boolean;
  validMobile: boolean;
  updated: string;
}

export const blank: Offer = {
  id: "",
  title: "",
  description: "",
  image: "",
  type: "Percentage discount",
  value: "",
  services: "",
  minimum: "",
  maximum: "",
  code: "",
  start: "",
  end: "",
  eligibility: "All customers",
  limit: "",
  terms: "",
  status: "Draft",
  views: 0,
  shares: 0,
  redemptions: 0,
};
export const sample: Offer[] = [
  {
    ...blank,
    id: "1",
    title: "Glow Up Weekend",
    description:
      "A little self-care goes a long way. Treat yourself this weekend.",
    value: "20",
    services: "Haircut, Facial",
    code: "GLOW20",
    start: "2026-11-01T09:00",
    end: "2026-11-30T21:00",
    status: "Active",
    views: 1248,
    shares: 86,
    redemptions: 42,
  },
  {
    ...blank,
    id: "2",
    title: "The Self-Care Edit",
    description: "Make time for you with our signature services.",
    type: "Fixed amount discount",
    value: "500",
    services: "Spa, Hair treatment",
    code: "SELFCARE",
    start: "2026-11-10T09:00",
    end: "2026-12-10T21:00",
    status: "Active",
    views: 846,
    shares: 54,
    redemptions: 28,
  },
  {
    ...blank,
    id: "3",
    title: "A Little Midweek Magic",
    description: "A midweek refresh, just for you.",
    value: "15",
    services: "Haircut, Styling",
    code: "MIDWEEK15",
    start: "2026-12-01T09:00",
    end: "2026-12-31T21:00",
    status: "Scheduled",
  },
  {
    ...blank,
    id: "4",
    title: "Autumn Reset",
    description: "Refresh your routine for the season.",
    value: "15",
    services: "Facial, Spa",
    code: "RESET15",
    start: "2026-09-01T09:00",
    end: "2026-09-30T21:00",
    status: "Expired",
    views: 786,
    shares: 43,
    redemptions: 24,
  },
  {
    ...blank,
    id: "5",
    title: "Your Next Refresh",
    description: "A little idea for your next visit.",
    value: "10",
    services: "Haircut",
    code: "REFRESH10",
    status: "Draft",
  },
];
export const initialCampaigns: Campaign[] = [
  {
    id: "c1",
    name: "Weekend glow reminder",
    offer: "Glow Up Weekend",
    group: "Repeat customers",
    date: "2026-11-12T10:00",
    status: "Scheduled",
    message: "A little self-care goes a long way.",
    stats: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bookings: 0,
      revenue: 0,
      cost: 0,
    },
  },
  {
    id: "c2",
    name: "Welcome back, beautiful",
    offer: "The Self-Care Edit",
    group: "Inactive customers",
    date: "2026-10-28T10:00",
    status: "Completed",
    message: "We have missed you!",
    stats: {
      sent: 240,
      delivered: 225,
      opened: 164,
      clicked: 68,
      bookings: 24,
      revenue: 36000,
      cost: 3000,
    },
  },
  {
    id: "c3",
    name: "Autumn refresh",
    offer: "Autumn Reset",
    group: "All opted-in customers",
    date: "2026-09-18T11:00",
    status: "Completed",
    message: "Time for a seasonal refresh.",
    stats: {
      sent: 180,
      delivered: 172,
      opened: 125,
      clicked: 51,
      bookings: 17,
      revenue: 25500,
      cost: 2500,
    },
  },
  {
    id: "c4",
    name: "Birthday sparkle",
    offer: "Your Next Refresh",
    group: "Birthday customers",
    date: "",
    status: "Draft",
    message: "Celebrate with a little extra care.",
  },
  {
    id: "c5",
    name: "Midweek moments",
    offer: "A Little Midweek Magic",
    group: "New customers",
    date: "2026-11-02T10:00",
    status: "Running",
    message: "Make your midweek special.",
    stats: {
      sent: 45,
      delivered: 42,
      opened: 29,
      clicked: 10,
      bookings: 3,
      revenue: 4500,
      cost: 500,
    },
  },
  {
    id: "c6",
    name: "VIP thank you",
    offer: "Glow Up Weekend",
    group: "VIP customers",
    date: "2026-10-30T10:00",
    status: "Paused",
    message: "A special thank you for you.",
  },
];
export const festivalTemplates: FestivalTemplate[] = [
  {
    name: "Diwali",
    title: "Diwali Glow Ritual",
    message: "Light up the season with a little extra glow.",
    services: ["Facial", "Hair styling"],
    discount: 20,
    code: "DIWALI20",
    banner: "linear-gradient(135deg,#6b382a,#b67b3c)",
    symbol: "✦",
  },
  {
    name: "Holi",
    title: "Holi Colour Care",
    message: "Celebrate colour and give your hair the care it deserves.",
    services: ["Hair spa", "Hair treatment"],
    discount: 15,
    code: "HOLI15",
    banner: "linear-gradient(135deg,#713d63,#c77965)",
    symbol: "✿",
  },
  {
    name: "Eid",
    title: "Eid Elegance",
    message: "Get celebration-ready with our Eid self-care special.",
    services: ["Facial", "Hair styling"],
    discount: 20,
    code: "EID20",
    banner: "linear-gradient(135deg,#244d43,#a48d54)",
    symbol: "☾",
  },
  {
    name: "Raksha Bandhan",
    title: "A Gift of Care",
    message: "Celebrate your bond with a beautiful self-care treat.",
    services: ["Manicure", "Facial"],
    discount: 15,
    code: "RAKHI15",
    banner: "linear-gradient(135deg,#6e424e,#bc8a70)",
    symbol: "✧",
  },
  {
    name: "Navratri",
    title: "Nine Nights of Glow",
    message: "Shine through every celebration with a fresh festive look.",
    services: ["Hair styling", "Makeup"],
    discount: 20,
    code: "NAVRATRI20",
    banner: "linear-gradient(135deg,#803f2d,#c78e47)",
    symbol: "✺",
  },
  {
    name: "Karwa Chauth",
    title: "Karwa Chauth Radiance",
    message: "Make your celebration even more radiant.",
    services: ["Makeup", "Facial"],
    discount: 15,
    code: "KARWA15",
    banner: "linear-gradient(135deg,#713341,#ba7959)",
    symbol: "☾",
  },
  {
    name: "Christmas",
    title: "Christmas Sparkle",
    message: "A festive little treat for a season of sparkle.",
    services: ["Hair styling", "Manicure"],
    discount: 20,
    code: "XMAS20",
    banner: "linear-gradient(135deg,#345143,#a76256)",
    symbol: "✶",
  },
  {
    name: "New Year",
    title: "New Year, New Glow",
    message: "Start the year feeling refreshed and ready for anything.",
    services: ["Haircut", "Facial"],
    discount: 20,
    code: "NEWYEAR20",
    banner: "linear-gradient(135deg,#343344,#a78a61)",
    symbol: "✦",
  },
  {
    name: "Valentine’s Day",
    title: "A Little Love for You",
    message: "Make time for yourself this Valentine’s Day.",
    services: ["Spa", "Manicure"],
    discount: 15,
    code: "LOVE15",
    banner: "linear-gradient(135deg,#6d3d50,#bc8390)",
    symbol: "♥",
  },
  {
    name: "Wedding Season",
    title: "The Wedding Edit",
    message: "Your celebration-ready look starts here.",
    services: ["Makeup", "Hair styling"],
    discount: 20,
    code: "WEDDING20",
    banner: "linear-gradient(135deg,#72534d,#c8a67b)",
    symbol: "✧",
  },
  {
    name: "Summer Special",
    title: "Summer Refresh",
    message: "Cool down and refresh your summer routine.",
    services: ["Facial", "Hair spa"],
    discount: 15,
    code: "SUMMER15",
    banner: "linear-gradient(135deg,#546451,#d0a66f)",
    symbol: "☼",
  },
  {
    name: "Monsoon Care",
    title: "Monsoon Hair Rescue",
    message: "Give your hair extra care through the rainy season.",
    services: ["Hair treatment", "Hair spa"],
    discount: 20,
    code: "MONSOON20",
    banner: "linear-gradient(135deg,#354e59,#789a8d)",
    symbol: "❋",
  },
];
export const festivals = festivalTemplates.map((template) => template.name);
export const groups = [
  "All opted-in customers",
  "New customers",
  "Repeat customers",
  "Inactive customers",
  "VIP customers",
  "Birthday customers",
  "Customers by service",
  "Customers by last visit",
];
export const eligibility = [
  "All customers",
  "New customers",
  "Repeat customers",
  "Inactive customers",
  "VIP customers",
  "Membership customers",
  "Birthday customers",
];
export const platforms = [
  "WhatsApp",
  "Facebook",
  "Instagram",
  "Telegram",
  "LinkedIn",
  "X",
  "Snapchat",
];
export const formats = [
  "Instagram Post",
  "Instagram Story",
  "Facebook Post",
  "WhatsApp Status",
  "LinkedIn Post",
  "X Post",
];
export const sections = [
  ["overview", "Overview"],
  ["offers", "Offers & discounts"],
  ["festival", "Festival offers"],
  ["ai", "AI offer creator"],
  ["poster", "Poster creator"],
  ["social", "Social links"],
  ["share", "Share offer"],
  ["whatsapp", "WhatsApp campaign"],
  ["reminder", "Auto reminder"],
  ["history", "Campaign history"],
  ["consent", "Marketing consent"],
];
export const customers: MockCustomer[] = [
  {
    name: "Aarav S.",
    segment: "Repeat",
    service: "Haircut",
    lastVisit: "2026-10-22",
    marketingConsent: true,
    whatsapp: true,
    email: true,
    push: false,
    unsubscribed: false,
    blocked: false,
    validMobile: true,
    updated: "2026-10-24",
  },
  {
    name: "Priya M.",
    segment: "VIP",
    service: "Facial",
    lastVisit: "2026-10-18",
    marketingConsent: true,
    whatsapp: true,
    email: false,
    push: true,
    unsubscribed: false,
    blocked: false,
    validMobile: true,
    updated: "2026-10-18",
  },
  {
    name: "Riya K.",
    segment: "New",
    service: "Haircut",
    lastVisit: "2026-10-25",
    marketingConsent: true,
    whatsapp: true,
    email: true,
    push: true,
    unsubscribed: false,
    blocked: false,
    validMobile: true,
    updated: "2026-10-25",
  },
  {
    name: "Kabir P.",
    segment: "Inactive",
    service: "Hair spa",
    lastVisit: "2026-05-10",
    marketingConsent: true,
    whatsapp: true,
    email: false,
    push: false,
    unsubscribed: false,
    blocked: false,
    validMobile: true,
    updated: "2026-05-10",
  },
  {
    name: "Anaya D.",
    segment: "Birthday",
    service: "Facial",
    lastVisit: "2026-09-18",
    marketingConsent: true,
    whatsapp: true,
    email: true,
    push: true,
    unsubscribed: false,
    blocked: false,
    validMobile: true,
    updated: "2026-09-18",
  },
  {
    name: "Ishaan T.",
    segment: "Membership",
    service: "Haircut",
    lastVisit: "2026-10-10",
    marketingConsent: true,
    whatsapp: true,
    email: true,
    push: true,
    unsubscribed: false,
    blocked: false,
    validMobile: true,
    updated: "2026-10-10",
  },
  {
    name: "Neha R.",
    segment: "Repeat",
    service: "Facial",
    lastVisit: "2026-09-12",
    marketingConsent: false,
    whatsapp: false,
    email: false,
    push: false,
    unsubscribed: true,
    blocked: false,
    validMobile: true,
    updated: "2026-09-12",
  },
  {
    name: "Dev A.",
    segment: "New",
    service: "Haircut",
    lastVisit: "2026-10-01",
    marketingConsent: true,
    whatsapp: true,
    email: false,
    push: false,
    unsubscribed: false,
    blocked: false,
    validMobile: false,
    updated: "2026-10-01",
  },
  {
    name: "Mira B.",
    segment: "VIP",
    service: "Spa",
    lastVisit: "2026-08-20",
    marketingConsent: true,
    whatsapp: true,
    email: false,
    push: false,
    unsubscribed: false,
    blocked: true,
    validMobile: true,
    updated: "2026-08-20",
  },
];
export function eligibleAudience(
  group: string,
  service = "",
  before = "",
): MockCustomer[] {
  return customers.filter((customer) => {
    if (
      !customer.marketingConsent ||
      !customer.whatsapp ||
      customer.unsubscribed ||
      customer.blocked ||
      !customer.validMobile
    )
      return false;
    const segment = group.replace(" customers", "");
    if (["New", "Repeat", "Inactive", "VIP", "Birthday"].includes(segment))
      return customer.segment === segment;
    if (group === "Customers by service")
      return (
        !!service &&
        customer.service.toLowerCase().includes(service.toLowerCase())
      );
    if (group === "Customers by last visit")
      return !!before && customer.lastVisit <= before;
    return true;
  });
}
export function campaignMetrics(
  campaign: Campaign,
): CampaignStats & { ctr: number; roi: number | null } {
  const stats = campaign.stats || {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bookings: 0,
    revenue: 0,
    cost: 0,
  };
  return {
    ...stats,
    ctr: stats.delivered ? (stats.clicked / stats.delivered) * 100 : 0,
    roi: stats.cost ? ((stats.revenue - stats.cost) / stats.cost) * 100 : null,
  };
}
