import { useState } from "react";
import AppLayout from "../../layouts/AppLayout";

const SEED_NEWS = [
  {
    id: 1,
    tag: "Price Alert (Tsebiso ea Theko)",
    tagColor: "bg-role-government/15 text-role-government",
    date: "Oct 24, 2025",
    title: "Mohair Grade A floor price set at cUSD 18.50/kg",
    cta: "Read Details (Bala Lintlafatso)",
  },
  {
    id: 2,
    tag: "Market Notice (Tsebiso ea Maraka)",
    tagColor: "bg-secondary-container text-on-secondary-container",
    date: "Oct 22, 2025",
    title: "Quthing collection point open Tuesdays and Thursdays",
    body: "Operations resume at standard hours (08:00-16:30) for shearing season preparation.",
    cta: "View Schedule (Sheba Lenane)",
  },
  {
    id: 3,
    tag: "Regulation (Melao)",
    tagColor: "bg-primary-container text-on-primary-container",
    date: "Oct 20, 2025",
    title: "New digital PoO requirements at Maseru Bridge",
    cta: "View Compliance Guide (Bala Tataiso)",
  },
];

export default function GovernmentNewsHub() {
  const [news, setNews] = useState(SEED_NEWS);
  const [lang, setLang] = useState("EN");

  return (
    <AppLayout role="GOVERNMENT" title="ORIGINSHEAR">
      <div className="px-4 pt-2 pb-8">
        <div className="flex justify-between items-start mb-1">
          <h1 className="text-headline-md font-bold">Ministry of Agriculture · Lesotho</h1>
          <div className="flex bg-surface-container rounded-full p-0.5 shrink-0">
            <button
              onClick={() => setLang("EN")}
              className={`px-2.5 py-1 rounded-full text-label-sm font-bold ${lang === "EN" ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("SS")}
              className={`px-2.5 py-1 rounded-full text-label-sm font-bold ${lang === "SS" ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}
            >
              SS
            </button>
          </div>
        </div>
        <p className="text-body-sm text-on-surface-variant mb-4">
          Wool &amp; Mohair Industry Updates (Lintlafatso tsa Indasteri)
        </p>

        <div className="bg-secondary-container/40 border border-secondary/20 rounded-lg p-4 flex gap-3 mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-secondary shrink-0 mt-0.5">
            <path d="M3 11l18-7-7 18-2-8-9-3Z" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <p className="text-body-sm text-on-secondary-container">
            Official bulletins for registered wool and mohair producers (Litsebiso tsa semmuso
            bakeng sa bahlahisi ba ngolisitsoeng).
          </p>
        </div>

        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-4">
              <div className="flex justify-between items-start mb-2">
                <span className={`rounded-full px-3 py-1 text-label-sm font-bold ${item.tagColor}`}>
                  {item.tag}
                </span>
                <span className="text-label-sm text-on-surface-variant shrink-0 ml-2">{item.date}</span>
              </div>
              <h3 className="font-bold text-body-lg mb-1">{item.title}</h3>
              {item.body && <p className="text-body-sm text-on-surface-variant mb-2">{item.body}</p>}
              <button className="text-primary font-semibold text-body-sm inline-flex items-center gap-1">
                {item.cta}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-body-sm text-on-surface-variant mt-6 mb-6">
          End of recent updates (Qetello ea litaba)
        </p>
      </div>

      <ComposeFab onPublish={(entry) => setNews((prev) => [entry, ...prev])} />
    </AppLayout>
  );
}

function ComposeFab({ onPublish }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("Market Notice (Tsebiso ea Maraka)");
  const [body, setBody] = useState("");

  function handlePublish() {
    if (!title) return;
    onPublish({
      id: crypto.randomUUID(),
      tag,
      tagColor: "bg-secondary-container text-on-secondary-container",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      title,
      body,
      cta: "Read Details (Bala Lintlafatso)",
    });
    setTitle("");
    setBody("");
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center"
        aria-label="Compose announcement"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-7 w-7">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
          <div className="bg-surface w-full max-w-[480px] rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto">
            <h2 className="text-headline-sm font-bold mb-4">Compose Announcement</h2>

            <label className="block text-body-sm font-semibold mb-2">Category</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full h-12 rounded-lg border border-outline-variant bg-surface-container px-4 mb-4 text-body-sm appearance-none"
            >
              <option>Price Alert (Tsebiso ea Theko)</option>
              <option>Market Notice (Tsebiso ea Maraka)</option>
              <option>Regulation (Melao)</option>
            </select>

            <label className="block text-body-sm font-semibold mb-2">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 rounded-lg border border-outline-variant bg-surface-container px-4 mb-4 text-body-sm"
              placeholder="Headline for the bulletin"
            />

            <label className="block text-body-sm font-semibold mb-2">Body (optional)</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-outline-variant bg-surface-container px-4 py-3 mb-5 text-body-sm"
              placeholder="Additional detail shown under the headline"
            />

            <button
              onClick={handlePublish}
              className="w-full h-14 rounded-lg bg-primary text-on-primary font-semibold mb-2"
            >
              Publish Bulletin
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-full h-12 rounded-lg border border-outline-variant font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
