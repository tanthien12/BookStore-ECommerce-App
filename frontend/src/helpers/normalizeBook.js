// src/utils/normalizeBook.js
export default function normalizeBook(raw) {
  if (!raw) return raw;

  const id = raw.id || raw.book_id || raw._id || raw.slug;
  const price = raw.price ?? null;
  // Ưu tiên sale_price; nếu không có thì discount_price; cuối cùng là null
  const salePrice =
    raw.sale_price ??
    raw.price_sale ??        // đề phòng biến thể tên
    raw.discount_price ??
    null;

  return {
    id,
    title: raw.title,
    author: raw.author,
    price,                   // giá gốc
    sale_price: salePrice,   // giữ nguyên tên sale_price
    discount_price: salePrice, // alias để các component cũ dùng được
    imageUrl: raw.image_url || raw.imageUrl, // 👈 snake_case -> camelCase
    image_url: raw.image_url,                // vẫn giữ để tương thích
    stock: raw.stock,
    rating_avg: raw.rating_avg,
    rating_count: raw.rating_count,
    // thêm các field phổ biến khác nếu có
    publisher: raw.publisher,
    published_year: raw.published_year,
    language: raw.language,
    format: raw.format,
    description: raw.description,
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
