// // src/pages/ProductDetail.jsx
// import React, { useEffect, useState } from "react";
// import { useParams, Link, useNavigate } from "react-router-dom";
// import { FiTruck, FiShield, FiHeart, FiShoppingCart } from "react-icons/fi";
// import { toast } from "react-toastify";
// import { useSelector } from "react-redux";
// import summaryApi from "../common";
// import { useCart } from "../context/CartContext";

// // 🟡 dùng helper của bạn
// import { money } from "../helpers/productHelper";

// import { reviewApi } from "../api/reviewApi";
// import ReviewForm from "../components/layout/ReviewForm";
// import ReviewCard from "../components/layout/ReviewCard";
// import RatingStars from "../components/layout/RatingStars";

// // ===== helper nhỏ để format rating an toàn
// function to1(num, fallback = "0.0") {
//   if (typeof num !== "number" || Number.isNaN(num)) return fallback;
//   return num.toFixed(1);
// }

// // ===== các block phụ =====
// const ShippingCard = () => (
//   <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
//     <div className="flex items-center gap-2 text-gray-800">
//       <FiTruck className="h-5 w-5" /> Giao hàng nhanh: Nội thành HCM, Hà Nội
//     </div>
//     <div className="text-sm text-gray-600">
//       Nhận dự kiến: 1-3 ngày · Miễn phí từ 299.000đ
//     </div>
//     <div className="flex gap-3 text-sm">
//       <span className="rounded-lg bg-gray-100 px-2 py-1">ZaloPay</span>
//       <span className="rounded-lg bg-gray-100 px-2 py-1">VNPay</span>
//       <span className="rounded-lg bg-gray-100 px-2 py-1">COD</span>
//     </div>
//   </div>
// );

// const Policies = () => (
//   <ul className="space-y-2 text-sm text-gray-700">
//     <li className="flex items-center gap-2">
//       <FiShield className="h-4 w-4" /> Hàng chính hãng, đổi trả 7 ngày
//     </li>
//     <li className="flex items-center gap-2">
//       <FiShield className="h-4 w-4" /> Bảo mật thanh toán
//     </li>
//     <li className="flex items-center gap-2">
//       <FiShield className="h-4 w-4" /> Hỗ trợ 24/7
//     </li>
//   </ul>
// );

// const InfoTable = ({ book }) => {
//   const rows = [
//     { label: "Tác giả", value: book.author },
//     { label: "Nhà xuất bản", value: book.publisher },
//     { label: "Năm XB", value: book.published_year },
//     { label: "Ngôn ngữ", value: book.language },
//     { label: "Định dạng", value: book.format },
//     { label: "Tồn kho", value: book.stock },
//   ].filter((r) => r.value !== undefined && r.value !== null && r.value !== "");

//   if (!rows.length) return null;

//   return (
//     <div className="rounded-xl border border-gray-200 bg-white">
//       <div className="border-b px-4 py-2 font-semibold">Thông tin chi tiết</div>
//       <dl className="grid grid-cols-1 md:grid-cols-2">
//         {rows.map((row, i) => (
//           <div
//             key={row.label}
//             className={`grid grid-cols-[160px_1fr] gap-4 px-4 py-2 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"
//               }`}
//           >
//             <dt className="text-gray-500">{row.label}</dt>
//             <dd className="text-gray-800">{row.value}</dd>
//           </div>
//         ))}
//       </dl>
//     </div>
//   );
// };

// const Quantity = ({ value, onChange }) => (
//   <div className="inline-flex items-center rounded-xl border border-gray-300 overflow-hidden">
//     <button
//       type="button"
//       className="px-3 py-2 text-lg"
//       onClick={() => onChange(Math.max(1, value - 1))}
//     >
//       -
//     </button>
//     <input
//       className="w-12 text-center outline-none"
//       value={value}
//       onChange={(e) =>
//         onChange(Math.max(1, parseInt(e.target.value || 1, 10)))
//       }
//     />
//     <button
//       type="button"
//       className="px-3 py-2 text-lg"
//       onClick={() => onChange(value + 1)}
//     >
//       +
//     </button>
//   </div>
// );

// // ===== main =====
// export default function ProductDetail() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { addToCart } = useCart();
//   const currentUser = useSelector((state) => state.user.user);

//   const [book, setBook] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [qty, setQty] = useState(1);
//   const [reviews, setReviews] = useState([]);

//   // load reviews
//   const loadReviews = () => {
//     reviewApi
//       .fetchAll(id)
//       .then((list) => setReviews(list))
//       .catch(() => { });
//   };

//   useEffect(() => {
//     loadReviews();
//   }, [id]);

//   // fetch book detail từ BE
//   useEffect(() => {
//     let ignore = false;

//     async function fetchBook() {
//       setLoading(true);
//       try {
//         const res = await fetch(summaryApi.url(`/books/${id}`));
//         const json = await res.json();
//         const data = json?.data ? json.data : json;
//         if (!ignore) setBook(data);
//       } catch (err) {
//         console.error("Fetch book detail failed:", err);
//         if (!ignore) setBook(null);
//       } finally {
//         if (!ignore) setLoading(false);
//       }
//     }

//     fetchBook();
//     return () => {
//       ignore = true;
//     };
//   }, [id]);

//   // ====== GIÁ (ưu tiên sale_price) ======
//   const price =
//     book?.sale_price ?? book?.discount_price ?? book?.price ?? null; // giá hiển thị đỏ

//   const oldPrice =
//     book?.price != null &&
//       price != null &&
//       Number(book.price) > Number(price)
//       ? Number(book.price)
//       : null;

//   const discountPercent =
//     oldPrice && price
//       ? Math.round(((oldPrice - price) / oldPrice) * 100)
//       : 0;

//   // rating
//   const rawRating = book?.rating_avg;
//   const averageRating =
//     rawRating == null
//       ? 0
//       : Number.isFinite(Number(rawRating))
//         ? Number(rawRating)
//         : 0;
//   const ratingCount =
//     book?.rating_count == null ? 0 : Number(book.rating_count);

//   // handlers
//   const handleAddToCart = async () => {
//     if (!book) return;
//     const ok = await addToCart(
//       {
//         id: book.id,
//         title: book.title,
//         price: price, // dùng giá đang bán (sale/discount/price)
//         image_url: book.image_url,
//       },
//       qty
//     );
//     if (ok) toast.success("Đã thêm vào giỏ hàng", { autoClose: 1400 });
//   };

//   const handleBuyNow = async () => {
//     if (!book) return;
//     const ok = await addToCart(
//       {
//         id: book.id,
//         title: book.title,
//         price: price,
//         image_url: book.image_url,
//       },
//       qty
//     );
//     if (ok) navigate("/cart");
//   };

//   // render
//   if (loading) {
//     return (
//       <div className="max-w-7xl mx-auto px-3 md:px-4 py-10">
//         <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>
//       </div>
//     );
//   }

//   if (!book) {
//     return (
//       <div className="max-w-7xl mx-auto px-3 md:px-4 py-10 text-center">
//         <h1 className="text-xl font-semibold mb-3">Không tìm thấy sản phẩm</h1>
//         <Link to="/" className="text-red-600 hover:underline">
//           Về trang chủ
//         </Link>
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto max-w-7xl px-3 md:px-4 py-6">
//       {/* breadcrumb */}
//       <nav className="text-sm text-gray-500 mb-3">
//         <Link to="/" className="hover:underline">
//           Trang chủ
//         </Link>{" "}
//         /{" "}
//         <span className="hover:underline">
//           {book.category_name || "Danh mục"}
//         </span>{" "}
//         / <span className="text-gray-800">{book.title}</span>
//       </nav>

//       <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
//         {/* cột trái */}
//         <div className="lg:col-span-2 space-y-4">
//           <div className="relative rounded-2xl border border-gray-200 bg-white p-3 flex items-center justify-center h-[420px]">
//             <img
//               src={
//                 book.image_url ||
//                 book.imageUrl ||
//                 "https://via.placeholder.com/300x400?text=Book"
//               }
//               alt={book.title}
//               className="max-h-full object-contain"
//             />
//             {discountPercent > 0 && (
//               <span className="absolute top-5 left-5 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
//                 -{discountPercent}%
//               </span>
//             )}
//           </div>

//           <div className="rounded-2xl border border-gray-200 bg-white p-4">
//             <div className="font-semibold mb-2">Chính sách cửa hàng</div>
//             <Policies />
//           </div>
//         </div>

//         {/* cột phải */}
//         <div className="lg:col-span-3 space-y-4">
//           <div className="rounded-2xl border border-gray-200 bg-white p-4">
//             <h1 className="text-xl md:text-2xl font-bold text-gray-900">
//               {book.title}
//             </h1>

//             {book.author && (
//               <p className="mt-1 text-sm text-gray-500">
//                 Tác giả: <span className="text-gray-700">{book.author}</span>
//               </p>
//             )}

//             {/* rating */}
//             <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
//               <RatingStars value={averageRating} />
//               <span className="text-gray-700 font-medium">
//                 {to1(averageRating)} / 5
//               </span>
//               <span>({ratingCount} đánh giá)</span>
//             </div>

//             {/* giá */}
//             <div className="mt-4 flex items-end gap-3">
//               <div className="text-2xl font-extrabold text-red-600">
//                 {price != null ? money(price) : "Liên hệ"}
//               </div>

//               {oldPrice && (
//                 <div className="text-gray-400 line-through text-lg">
//                   {money(oldPrice)}
//                 </div>
//               )}

//               {discountPercent > 0 && (
//                 <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
//                   -{discountPercent}%
//                 </span>
//               )}
//             </div>

//             {/* ship */}
//             <div className="mt-4">
//               <ShippingCard />
//             </div>

//             {/* qty + btns */}
//             <div className="mt-4 flex flex-wrap items-center gap-4">
//               <div className="flex items-center gap-3">
//                 <span className="text-sm text-gray-600">Số lượng</span>
//                 <Quantity value={qty} onChange={setQty} />
//               </div>

//               <div className="flex gap-3 flex-wrap">
//                 <button
//                   onClick={handleBuyNow}
//                   className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-white font-semibold hover:bg-red-700"
//                 >
//                   <FiShoppingCart className="h-5 w-5" />
//                   Mua ngay
//                 </button>
//                 <button
//                   onClick={handleAddToCart}
//                   className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-red-600 font-semibold hover:bg-red-50"
//                 >
//                   Thêm vào giỏ
//                 </button>
//                 <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-gray-700 hover:bg-gray-50">
//                   <FiHeart /> Yêu thích
//                 </button>
//               </div>
//             </div>

//             {/* tồn kho */}
//             {typeof book.stock === "number" && (
//               <p className="mt-3 text-xs text-gray-500">
//                 Còn lại: {book.stock} sản phẩm
//               </p>
//             )}
//           </div>

//           {/* bảng thông tin */}
//           <InfoTable book={book} />

//           {/* mô tả */}
//           <div className="rounded-2xl border border-gray-200 bg-white p-4">
//             <div className="font-semibold mb-2">Mô tả sản phẩm</div>
//             <p className="whitespace-pre-line text-gray-800 leading-relaxed">
//               {book.description || "Đang cập nhật mô tả..."}
//             </p>
//           </div>

//           {/* review */}
//           <div className="rounded-2xl border border-gray-200 bg-white p-4">
//             <div className="mb-4 flex items-center justify-between gap-4">
//               <div>
//                 <div className="text-base font-semibold text-gray-900">
//                   Đánh giá & nhận xét
//                 </div>
//                 <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
//                   <RatingStars value={averageRating} />
//                   <span className="text-gray-700 font-medium">
//                     {to1(averageRating)} / 5
//                   </span>
//                   <span className="text-gray-500">
//                     ({ratingCount} đánh giá)
//                   </span>
//                 </div>
//               </div>
//             </div>

//             <div className="mb-6">
//               <ReviewForm
//                 bookId={id}
//                 currentUser={currentUser}
//                 onSubmitted={loadReviews}
//               />
//             </div>

//             <div>
//               {reviews.length === 0 ? (
//                 <div className="text-sm text-gray-500">
//                   Chưa có đánh giá nào. Hãy là người đầu tiên!
//                 </div>
//               ) : (
//                 <ul className="space-y-4">
//                   {reviews.map((rv) => (
//                     <li key={rv.id}>
//                       <ReviewCard
//                         review={rv}
//                         currentUser={currentUser}
//                         reload={loadReviews}
//                       />
//                     </li>
//                   ))}
//                 </ul>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// // //code cập nhật sale_price và bổ sung các field phổ biến
// // // src/pages/ProductDetail.jsx
// // import React, { useEffect, useState } from "react";
// // import { useParams, Link, useNavigate } from "react-router-dom";
// // import { FiTruck, FiShield, FiHeart, FiShoppingCart } from "react-icons/fi";
// // import { toast } from "react-toastify";
// // import { useSelector } from "react-redux";
// // import summaryApi from "../common";
// // import { useCart } from "../context/CartContext";

// // // (tuỳ dự án bạn có helper money, giữ lại import nếu dùng)
// // // import { money } from "./helpers/productHelper";

// // import { reviewApi } from "../api/reviewApi";
// // import ReviewForm from "../components/layout/ReviewForm";
// // import ReviewCard from "../components/layout/ReviewCard";
// // import RatingStars from "../components/layout/RatingStars";

// // function fmt(v) {
// //   if (v == null) return "";
// //   const n = Number(v);
// //   if (!Number.isFinite(n)) return "";
// //   return n.toLocaleString("vi-VN") + " ₫";
// // }
// // function to1(num, fallback = "0.0") {
// //   if (typeof num !== "number" || Number.isNaN(num)) return fallback;
// //   return num.toFixed(1);
// // }

// // const ShippingCard = () => (
// //   <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
// //     <div className="flex items-center gap-2 text-gray-800">
// //       <FiTruck className="h-5 w-5" /> Giao hàng nhanh: Nội thành HCM, Hà Nội
// //     </div>
// //     <div className="text-sm text-gray-600">
// //       Nhận dự kiến: 1-3 ngày · Miễn phí từ 299.000đ
// //     </div>
// //     <div className="flex gap-3 text-sm">
// //       <span className="rounded-lg bg-gray-100 px-2 py-1">ZaloPay</span>
// //       <span className="rounded-lg bg-gray-100 px-2 py-1">VNPay</span>
// //       <span className="rounded-lg bg-gray-100 px-2 py-1">COD</span>
// //     </div>
// //   </div>
// // );

// // const Policies = () => (
// //   <ul className="space-y-2 text-sm text-gray-700">
// //     <li className="flex items-center gap-2">
// //       <FiShield className="h-4 w-4" /> Hàng chính hãng, đổi trả 7 ngày
// //     </li>
// //     <li className="flex items-center gap-2">
// //       <FiShield className="h-4 w-4" /> Bảo mật thanh toán
// //     </li>
// //     <li className="flex items-center gap-2">
// //       <FiShield className="h-4 w-4" /> Hỗ trợ 24/7
// //     </li>
// //   </ul>
// // );

// // const InfoTable = ({ book }) => {
// //   const rows = [
// //     { label: "Tác giả", value: book.author },
// //     { label: "Nhà xuất bản", value: book.publisher },
// //     { label: "Năm XB", value: book.published_year },
// //     { label: "Ngôn ngữ", value: book.language },
// //     { label: "Định dạng", value: book.format },
// //     { label: "Tồn kho", value: book.stock },
// //   ].filter((r) => r.value !== undefined && r.value !== null && r.value !== "");

// //   if (!rows.length) return null;

// //   return (
// //     <div className="rounded-xl border border-gray-200 bg-white">
// //       <div className="border-b px-4 py-2 font-semibold">Thông tin chi tiết</div>
// //       <dl className="grid grid-cols-1 md:grid-cols-2">
// //         {rows.map((row, i) => (
// //           <div
// //             key={row.label}
// //             className={`grid grid-cols-[160px_1fr] gap-4 px-4 py-2 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"
// //               }`}
// //           >
// //             <dt className="text-gray-500">{row.label}</dt>
// //             <dd className="text-gray-800">{row.value}</dd>
// //           </div>
// //         ))}
// //       </dl>
// //     </div>
// //   );
// // };

// // const Quantity = ({ value, onChange }) => (
// //   <div className="inline-flex items-center rounded-xl border border-gray-300 overflow-hidden">
// //     <button
// //       type="button"
// //       className="px-3 py-2 text-lg"
// //       onClick={() => onChange(Math.max(1, value - 1))}
// //     >
// //       -
// //     </button>
// //     <input
// //       className="w-12 text-center outline-none"
// //       value={value}
// //       onChange={(e) =>
// //         onChange(Math.max(1, parseInt(e.target.value || 1, 10)))
// //       }
// //     />
// //     <button
// //       type="button"
// //       className="px-3 py-2 text-lg"
// //       onClick={() => onChange(value + 1)}
// //     >
// //       +
// //     </button>
// //   </div>
// // );

// // export default function ProductDetail() {
// //   const { id } = useParams();
// //   const navigate = useNavigate();
// //   const { addToCart } = useCart();
// //   const currentUser = useSelector((state) => state.user.user);

// //   const [book, setBook] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [qty, setQty] = useState(1);
// //   const [reviews, setReviews] = useState([]);

// //   const loadReviews = () => {
// //     reviewApi
// //       .fetchAll(id)
// //       .then((list) => setReviews(list))
// //       .catch(() => { });
// //   };

// //   useEffect(() => {
// //     loadReviews();
// //   }, [id]);

// //   // fetch book detail từ BE
// //   useEffect(() => {
// //     let ignore = false;

// //     async function fetchBook() {
// //       setLoading(true);
// //       try {
// //         const res = await fetch(summaryApi.url(`/books/${id}`));
// //         const json = await res.json();
// //         const data = json?.data ? json.data : json;
// //         if (!ignore) setBook(data);
// //       } catch (err) {
// //         console.error("Fetch book detail failed:", err);
// //         if (!ignore) setBook(null);
// //       } finally {
// //         if (!ignore) setLoading(false);
// //       }
// //     }

// //     fetchBook();
// //     return () => {
// //       ignore = true;
// //     };
// //   }, [id]);

// //   // ====== GIÁ ======
// //   const price = book?.sale_price ?? book?.discount_price ?? book?.price ?? null; // hiển thị chính
// //   const oldPrice =
// //     book?.price != null && price != null && Number(book.price) > Number(price)
// //       ? Number(book.price)
// //       : null;
// //   const discountPercent =
// //     oldPrice && price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

// //   // rating
// //   const rawRating = book?.rating_avg;
// //   const averageRating =
// //     rawRating == null
// //       ? 0
// //       : Number.isFinite(Number(rawRating))
// //         ? Number(rawRating)
// //         : 0;
// //   const ratingCount =
// //     book?.rating_count == null ? 0 : Number(book.rating_count);

// //   // handlers
// //   const handleAddToCart = async () => {
// //     if (!book) return;
// //     const ok = await addToCart(
// //       {
// //         id: book.id,
// //         title: book.title,
// //         price: price, // dùng giá đang bán
// //         image_url: book.image_url,
// //       },
// //       qty
// //     );
// //     if (ok) toast.success("Đã thêm vào giỏ hàng", { autoClose: 1400 });
// //   };

// //   const handleBuyNow = async () => {
// //     if (!book) return;
// //     const ok = await addToCart(
// //       {
// //         id: book.id,
// //         title: book.title,
// //         price: price,
// //         image_url: book.image_url,
// //       },
// //       qty
// //     );
// //     if (ok) navigate("/cart");
// //   };

// //   if (loading) {
// //     return (
// //       <div className="max-w-7xl mx-auto px-3 md:px-4 py-10">
// //         <p className="text-sm text-gray-500">Đang tải sản phẩm.</p>
// //       </div>
// //     );
// //   }

// //   if (!book) {
// //     return (
// //       <div className="max-w-7xl mx-auto px-3 md:px-4 py-10 text-center">
// //         <h1 className="text-xl font-semibold mb-3">Không tìm thấy sản phẩm</h1>
// //         <Link to="/" className="text-red-600 hover:underline">
// //           Về trang chủ
// //         </Link>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="mx-auto max-w-7xl px-3 md:px-4 py-6">
// //       {/* breadcrumb */}
// //       <nav className="text-sm text-gray-500 mb-3">
// //         <Link to="/" className="hover:underline">
// //           Trang chủ
// //         </Link>{" "}
// //         /{" "}
// //         <span className="hover:underline">
// //           {book.category_name || "Danh mục"}
// //         </span>{" "}
// //         / <span className="text-gray-800">{book.title}</span>
// //       </nav>

// //       <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6">
// //         {/* left: image */}
// //         <div className="md:col-span-5 rounded-2xl border border-gray-200 bg-white p-3">
// //           <div className="relative bg-gray-50 rounded-xl overflow-hidden">
// //             <img
// //               src={book.image_url}
// //               alt={book.title}
// //               className="w-full h-auto object-contain"
// //             />

// //             {discountPercent > 0 && (
// //               <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-md">
// //                 -{discountPercent}%
// //               </span>
// //             )}
// //           </div>
// //         </div>

// //         {/* right: content */}
// //         <div className="md:col-span-7 space-y-4">
// //           <div className="rounded-2xl border border-gray-200 bg-white p-4">
// //             <h1 className="text-xl md:text-2xl font-bold text-gray-900">
// //               {book.title}
// //             </h1>

// //             {/* Giá */}
// //             <div className="mt-2 flex flex-wrap items-center gap-3">
// //               {price != null ? (
// //                 <span className="text-2xl font-bold text-red-600">{fmt(price)}</span>
// //               ) : (
// //                 <span className="text-gray-400">Liên hệ</span>
// //               )}
// //               {oldPrice != null && (
// //                 <span className="text-gray-400 line-through">{fmt(oldPrice)}</span>
// //               )}
// //               {discountPercent > 0 && (
// //                 <span className="inline-flex items-center rounded-md bg-red-50 text-red-600 text-xs font-semibold px-2 py-1">
// //                   -{discountPercent}%
// //                 </span>
// //               )}
// //             </div>

// //             {/* hành động */}
// //             <div className="mt-4 flex items-center gap-4">
// //               <div className="flex flex-col">
// //                 <span className="text-sm text-gray-600">Số lượng</span>
// //                 <Quantity value={qty} onChange={setQty} />
// //               </div>

// //               <div className="flex gap-3 flex-wrap">
// //                 <button
// //                   onClick={handleBuyNow}
// //                   className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-white font-semibold hover:bg-red-700"
// //                 >
// //                   <FiShoppingCart className="h-5 w-5" />
// //                   Mua ngay
// //                 </button>
// //                 <button
// //                   onClick={handleAddToCart}
// //                   className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-red-600 font-semibold hover:bg-red-50"
// //                 >
// //                   Thêm vào giỏ
// //                 </button>
// //                 <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-gray-700 hover:bg-gray-50">
// //                   <FiHeart /> Yêu thích
// //                 </button>
// //               </div>
// //             </div>

// //             {/* tồn kho */}
// //             {typeof book.stock === "number" && (
// //               <div className="mt-3">
// //                 {/* Thanh trạng thái TRÊN */}
// //                 <div className="w-40 h-2 rounded-full bg-gray-200 overflow-hidden">
// //                   <div
// //                     className={`h-2 ${book.stock === 0
// //                         ? "bg-red-500"
// //                         : book.stock <= 20
// //                           ? "bg-amber-500"
// //                           : "bg-emerald-500"
// //                       }`}
// //                     style={{ width: `${Math.min(100, (Number(book.stock) / 50) * 100)}%` }}
// //                   />
// //                 </div>
// //                 {/* Số lượng DƯỚI */}
// //                 <p className="mt-1 text-xs text-gray-500">
// //                   Còn lại: {book.stock} sản phẩm
// //                 </p>
// //               </div>
// //             )}
// //           </div>

// //           {/* bảng thông tin */}
// //           <InfoTable book={book} />

// //           {/* mô tả */}
// //           <div className="rounded-2xl border border-gray-200 bg-white p-4">
// //             <div className="font-semibold mb-2">Mô tả sản phẩm</div>
// //             <p className="whitespace-pre-line text-gray-800 leading-relaxed">
// //               {book.description || "Đang cập nhật mô tả."}
// //             </p>
// //           </div>

// //           {/* review */}
// //           <div className="rounded-2xl border border-gray-200 bg-white p-4">
// //             <div className="mb-4 flex items-center justify-between gap-4">
// //               <div>
// //                 <div className="text-base font-semibold text-gray-900">
// //                   Đánh giá & nhận xét
// //                 </div>
// //                 <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
// //                   <RatingStars value={averageRating} />
// //                   <span className="text-gray-700 font-medium">
// //                     {to1(averageRating)} / 5
// //                   </span>
// //                   <span className="text-gray-500">({ratingCount} đánh giá)</span>
// //                 </div>
// //               </div>
// //             </div>

// //             <div className="mb-6">
// //               <ReviewForm
// //                 bookId={id}
// //                 currentUser={currentUser}
// //                 onSubmitted={loadReviews}
// //               />
// //             </div>

// //             <div>
// //               {reviews.length === 0 ? (
// //                 <div className="text-sm text-gray-500">
// //                   Chưa có đánh giá nào. Hãy là người đầu tiên!
// //                 </div>
// //               ) : (
// //                 <ul className="space-y-4">
// //                   {reviews.map((rv) => (
// //                     <li key={rv.id}>
// //                       <ReviewCard
// //                         review={rv}
// //                         currentUser={currentUser}
// //                         reload={loadReviews}
// //                       />
// //                     </li>
// //                   ))}
// //                 </ul>
// //               )}
// //             </div>
// //           </div>
// //         </div>

// //         {/* right: sidebar */}
// //         <div className="md:col-span-12 lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
// //           <ShippingCard />
// //           <div className="rounded-xl border border-gray-200 bg-white p-4">
// //             <Policies />
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiTruck, FiShield, FiHeart, FiShoppingCart } from "react-icons/fi";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import summaryApi from "../common";
import { useCart } from "../context/CartContext";

// 🟡 dùng helper của bạn
import { money } from "../helpers/productHelper";

import { reviewApi } from "../api/reviewApi";
import ReviewForm from "../components/layout/ReviewForm";
import ReviewCard from "../components/layout/ReviewCard";
import RatingStars from "../components/layout/RatingStars";

// ===== helper nhỏ để format rating an toàn
function to1(num, fallback = "0.0") {
  if (typeof num !== "number" || Number.isNaN(num)) return fallback;
  return num.toFixed(1);
}

// ===== các block phụ =====
const ShippingCard = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
    <div className="flex items-center gap-2 text-gray-800">
      <FiTruck className="h-5 w-5" /> Giao hàng nhanh: Nội thành HCM, Hà Nội
    </div>
    <div className="text-sm text-gray-600">
      Nhận dự kiến: 1-3 ngày · Miễn phí từ 299.000đ
    </div>
    <div className="flex gap-3 text-sm">
      <span className="rounded-lg bg-gray-100 px-2 py-1">ZaloPay</span>
      <span className="rounded-lg bg-gray-100 px-2 py-1">VNPay</span>
      <span className="rounded-lg bg-gray-100 px-2 py-1">COD</span>
    </div>
  </div>
);

const Policies = () => (
  <ul className="space-y-2 text-sm text-gray-700">
    <li className="flex items-center gap-2">
      <FiShield className="h-4 w-4" /> Hàng chính hãng, đổi trả 7 ngày
    </li>
    <li className="flex items-center gap-2">
      <FiShield className="h-4 w-4" /> Bảo mật thanh toán
    </li>
    <li className="flex items-center gap-2">
      <FiShield className="h-4 w-4" /> Hỗ trợ 24/7
    </li>
  </ul>
);

const InfoTable = ({ book }) => {
  const rows = [
    { label: "Tác giả", value: book.author },
    { label: "Nhà xuất bản", value: book.publisher },
    { label: "Năm XB", value: book.published_year },
    { label: "Ngôn ngữ", value: book.language },
    { label: "Định dạng", value: book.format },
    { label: "Tồn kho", value: book.stock },
  ].filter((r) => r.value !== undefined && r.value !== null && r.value !== "");

  if (!rows.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b px-4 py-2 font-semibold">Thông tin chi tiết</div>
      <dl className="grid grid-cols-1 md:grid-cols-2">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-[160px_1fr] gap-4 px-4 py-2 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"
              }`}
          >
            <dt className="text-gray-500">{row.label}</dt>
            <dd className="text-gray-800">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

const Quantity = ({ value, onChange }) => (
  <div className="inline-flex items-center rounded-xl border border-gray-300 overflow-hidden">
    <button
      type="button"
      className="px-3 py-2 text-lg"
      onClick={() => onChange(Math.max(1, value - 1))}
    >
      -
    </button>
    <input
      className="w-12 text-center outline-none"
      value={value}
      onChange={(e) =>
        onChange(Math.max(1, parseInt(e.target.value || 1, 10)))
      }
    />
    <button
      type="button"
      className="px-3 py-2 text-lg"
      onClick={() => onChange(value + 1)}
    >
      +
    </button>
  </div>
);

// ===== main =====
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const currentUser = useSelector((state) => state.user.user);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);

  // load reviews
  const loadReviews = () => {
    reviewApi
      .fetchAll(id)
      .then((list) => setReviews(list))
      .catch(() => { });
  };

  useEffect(() => {
    loadReviews();
  }, [id]);

  // fetch book detail từ BE
  useEffect(() => {
    let ignore = false;

    async function fetchBook() {
      setLoading(true);
      try {
        const res = await fetch(summaryApi.url(`/books/${id}`));
        const json = await res.json();
        const data = json?.data ? json.data : json;
        if (!ignore) setBook(data);
      } catch (err) {
        console.error("Fetch book detail failed:", err);
        if (!ignore) setBook(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchBook();
    return () => {
      ignore = true;
    };
  }, [id]);

  // handlers
  const handleAddToCart = async () => {
    if (!book) return;
    const ok = await addToCart(
      {
        id: book.id,
        title: book.title,
        price: book.discount_price ?? book.price,
        image_url: book.image_url,
      },
      qty
    );
    if (ok) toast.success("Đã thêm vào giỏ hàng", { autoClose: 1400 });
  };

  const handleBuyNow = async () => {
    if (!book) return;
    const ok = await addToCart(
      {
        id: book.id,
        title: book.title,
        price: book.discount_price ?? book.price,
        image_url: book.image_url,
      },
      qty
    );
    if (ok) navigate("/cart");
  };

  // giá
  const price = book?.discount_price ?? book?.price ?? null;
  const oldPrice =
    book?.discount_price && book?.price && book.discount_price < book.price
      ? book.price
      : null;
  const discountPercent =
    oldPrice && price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  // rating
  const rawRating = book?.rating_avg;
  const averageRating =
    rawRating == null
      ? 0
      : Number.isFinite(Number(rawRating))
        ? Number(rawRating)
        : 0;
  const ratingCount =
    book?.rating_count == null ? 0 : Number(book.rating_count);

  // render
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-10">
        <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-10 text-center">
        <h1 className="text-xl font-semibold mb-3">Không tìm thấy sản phẩm</h1>
        <Link to="/" className="text-red-600 hover:underline">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 md:px-4 py-6">
      {/* breadcrumb */}
      <nav className="text-sm text-gray-500 mb-3">
        <Link to="/" className="hover:underline">
          Trang chủ
        </Link>{" "}
        /{" "}
        <span className="hover:underline">
          {book.category_name || "Danh mục"}
        </span>{" "}
        / <span className="text-gray-800">{book.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* cột trái */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative rounded-2xl border border-gray-200 bg-white p-3 flex items-center justify-center h-[420px]">
            <img
              src={
                book.image_url ||
                book.imageUrl ||
                "https://via.placeholder.com/300x400?text=Book"
              }
              alt={book.title}
              className="max-h-full object-contain"
            />
            {discountPercent > 0 && (
              <span className="absolute top-5 left-5 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
                -{discountPercent}%
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="font-semibold mb-2">Chính sách cửa hàng</div>
            <Policies />
          </div>
        </div>

        {/* cột phải */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {book.title}
            </h1>

            {book.author && (
              <p className="mt-1 text-sm text-gray-500">
                Tác giả: <span className="text-gray-700">{book.author}</span>
              </p>
            )}

            {/* rating */}
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <RatingStars value={averageRating} />
              <span className="text-gray-700 font-medium">
                {to1(averageRating)} / 5
              </span>
              <span>({ratingCount} đánh giá)</span>
            </div>

            {/* giá */}
            <div className="mt-4 flex items-end gap-3">
              <div className="text-2xl font-extrabold text-red-600">
                {price ? money(price) : "Liên hệ"}
              </div>
              {oldPrice && (
                <div className="text-gray-400 line-through text-lg">
                  {money(oldPrice)}
                </div>
              )}
              {discountPercent > 0 && (
                <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* ship */}
            <div className="mt-4">
              <ShippingCard />
            </div>

            {/* qty + btns */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Số lượng</span>
                <Quantity value={qty} onChange={setQty} />
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleBuyNow}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-white font-semibold hover:bg-red-700"
                >
                  <FiShoppingCart className="h-5 w-5" />
                  Mua ngay
                </button>
                <button
                  onClick={handleAddToCart}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-red-600 font-semibold hover:bg-red-50"
                >
                  Thêm vào giỏ
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-gray-700 hover:bg-gray-50">
                  <FiHeart /> Yêu thích
                </button>
              </div>
            </div>

            {/* tồn kho */}
            {typeof book.stock === "number" && (
              <p className="mt-3 text-xs text-gray-500">
                Còn lại: {book.stock} sản phẩm
              </p>
            )}
          </div>

          {/* bảng thông tin */}
          <InfoTable book={book} />

          {/* mô tả */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="font-semibold mb-2">Mô tả sản phẩm</div>
            <p className="whitespace-pre-line text-gray-800 leading-relaxed">
              {book.description || "Đang cập nhật mô tả..."}
            </p>
          </div>

          {/* review */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-gray-900">
                  Đánh giá & nhận xét
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  <RatingStars value={averageRating} />
                  <span className="text-gray-700 font-medium">
                    {to1(averageRating)} / 5
                  </span>
                  <span className="text-gray-500">
                    ({ratingCount} đánh giá)
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <ReviewForm
                bookId={id}
                currentUser={currentUser}
                onSubmitted={loadReviews}
              />
            </div>

            <div>
              {reviews.length === 0 ? (
                <div className="text-sm text-gray-500">
                  Chưa có đánh giá nào. Hãy là người đầu tiên!
                </div>
              ) : (
                <ul className="space-y-4">
                  {reviews.map((rv) => (
                    <li key={rv.id}>
                      <ReviewCard
                        review={rv}
                        currentUser={currentUser}
                        reload={loadReviews}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}