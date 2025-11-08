// src/hooks/useFlashSaleBooks.js
import { useEffect, useState } from "react";
import summaryApi from "../common";
import normalizeBook from "../helpers/normalizeBook";

export default function useFlashSaleBooks(limit = 10) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(summaryApi.url(`/books/flash-sale?limit=${limit}`));
        const json = await res.json();
        if (!alive) return;
        const list = Array.isArray(json?.data) ? json.data : [];
        setBooks(list.map(normalizeBook));
      } catch (err) {
        if (alive) setBooks([]);
        console.error("[FlashSale] fetch error:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [limit]);

  return { books, loading };
}
