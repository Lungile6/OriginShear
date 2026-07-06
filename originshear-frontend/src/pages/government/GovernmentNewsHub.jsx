import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { useNewsFeed } from "../../hooks/useNewsFeed";
import PageHeader from "../../components/ui/PageHeader";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import Card from "../../components/ui/Card";
import { LotCardSkeleton } from "../../components/ui/Skeleton";

export default function GovernmentNewsHub() {
  const location = useLocation();
  const isGovernment = location.pathname.startsWith("/government");
  const isBuyer = location.pathname.startsWith("/buyer");
  const isPublicNews = location.pathname === "/news";
  const role = isPublicNews ? "PUBLIC" : isGovernment ? "GOVERNMENT" : isBuyer ? "BUYER" : "FARMER";

  const { news, isLoading, error } = useNewsFeed();
  const [lang, setLang] = useState("EN");
  const [expandedId, setExpandedId] = useState(null);

  return (
    <AppLayout role={role} title="ORIGINSHEAR">
      <div className="px-margin-mobile pt-stack-lg pb-28 max-w-[1024px] mx-auto">
        <PageHeader
          title="Ministry of Agriculture · Lesotho"
          subtitle="Wool & Mohair Industry Updates (Lintlafatso tsa Indasteri)"
          action={
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex bg-surface-container rounded-full p-0.5">
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
              {isGovernment && (
                <Link to="/government/news/compose">
                  <Button fullWidth={false} size="sm" icon={<Icon name="edit_note" className="!text-base" />}>
                    Publish
                  </Button>
                </Link>
              )}
            </div>
          }
        />

        <Card className="mb-stack-lg bg-secondary-container/40 border-secondary/20 flex gap-3">
          <Icon name="campaign" className="text-secondary shrink-0 mt-0.5" />
          <p className="text-body-sm text-on-secondary-container">
            {isGovernment
              ? "Manage and publish official bulletins for producers, buyers, and sector stakeholders."
              : "Official bulletins for producers, buyers, and wool/mohair sector stakeholders (Litsebiso tsa semmuso bakeng sa bahlahisi, bareki, le bohle ba amehang indastering)."}
          </p>
        </Card>

        <div className="space-y-stack-md">
          {isLoading && (
            <>
              <LotCardSkeleton />
              <LotCardSkeleton />
            </>
          )}
          {!isLoading && news.length === 0 && (
            <p className="text-body-sm text-on-surface-variant">No bulletins published yet.</p>
          )}
          {error && <p className="text-body-sm text-error">{error}</p>}
          {news.map((item) => (
            <Card key={item.id}>
              <div className="flex justify-between items-start mb-2">
                <span className={`rounded-full px-3 py-1 text-label-sm font-bold ${item.tagColor}`}>
                  {item.tag}
                </span>
                <span className="text-label-sm text-on-surface-variant shrink-0 ml-2">{item.date}</span>
              </div>
              <h3 className="font-bold text-body-lg mb-1">{item.title}</h3>
              {(expandedId === item.id ? item.body : item.body?.slice(0, 120)) && (
                <p className="text-body-sm text-on-surface-variant mb-2">
                  {expandedId === item.id ? item.body : `${item.body?.slice(0, 120)}${item.body?.length > 120 ? "…" : ""}`}
                </p>
              )}
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="text-primary font-semibold text-body-sm inline-flex items-center gap-1"
              >
                {expandedId === item.id ? "Show less" : item.cta || "Read Details"}
                <Icon name="arrow_forward" className="!text-base" />
              </button>
            </Card>
          ))}
        </div>

        <p className="text-center text-body-sm text-on-surface-variant mt-6">
          End of recent updates (Qetello ea litaba)
        </p>
      </div>

      {isGovernment && (
        <Link
          to="/government/news/compose"
          className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-xl bg-primary-container text-on-primary-container shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          aria-label="Compose announcement"
        >
          <Icon name="add" className="!text-3xl" />
        </Link>
      )}
    </AppLayout>
  );
}
