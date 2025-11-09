// src/helpers/normalizeBook.js

// Chuyển mọi kiểu dữ liệu gallery_urls thành mảng URL chuẩn
function toUrlArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export default function normalizeBook(raw) {
  if (!raw) return null;
  // Tính giá hiệu lực (ưu tiên giá sale)
  const activeSale = raw.active_flashsale;
  let effective_price = raw.price;
  if (activeSale && activeSale.sale_price != null) {
      effective_price = activeSale.sale_price;
  }

  return {
    id: raw.id,
    title: raw.title,
    author: raw.author,
    image_url: raw.image_url, // ảnh chính từ DB
    gallery_urls: toUrlArray(raw.gallery_urls), // mảng ảnh gallery

    price: raw.price != null ? Number(raw.price) : null,

    stock: raw.stock ?? null,
    sold_count: raw.sold_count ?? 0,
    rating_avg: raw.rating_avg != null ? Number(raw.rating_avg) : 0,
    rating_count: raw.rating_count != null ? Number(raw.rating_count) : 0,
    active_flashsale: raw.active_flashsale ?? null, 
    effective_price: effective_price != null ? Number(effective_price) : Number(raw.price),
  };
}

//code goc
// // src/helpers/normalizeBook.js
// export default function normalizeBook(raw) {
//   if (!raw) return raw;
//   return {
//     id: raw.id || raw.book_id,
//     title: raw.title,
//     author: raw.author,
//     price: raw.price,
//     discountPrice: raw.discount_price,
//     imageUrl: raw.image_url, // 👈 chuyển snake_case -> camelCase
//     stock: raw.stock,
//   };
// }
