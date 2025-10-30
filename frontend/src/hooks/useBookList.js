// src/hooks/useBookList.js
import { useEffect, useState } from "react";
import summaryApi from "../common";
import normalizeBook from "../helpers/normalizeBook"; 

const ALLOWED_SORTS = [
  "id_desc",
  "price_asc",
  "price_desc",
  "title_asc",
  "newest",
];

export default function useBookList(options = {}) {
  const [books, setBooks] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchBooks() {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        let sort = options.sort;
        if (sort && !ALLOWED_SORTS.includes(sort)) {
          sort = "newest";
        }
        if (sort) params.set("sort", sort);
        if (options.limit) params.set("limit", options.limit);

        const url = params.toString()
          ? `${summaryApi.url("/books")}?${params.toString()}`
          : summaryApi.url("/books");

        const res = await fetch(url);
        let json = null;
        try {
          json = await res.json();
        } catch (err) {
          console.error("Parse JSON books lỗi:", err);
        }

        if (!active) return;

        let list = [];
        let metaObj = {};

        // BE trả mảng luôn
        if (Array.isArray(json)) {
          list = json;
        }
        // BE kiểu { success, data: [...] }
        else if (json && Array.isArray(json.data)) {
          list = json.data;
          metaObj = json.meta || {};
        }
        // BE kiểu { items: [...], total: ... }
        else if (json && Array.isArray(json.items)) {
          list = json.items;
          metaObj = { total: json.total ?? json.items.length };
        }

        // ✅ normalize trước khi set (để ProductCard đỡ lỗi field)
        const normalized = list.map((b) => (normalizeBook ? normalizeBook(b) : b));

        setBooks(normalized);
        setMeta(metaObj);
      } catch (err) {
        console.error("Fetch books failed:", err);
        if (active) {
          setBooks([]);
          setMeta({});
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchBooks();

    return () => {
      active = false;
    };
  }, [options.sort, options.limit]);

  return { books, meta, loading };
}
