import { useCallback, useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export function useNewsFeed() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/news`);
      if (!res.ok) throw new Error("Failed to load news");
      const data = await res.json();
      setNews(data.items || []);
    } catch (err) {
      setError(err?.message || "Failed to load news");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const publishNews = useCallback(async (payload) => {
    const res = await fetch(`${API_BASE_URL}/api/news`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to publish bulletin");
    }
    const data = await res.json();
    setNews((prev) => [data.item, ...prev]);
    return data.item;
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { news, isLoading, error, fetchNews, publishNews };
}
