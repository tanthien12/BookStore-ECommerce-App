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

  return {
    id: raw.id,
    title: raw.title,
    author: raw.author,
    image_url: raw.image_url, // ảnh chính từ DB
    gallery_urls: toUrlArray(raw.gallery_urls), // mảng ảnh gallery

    price: raw.price != null ? Number(raw.price) : null,
    sale_price: raw.sale_price != null ? Number(raw.sale_price) : null,
    sale_start: raw.sale_start,
    sale_end: raw.sale_end,
    is_flash_sale: !!raw.is_flash_sale,

    stock: raw.stock ?? null,
    rating_avg: raw.rating_avg != null ? Number(raw.rating_avg) : 0,
    rating_count: raw.rating_count != null ? Number(raw.rating_count) : 0,
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
