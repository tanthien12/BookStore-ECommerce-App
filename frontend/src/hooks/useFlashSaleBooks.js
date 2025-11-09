// src/hooks/useFlashSaleBooks.js
import { useEffect, useState } from "react";
import summaryApi from "../common";


export default function useFlashSaleBooks(limit = 10) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // Sửa endpoint
        const res = await fetch(summaryApi.url(`${summaryApi.flashsale.getActive}?limit=${limit}`));
        const json = await res.json();
        if (!alive) return;
        
        const list = Array.isArray(json?.data) ? json.data : [];
        
        // "Gói" dữ liệu phẳng từ API thành cấu trúc lồng nhau
        // để component (ProductCard, FlashSale) có thể đọc
        const normalizedList = list.map(rawItem => {
            return {
                // Các trường book cơ bản
                id: rawItem.id,
                title: rawItem.title,
                author: rawItem.author,
                image_url: rawItem.image_url,
                price: Number(rawItem.price), // Giá gốc
                rating_avg: Number(rawItem.rating_avg ?? 0),
                rating_count: Number(rawItem.rating_count ?? 0),
                sold_count: rawItem.sold_count ?? 0, // Tổng đã bán

                // Lồng thông tin sale vào
                active_flashsale: {
                    item_id: rawItem.flashsale_item_id,
                    sale_price: Number(rawItem.sale_price),
                    sale_quantity: rawItem.sale_quantity,
                    sold_quantity: rawItem.sold_quantity,
                    sale_end: rawItem.sale_end
                },
            };
        });

        setBooks(normalizedList);
        
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