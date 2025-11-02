// src/utils/normalizeBook.js
export default function normalizeBook(raw) {
  if (!raw) return raw;
  return {
    id: raw.id || raw.book_id,
    title: raw.title,
    author: raw.author,
    price: raw.price,
    discountPrice: raw.discount_price,
    imageUrl: raw.image_url, // 👈 chuyển snake_case -> camelCase
    stock: raw.stock,
  };
}
