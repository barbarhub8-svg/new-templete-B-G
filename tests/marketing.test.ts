import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  campaignMetrics,
  customers,
  eligibleAudience,
  festivalTemplates,
  initialCampaigns,
  sample,
} from "../src/pages/owner/marketing/marketingData";
import { generateMockOffer } from "../src/pages/owner/marketing/aiUtils";
import { posterDimensions } from "../src/pages/owner/marketing/posterUtils";

test("festival templates and offer statuses are complete", () => {
  assert.equal(festivalTemplates.length, 12);
  assert.equal(new Set(festivalTemplates.map((t) => t.name)).size, 12);
  assert.ok(
    festivalTemplates.every(
      (t) =>
        t.title &&
        t.message &&
        t.services.length &&
        t.discount &&
        t.code &&
        t.banner,
    ),
  );
  for (const status of ["Active", "Scheduled", "Expired", "Draft"])
    assert.ok(sample.some((o) => o.status === status));
});

test("audience estimates enforce consent, unsubscribe, blocking and valid number", () => {
  const audience = eligibleAudience("All opted-in customers");
  assert.ok(audience.length > 0 && audience.length < customers.length);
  assert.ok(
    audience.every(
      (c) =>
        c.marketingConsent &&
        c.whatsapp &&
        !c.unsubscribed &&
        !c.blocked &&
        c.validMobile,
    ),
  );
  assert.ok(
    eligibleAudience("VIP customers").every((c) => c.segment === "VIP"),
  );
  assert.equal(eligibleAudience("Customers by service", "Facial").length, 2);
  assert.equal(
    eligibleAudience("Customers by last visit", "", "2026-05-11").length,
    1,
  );
});

test("analytics safely calculate rates and return no ROI for zero cost", () => {
  const completed = campaignMetrics(
    initialCampaigns.find((c) => c.id === "c2")!,
  );
  assert.equal(completed.ctr, (68 / 225) * 100);
  assert.equal(completed.roi, 1100);
  assert.equal(campaignMetrics(initialCampaigns[0]).roi, null);
});

test("mock AI uses selected inputs and produces every channel", () => {
  const result = generateMockOffer(
    {
      goal: "Increase bookings",
      customer: "VIP customers",
      occasion: "Diwali",
      services: "Facial",
      discount: "20%",
      validity: "7 days",
      language: "Hindi",
      tone: "Warm",
    },
    0,
  );
  assert.match(result.title, /Diwali/);
  assert.match(result.short, /Facial/);
  assert.ok(
    result.whatsapp &&
      result.instagram &&
      result.facebook &&
      result.x &&
      result.code &&
      result.terms,
  );
});

test("poster formats have platform-specific dimensions", () => {
  assert.deepEqual(posterDimensions("Instagram Post"), [1080, 1080]);
  assert.deepEqual(posterDimensions("Instagram Story"), [1080, 1920]);
  assert.deepEqual(posterDimensions("Facebook Post"), [1200, 628]);
  assert.deepEqual(posterDimensions("X Post"), [1200, 675]);
});

test("offer validation rejects invalid codes, dates, percentages and numeric limits", async () => {
  const { validateOffer, posterForOffer } =
    await import("../src/pages/owner/marketing/marketingUtils");
  const { blank } = await import("../src/pages/owner/marketing/marketingData");
  const valid = {
    ...blank,
    title: "Glow",
    code: "GLOW20",
    value: "20",
    start: "2027-01-01T09:00",
    end: "2027-01-02T09:00",
  };
  assert.equal(validateOffer(valid), null);
  assert.match(validateOffer({ ...valid, title: " " })!, /title/i);
  assert.match(validateOffer({ ...valid, code: "" })!, /code/i);
  assert.match(validateOffer({ ...valid, code: "bad code" })!, /code/i);
  assert.match(validateOffer({ ...valid, end: valid.start })!, /after/i);
  assert.match(validateOffer({ ...valid, value: "101" })!, /100/);
  assert.match(validateOffer({ ...valid, value: "-1" })!, /100/);
  assert.match(validateOffer({ ...valid, limit: "1.5" })!, /whole number/i);
  const poster = posterForOffer(
    {
      shop: "Shop",
      title: "Old",
      discount: "",
      service: "",
      validity: "",
      phone: "",
      link: "",
      logo: "",
      align: "center",
      qr: true,
      template: "Classic",
    },
    valid,
  );
  assert.equal(poster.title, "Glow");
  assert.equal(poster.discount, "20% OFF");
  assert.equal(poster.validity, "2027-01-02");
});
