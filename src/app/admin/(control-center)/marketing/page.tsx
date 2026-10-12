"use client";
import { useEffect, useState } from "react";
import {
  campaignSchema,
  validCampaignDestination,
  type Campaign,
} from "@/lib/campaigns";
import styles from "./marketing.module.css";
type Form = ReturnType<typeof campaignSchema.parse>;
type Row = Omit<Campaign, "status"> & {
  status: string;
  savedStatus: Form["status"];
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  conversionRate: number;
};
type Product = {
  id: string;
  name: string;
  slug: string;
  collection: string;
  category: string;
  department: string;
};
const steps = [
  "Basic Information",
  "Creative",
  "Destination",
  "Placement",
  "Schedule",
  "Preview",
  "Publish",
];
const placements = {
  homeHero: "Homepage Hero Banner",
  homeCollection: "Homepage Collection Section",
  bags: "Bags Page",
  luggage: "Luggage Page",
  editorial: "Editorial / Blog Page",
} as const;
const blank: Form = {
  name: "",
  description: "",
  type: "Seasonal Campaign",
  banner: "",
  mobileBanner: "",
  headline: "",
  subheading: "",
  cta: "Shop Collection",
  destinationType: "Collection",
  destination: "",
  placements: [],
  startAt: "",
  endAt: "",
  status: "Draft",
};
function localTime(value: string) {
  return value
    ? new Date(Date.parse(value) + 19800000).toISOString().slice(0, 16)
    : "";
}
function dateLabel(value: string) {
  return value
    ? new Date(value).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not set";
}
export default function MarketingPage() {
  const [rows, setRows] = useState<Row[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("All"),
    [search, setSearch] = useState("");
  const [form, setForm] = useState<Form | null>(null),
    [editing, setEditing] = useState<string>(),
    [step, setStep] = useState(0),
    [saving, setSaving] = useState(false),
    [uploading, setUploading] = useState(""),
    [mobile, setMobile] = useState(false),
    [products, setProducts] = useState<Product[]>([]),
    [stories, setStories] = useState<
      { id: string; slug: string; title: string }[]
    >([]);
  async function refresh() {
    try {
      const response = await fetch("/api/admin/marketing", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Cannot load campaigns.");
      setRows(result.campaigns);
    } catch (e) {
      if (e instanceof Error && (e.name === "AbortError" || e.message.toLowerCase().includes("abort"))) {
        return;
      }
      setError(e instanceof Error ? e.message : "Cannot load campaigns.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/v1/stories?status=published", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => setStories(data.data?.stories || []))
      .catch(() => {});
    fetch("/api/admin/marketing/destinations", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  function change<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }
  async function upload(
    file: File | undefined,
    key: "banner" | "mobileBanner",
  ) {
    if (!file) return;
    setUploading(key);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed.");
      change(key, result.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading("");
    }
  }
  async function persist(data: Form, id = editing) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/admin/marketing", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ...(id ? { id } : {}) }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Cannot save campaign.");
      setForm(null);
      setEditing(undefined);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot save campaign.");
    } finally {
      setSaving(false);
    }
  }
  function open(row?: Row) {
    setEditing(row?.id);
    setForm(
      row ? { ...row, status: row.savedStatus } : { ...blank, placements: [] },
    );
    setStep(0);
    setError("");
  }
  const collections = [
    ...new Set(products.map((p) => p.collection).filter(Boolean)),
  ].sort();
  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ].sort();
  const shown = rows.filter(
    (row) =>
      (filter === "All" || row.status === filter) &&
      `${row.name} ${row.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const checks = form
    ? [
        { label: "Basic information completed", ok: !!form.name.trim() },
        {
          label: "Desktop banner and headline added",
          ok: !!form.banner && !!form.headline.trim(),
        },
        {
          label: "Destination selected",
          ok: validCampaignDestination(form.destination),
        },
        { label: "Placement configured", ok: form.placements.length > 0 },
        {
          label: "Schedule set",
          ok:
            !!form.startAt &&
            !!form.endAt &&
            Date.parse(form.endAt) > Date.parse(form.startAt),
        },
      ]
    : [];
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Marketing &amp; Editorial Campaigns</h1>
          <p>
            Curate storefront banners, schedule campaigns and track real
            performance.
          </p>
        </div>
        {!form && <button onClick={() => open()}>+ New Campaign</button>}
      </header>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {!form ? (
        <>
          <div className={styles.toolbar}>
            <div className={styles.filters}>
              {[
                "All",
                "Draft",
                "Active",
                "Scheduled",
                "Paused",
                "Completed",
                "Archived",
              ].map((status) => (
                <button
                  key={status}
                  aria-pressed={filter === status}
                  onClick={() => setFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
            <input
              aria-label="Search campaigns"
              placeholder="Search campaigns…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <p>Loading campaigns…</p>
          ) : !shown.length ? (
            <div className={styles.empty}>
              {rows.length
                ? "No campaigns match your filters."
                : "No campaigns yet. Create your first campaign to add a live storefront banner."}
            </div>
          ) : (
            <div className={styles.cards}>
              {shown.map((row) => (
                <article key={row.id} className={styles.card}>
                  <div className={styles.cover}>
                    {row.banner ? (
                      <img src={row.banner} alt={row.headline || row.name} />
                    ) : (
                      <span>No banner uploaded</span>
                    )}
                    <strong className={styles.badge}>{row.status}</strong>
                  </div>
                  <div className={styles.cardBody}>
                    <h2>{row.name}</h2>
                    <p>{row.type}</p>
                    <small>
                      {dateLabel(row.startAt)} — {dateLabel(row.endAt)}
                    </small>
                    <div className={styles.metrics}>
                      {[
                        [
                          "Impressions",
                          row.impressions.toLocaleString("en-IN"),
                        ],
                        ["Clicks", row.clicks.toLocaleString("en-IN")],
                        ["Sales", row.conversions],
                        ["CTR", `${row.ctr.toFixed(1)}%`],
                        ["Conversion", `${row.conversionRate.toFixed(1)}%`],
                        ["Revenue", `₹${row.revenue.toLocaleString("en-IN")}`],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <span>{label}</span>
                          <strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                    <div className={styles.actions}>
                      <button onClick={() => open(row)}>Edit / Preview</button>
                      {["Active", "Scheduled"].includes(row.status) && (
                        <button
                          disabled={saving}
                          onClick={() =>
                            persist({ ...row, status: "Paused" }, row.id)
                          }
                        >
                          Pause
                        </button>
                      )}
                      {row.status === "Paused" && (
                        <button
                          disabled={saving}
                          onClick={() =>
                            persist({ ...row, status: "Active" }, row.id)
                          }
                        >
                          Resume
                        </button>
                      )}
                      {row.status !== "Archived" && (
                        <button
                          disabled={saving}
                          onClick={() =>
                            persist({ ...row, status: "Archived" }, row.id)
                          }
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <p className={styles.help}>
            Views and clicks are counted once per visitor per day. Sales and
            revenue use paid orders attributed to a campaign click within 7
            days.
          </p>
        </>
      ) : (
        <>
          <div className={styles.editorHeading}>
            <h2>{editing ? "Edit Campaign" : "Create New Campaign"}</h2>
            <button
              onClick={() => {
                setForm(null);
                setError("");
              }}
            >
              Back to campaigns
            </button>
          </div>
          <div className={styles.editor}>
            <nav aria-label="Campaign steps">
              {steps.map((label, i) => (
                <button
                  key={label}
                  aria-current={step === i ? "step" : undefined}
                  onClick={() => setStep(i)}
                >
                  <span>{i + 1}</span>
                  {label}
                </button>
              ))}
            </nav>
            <section className={styles.panel}>
              <h2>{steps[step]}</h2>
              {step === 0 && (
                <div className={styles.fields}>
                  <label>
                    Campaign Name *
                    <input
                      maxLength={120}
                      value={form.name}
                      onChange={(e) => change("name", e.target.value)}
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      maxLength={2000}
                      value={form.description}
                      onChange={(e) => change("description", e.target.value)}
                    />
                  </label>
                  <fieldset>
                    <legend>Campaign Type *</legend>
                    {[
                      "Seasonal Campaign",
                      "Collection Launch",
                      "Promotional Campaign",
                      "Editorial / Story",
                    ].map((type) => (
                      <label className={styles.choice} key={type}>
                        <input
                          type="radio"
                          name="campaign-type"
                          checked={form.type === type}
                          onChange={() => change("type", type as Form["type"])}
                        />
                        {type}
                      </label>
                    ))}
                  </fieldset>
                </div>
              )}
              {step === 1 && (
                <>
                  <div className={styles.twoColumns}>
                    {(["banner", "mobileBanner"] as const).map((key) => (
                      <div key={key}>
                        <h3>
                          {key === "banner"
                            ? "Desktop Banner *"
                            : "Mobile Banner (optional)"}
                        </h3>
                        <div className={styles.upload}>
                          {form[key] ? (
                            <img
                              src={form[key]}
                              alt={
                                key === "banner"
                                  ? "Desktop banner preview"
                                  : "Mobile banner preview"
                              }
                            />
                          ) : (
                            <p>Upload JPG, PNG or WebP • Max 5 MB</p>
                          )}
                          <label className={styles.uploadButton}>
                            {uploading === key
                              ? "Uploading…"
                              : form[key]
                                ? "Change image"
                                : "Upload image"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={!!uploading}
                              onChange={(e) => {
                                void upload(e.target.files?.[0], key);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          {form[key] && (
                            <button onClick={() => change(key, "")}>
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.fields}>
                    <label>
                      Headline *
                      <input
                        maxLength={160}
                        value={form.headline}
                        onChange={(e) => change("headline", e.target.value)}
                      />
                    </label>
                    <label>
                      Subheading
                      <input
                        maxLength={300}
                        value={form.subheading}
                        onChange={(e) => change("subheading", e.target.value)}
                      />
                    </label>
                    <label>
                      Call to Action (CTA)
                      <input
                        maxLength={60}
                        value={form.cta}
                        onChange={(e) => change("cta", e.target.value)}
                      />
                    </label>
                  </div>
                </>
              )}
              {step === 2 && (
                <div className={styles.fields}>
                  <fieldset>
                    <legend>Destination Type</legend>
                    {[
                      "Product",
                      "Collection",
                      "Category",
                      "Editorial",
                      "Custom URL",
                    ].map((type) => (
                      <label className={styles.choice} key={type}>
                        <input
                          type="radio"
                          name="destination-type"
                          checked={form.destinationType === type}
                          onChange={() => {
                            change(
                              "destinationType",
                              type as Form["destinationType"],
                            );
                            change("destination", "");
                          }}
                        />
                        {type === "Editorial" ? "Blog / Editorial Page" : type}
                      </label>
                    ))}
                  </fieldset>
                  {form.destinationType === "Product" ? (
                    <label>
                      Select Product *
                      <select
                        value={form.destination}
                        onChange={(e) => change("destination", e.target.value)}
                      >
                        <option value="">Choose a published product</option>
                        {products.map((p) => (
                          <option key={p.id} value={`/products/${p.slug}`}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : form.destinationType === "Collection" ||
                    form.destinationType === "Category" ? (
                    <label>
                      Select {form.destinationType} *
                      <select
                        value={form.destination}
                        onChange={(e) => change("destination", e.target.value)}
                      >
                        <option value="">
                          Choose {form.destinationType.toLowerCase()}
                        </option>
                        {(form.destinationType === "Collection"
                          ? collections
                          : categories
                        ).map((name) => {
                          const product = products.find(
                            (p) =>
                              (form.destinationType === "Collection"
                                ? p.collection
                                : p.category) === name,
                          );
                          return (
                            <option
                              key={name}
                              value={`/${product?.department || "luggage"}?${form.destinationType.toLowerCase()}=${encodeURIComponent(name)}`}
                            >
                              {name}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  ) : form.destinationType === "Editorial" ? (
                    <label>
                      Select Editorial Page *
                      <select
                        value={form.destination}
                        onChange={(e) => change("destination", e.target.value)}
                      >
                        <option value="">Choose a published story</option>
                        <option value="/journal">All stories</option>
                        {stories.map((story) => (
                          <option
                            key={story.id}
                            value={`/journal/${story.slug}`}
                          >
                            {story.title}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label>
                      Custom destination URL *
                      <input
                        placeholder="https://… or /page"
                        value={form.destination}
                        onChange={(e) => change("destination", e.target.value)}
                      />
                    </label>
                  )}
                  {form.destination && (
                    <p className={styles.help}>
                      Destination: <a href={validCampaignDestination(form.destination)?form.destination:undefined} target="_blank" rel="noopener noreferrer">{form.destination}</a>
                    </p>
                  )}
                  {form.destinationType==="Product"&&form.destination&&products.length>0&&!products.some(product=>`/products/${product.slug}`===form.destination)&&<p role="alert" className={styles.error}>This saved product is unavailable on the public website. Publish it in Products or select another destination.</p>}
                </div>
              )}
              {step === 3 && (
                <fieldset>
                  <legend>Display Placement *</legend>
                  {Object.entries(placements).map(([key, label]) => (
                    <label key={key} className={styles.choice}>
                      <input
                        type="checkbox"
                        checked={form.placements.includes(
                          key as Form["placements"][number],
                        )}
                        onChange={(e) =>
                          change(
                            "placements",
                            e.target.checked
                              ? [
                                  ...form.placements,
                                  key as Form["placements"][number],
                                ]
                              : form.placements.filter((p) => p !== key),
                          )
                        }
                      />
                      {label}
                    </label>
                  ))}
                  <p className={styles.help}>
                    You can select multiple placements for this campaign.
                  </p>
                </fieldset>
              )}
              {step === 4 && (
                <>
                  <div className={styles.twoColumns}>
                    {(["startAt", "endAt"] as const).map((key) => (
                      <label key={key}>
                        {key === "startAt"
                          ? "Start Date & Time"
                          : "End Date & Time"}
                        <input
                          type="datetime-local"
                          value={localTime(form[key])}
                          onChange={(e) =>
                            change(
                              key,
                              e.target.value
                                ? new Date(
                                    `${e.target.value}:00+05:30`,
                                  ).toISOString()
                                : "",
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <p className={styles.help}>
                    Timezone: Asia/Kolkata (IST). Scheduled campaigns go live at
                    the start time and automatically complete at the end time.
                  </p>
                </>
              )}
              {step === 5 && (
                <>
                  <div className={styles.filters}>
                    <button
                      aria-pressed={!mobile}
                      onClick={() => setMobile(false)}
                    >
                      Desktop Preview
                    </button>
                    <button
                      aria-pressed={mobile}
                      onClick={() => setMobile(true)}
                    >
                      Mobile Preview
                    </button>
                  </div>
                  <div className={styles.preview} data-mobile={mobile}>
                    {form.banner ? (
                      <>
                        <img
                          src={
                            mobile && form.mobileBanner
                              ? form.mobileBanner
                              : form.banner
                          }
                          alt="Campaign preview"
                        />
                        <div>
                          <h2>{form.headline || "Add your headline"}</h2>
                          <p>{form.subheading}</p>
                          <span>{form.cta || "Discover"}</span>
                        </div>
                      </>
                    ) : (
                      <p>
                        Upload a banner in Creative to preview your campaign.
                      </p>
                    )}
                  </div>
                  <p className={styles.help}>
                    Destination: {form.destination || "Not selected"}
                  </p>
                </>
              )}
              {step === 6 && (
                <>
                  <ul className={styles.checks}>
                    {checks.map((check) => (
                      <li key={check.label} data-complete={check.ok}>
                        {check.ok ? "✓" : "○"} {check.label}
                      </li>
                    ))}
                  </ul>
                  <div className={styles.publish}>
                    <button
                      disabled={
                        saving ||
                        !!uploading ||
                        !checks.slice(0, 4).every((c) => c.ok)
                      }
                      onClick={() =>
                        void persist({
                          ...form,
                          status: "Active",
                          startAt: new Date().toISOString(),
                        })
                      }
                    >
                      Publish Now
                    </button>
                    <button
                      disabled={
                        saving || !!uploading || !checks.every((c) => c.ok)
                      }
                      onClick={() =>
                        void persist({ ...form, status: "Scheduled" })
                      }
                    >
                      Schedule Campaign
                    </button>
                    <button
                      disabled={saving || !!uploading || !form.name.trim()}
                      onClick={() => void persist({ ...form, status: "Draft" })}
                    >
                      Save as Draft
                    </button>
                  </div>
                  <p className={styles.help}>
                    Drafts are private. Published campaigns appear on the
                    selected storefront pages; paused and archived campaigns are
                    hidden.
                  </p>
                </>
              )}
              <footer className={styles.stepActions}>
                {editing&&<button disabled={saving||!!uploading||!form.name.trim()} onClick={()=>void persist(form)}>{saving?"Saving…":"Save Changes"}</button>}
                {step > 0 && (
                  <button onClick={() => setStep(step - 1)}>← Back</button>
                )}
                {step < steps.length - 1 && (
                  <button onClick={() => {if(step===2&&(!validCampaignDestination(form.destination)||(form.destinationType==="Product"&&!products.some(product=>`/products/${product.slug}`===form.destination)))){setError("Select an available destination before continuing.");return;}setError("");setStep(step + 1);}}>Next →</button>
                )}
                {step < 6 && (
                  <button
                    disabled={saving || !!uploading || !form.name.trim()}
                    onClick={() => void persist({ ...form, status: "Draft" })}
                  >
                    Save Draft
                  </button>
                )}
              </footer>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
