import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

export function useNewsFeed() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await apiClient.get("/api/news");
      setNews(data.items || []);
    } catch (err) {
      setError(err?.message || "Failed to load news");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const publishNews = useCallback(async (payload) => {
    await apiClient.post("/api/news", payload, { auth: true });
    await fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchNews();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchNews]);

  return { news, isLoading, error, fetchNews, publishNews };
}
