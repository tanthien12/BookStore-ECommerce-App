// src/components/ProductCard.jsx
import { Link } from "react-router-dom";
import { computeDiscount } from "../helpers/productHelper";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product, showDiscount = false, qty = 1 }) {
  const { addToCart } = useCart();
  if (!product) return null;

  const discount = computeDiscount(product);

  return (
    <div className="relative border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition">
      {showDiscount && discount > 0 && (
        <span className="absolute left-2 top-2 z-10 text-xs px-2 py-0.5 rounded-full bg-red-600 text-white">
          -{discount}%
        </span>
      )}

      <Link to={`/product/${product.id}`} className="block">
        <img
          src={product.img}
          alt={product.title}
          className="w-full h-48 object-contain bg-white"
          loading="lazy"
        />
        <div className="p-2">
          <h3 className="text-sm font-medium line-clamp-2">{product.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-red-600 font-bold">
              {Number(product.price).toLocaleString("vi-VN")}đ
            </span>
            {product.oldPrice && (
              <span className="line-through text-gray-400 text-sm">
                {Number(product.oldPrice).toLocaleString("vi-VN")}đ
              </span>
            )}
          </div>
        </div>
      </Link>

      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product, qty); }}
        className="m-2 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-white font-semibold hover:bg-red-700"
      >
        Thêm vào giỏ
      </button>
    </div>
  );
}
