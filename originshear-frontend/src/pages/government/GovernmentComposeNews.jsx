import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { useNewsFeed } from "../../hooks/useNewsFeed";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Card from "../../components/ui/Card";
import { FormField, inputClassName, selectClassName, textareaClassName } from "../../components/ui/FormField";

const BULLETIN_TYPES = [
  { value: 0, label: "Price Alert (Tsebiso ea Theko)" },
  { value: 1, label: "Market Notice (Tsebiso ea Maraka)" },
  { value: 2, label: "Regulation (Melao)" },
  { value: 3, label: "General (Kakaretso)" },
];

export default function GovernmentComposeNews() {
  const navigate = useNavigate();
  const { publishNews } = useNewsFeed();

  const [bulletinType, setBulletinType] = useState(1);
  const [title, setTitle] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [bodySt, setBodySt] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !bodyEn.trim()) return;

    setPublishing(true);
    setError("");
    setSuccess(false);

    const body = bodySt.trim()
      ? `${bodyEn.trim()}\n\n---\n\n${bodySt.trim()}`
      : bodyEn.trim();

    try {
      await publishNews({
        bulletinType,
        title: title.trim(),
        body,
        metadataURI: urgent ? "urgent:true" : "",
      });
      setSuccess(true);
      setTimeout(() => navigate("/government/news"), 1200);
    } catch (err) {
      setError(err?.message || "Failed to publish bulletin");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <AppLayout role="GOVERNMENT" title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-28 max-w-[1024px] mx-auto">
        <Link
          to="/government/news"
          className="text-primary text-label-sm font-bold mb-3 inline-flex items-center gap-1"
        >
          <Icon name="arrow_back" className="!text-base" />
          Back to News Hub
        </Link>

        <PageHeader
          title="Compose Announcement"
          subtitle="Publish official bulletins visible to wool and mohair farmers and buyers (News Editor)"
        />

        {success && (
          <Card className="mb-stack-md bg-primary-container/30 border-primary/30">
            <p className="text-body-sm text-on-primary-container font-semibold flex items-center gap-2">
              <Icon name="check_circle" />
              Bulletin published successfully. Redirecting…
            </p>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-stack-lg">
          <FormField label="Category (Sehlopha)">
            <select
              value={bulletinType}
              onChange={(e) => setBulletinType(Number(e.target.value))}
              className={selectClassName}
              disabled={publishing}
            >
              {BULLETIN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Headline (Sehlooho)">
            <div className="flex justify-end mb-1">
              <span className="text-label-sm text-on-surface-variant">{title.length} / 80</span>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 80))}
              maxLength={80}
              required
              disabled={publishing}
              placeholder="Enter a descriptive headline…"
              className={inputClassName}
            />
          </FormField>

          {urgent && (
            <div className="p-4 bg-tertiary-fixed text-on-tertiary-fixed rounded-xl flex items-center gap-3 border border-tertiary">
              <Icon name="warning" filled />
              <div>
                <p className="font-bold text-label-lg">URGENT PRIORITY / TLHOKOMELISO EA SEBELE</p>
                <p className="text-label-sm">This post will be highlighted for all users.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
            <FormField label="Body Text (English)">
              <textarea
                value={bodyEn}
                onChange={(e) => setBodyEn(e.target.value)}
                rows={8}
                required
                disabled={publishing}
                placeholder="Enter the news content in English…"
                className={textareaClassName}
              />
            </FormField>
            <FormField label="Body Text (Sesotho)">
              <textarea
                value={bodySt}
                onChange={(e) => setBodySt(e.target.value)}
                rows={8}
                disabled={publishing}
                placeholder="Ngola litaba ka Sesotho…"
                className={textareaClassName}
              />
            </FormField>
          </div>

          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
                <Icon name="priority_high" />
              </div>
              <div>
                <p className="font-bold text-label-lg">Urgent Priority</p>
                <p className="text-label-sm text-on-surface-variant">Tlhokomeliso ea Sebele</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                disabled={publishing}
              />
              <div className="w-11 h-6 bg-surface-variant rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </Card>

          {error && <p className="text-body-sm text-error">{error}</p>}

          <Button type="submit" size="lg" loading={publishing} disabled={publishing || !title.trim() || !bodyEn.trim()} icon={<Icon name="send" />}>
            {publishing ? "Publishing on-chain…" : "Publish to Wool & Mohair Farmers (Hatisa ho Bohle)"}
          </Button>
          <p className="text-center text-label-sm text-on-surface-variant">
            Blockchain signature is applied automatically upon publication to ensure data integrity.
          </p>
        </form>
      </div>
    </AppLayout>
  );
}
