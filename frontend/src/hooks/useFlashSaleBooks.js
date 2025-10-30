// src/hooks/useFlashSaleBooks.js
import { useEffect, useState } from "react";
import summaryApi from "../common";
import normalizeBook from "../helpers/normalizeBook";

export default function useFlashSaleBooks(limit = 8) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        // tạm dùng sort=price_desc vì BE bạn có
        const res = await fetch(
          `${summaryApi.url("/books")}?sort=price_desc&limit=${limit}`
        );
        let json = null;
        try {
          json = await res.json();
        } catch (e) {
          console.error("Parse JSON flash sale lỗi:", e);
        }

        if (!active) return;

        let list = [];
        if (Array.isArray(json)) list = json;
        else if (json && Array.isArray(json.data)) list = json.data;
        else if (json && Array.isArray(json.items)) list = json.items;

        const normalized = list.map((b) => (normalizeBook ? normalizeBook(b) : b));
        setBooks(normalized);
      } catch (err) {
        console.error("Flash sale fetch error:", err);
        if (active) setBooks([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [limit]);

  return { books, loading };
}
