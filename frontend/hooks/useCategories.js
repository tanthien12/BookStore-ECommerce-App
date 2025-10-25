import { useEffect, useState } from "react";
import summaryApi from "../common";

export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingCategories(true);
        setCategoriesError("");
        const response = await fetch(summaryApi.url(summaryApi.category.get), {
          headers: { "Content-Type": "application/json" }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || "Không thể tải danh mục");
        if (isMounted) setCategories(Array.isArray(data?.data || data) ? (data.data || data) : []);
      } catch (error) {
        if (isMounted) setCategoriesError(error.message || "Lỗi tải danh mục");
      } finally {
        if (isMounted) setLoadingCategories(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  return { categories, loadingCategories, categoriesError };
}
