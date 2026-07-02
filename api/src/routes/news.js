const express = require("express");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// In-memory bulletin store for now (replace with DB/contract-backed source later).
const bulletinStore = [
  {
    id: "seed-1",
    tag: "Price Alert (Tsebiso ea Theko)",
    tagColor: "bg-role-government/15 text-role-government",
    date: "Oct 24, 2025",
    title: "Mohair Grade A floor price set at cUSD 18.50/kg",
    body: "",
    cta: "Read Details (Bala Lintlafatso)",
    createdAt: new Date("2025-10-24T08:00:00Z").toISOString(),
  },
  {
    id: "seed-2",
    tag: "Market Notice (Tsebiso ea Maraka)",
    tagColor: "bg-secondary-container text-on-secondary-container",
    date: "Oct 22, 2025",
    title: "Quthing collection point open Tuesdays and Thursdays",
    body: "Operations resume at standard hours (08:00-16:30) for shearing season preparation.",
    cta: "View Schedule (Sheba Lenane)",
    createdAt: new Date("2025-10-22T08:00:00Z").toISOString(),
  },
  {
    id: "seed-3",
    tag: "Regulation (Melao)",
    tagColor: "bg-primary-container text-on-primary-container",
    date: "Oct 20, 2025",
    title: "New digital PoO requirements at Maseru Bridge",
    body: "",
    cta: "View Compliance Guide (Bala Tataiso)",
    createdAt: new Date("2025-10-20T08:00:00Z").toISOString(),
  },
];

/**
 * GET /api/news
 * Returns latest bulletins (newest first).
 */
router.get("/", (req, res) => {
  const sorted = [...bulletinStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ items: sorted });
});

/**
 * POST /api/news
 * Publish a new government bulletin.
 */
router.post(
  "/",
  [
    body("title").isString().trim().isLength({ min: 3 }).withMessage("Title is required"),
    body("tag").isString().trim().isLength({ min: 3 }).withMessage("Tag is required"),
    body("body").optional().isString(),
    body("cta").optional().isString(),
    body("tagColor").optional().isString(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const now = new Date();
    const payload = req.body;
    const entry = {
      id: `news-${now.getTime()}`,
      tag: payload.tag,
      tagColor: payload.tagColor || "bg-secondary-container text-on-secondary-container",
      date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      title: payload.title,
      body: payload.body || "",
      cta: payload.cta || "Read Details (Bala Lintlafatso)",
      createdAt: now.toISOString(),
    };

    bulletinStore.unshift(entry);
    res.status(201).json({ item: entry });
  }
);

module.exports = router;
