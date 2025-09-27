import { useParams,Link,useNavigate } from "react-router-dom";
import { useEffect } from "react";
import React, { useMemo, useState } from "react";
import { FiStar, FiTruck, FiShield, FiHeart, FiShoppingCart } from "react-icons/fi";
import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import { products } from "../data/products"; // dữ liệu mẫu
import { useCart } from "../context/CartContext";
// import { money, computeDiscount } from "../helpers/productHelper"; 


const Price = ({ price, oldPrice, badge }) => {
  const discount = useMemo(() => (oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0), [price, oldPrice]);
  return (
    <div className="space-y-2">
      {badge && (
        <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-2 py-1 text-sm font-semibold text-red-600">
          <span className="tracking-wide">{badge}</span>
          {discount > 0 && <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs text-white">-{discount}%</span>}
        </div>
      )}  
      <div className="flex items-end gap-3">
        <div className="text-2xl font-extrabold text-red-600">{price.toLocaleString()} đ</div>
        {oldPrice && <div className="text-gray-400 line-through">{oldPrice.toLocaleString()} đ</div>}
      </div>
    </div>
  );
};

const ShippingCard = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
    <div className="flex items-center gap-2 text-gray-800"><FiTruck className="h-5 w-5"/> Giao hàng nhanh: Nội thành HCM, Hà Nội</div>
    <div className="text-sm text-gray-600">Dự kiến nhận: 1-3 ngày · Miễn phí từ 299k</div>
    <div className="flex gap-3 text-sm">
      <span className="rounded-lg bg-gray-100 px-2 py-1">ZaloPay</span>
      <span className="rounded-lg bg-gray-100 px-2 py-1">VNPay</span>
      <span className="rounded-lg bg-gray-100 px-2 py-1">COD</span>
    </div>
  </div>
);

const Policies = () => (
  <ul className="space-y-2 text-sm text-gray-700">
    <li className="flex items-center gap-2"><FiShield className="h-4 w-4"/> Hàng chính hãng, đổi trả 7 ngày</li>
    <li className="flex items-center gap-2"><FiShield className="h-4 w-4"/> Bảo mật thanh toán</li>
    <li className="flex items-center gap-2"><FiShield className="h-4 w-4"/> Hỗ trợ 24/7</li>
  </ul>
);

const InfoTable = ({ specs = [] }) => (
  <div className="rounded-xl border border-gray-200 bg-white">
    <div className="border-b px-4 py-2 font-semibold">Thông tin chi tiết</div>
    <dl className="grid grid-cols-1 md:grid-cols-2">
      {specs.map((row, i) => (
        <div key={i} className={`grid grid-cols-[160px_1fr] gap-4 px-4 py-2 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
          <dt className="text-gray-500">{row.label}</dt>
          <dd className="text-gray-800">{row.value}</dd>
        </div>
      ))}
    </dl>
  </div>
);

const RatingSummary = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-4">
    <div className="flex items-center gap-4">
      <div className="text-center">
        <div className="text-4xl font-extrabold">0.0</div>
        <div className="flex items-center justify-center gap-1 text-yellow-500">
          {Array.from({ length: 5 }).map((_, i) => <FiStar key={i} />)}
        </div>
        <div className="text-xs text-gray-500 mt-1">0 đánh giá</div>
      </div>
      <div className="flex-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-8">{5 - i}★</span>
            <div className="h-2 flex-1 rounded bg-gray-200"/>
            <span className="w-10 text-right text-gray-500">0%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Quantity = ({ value, onChange }) => (
  <div className="inline-flex items-center rounded-xl border border-gray-300 overflow-hidden">
    <button type="button" className="px-3 py-2 text-lg" onClick={() => onChange(Math.max(1, value - 1))}>-</button>
    <input className="w-12 text-center outline-none" value={value} onChange={(e) => onChange(Math.max(1, parseInt(e.target.value || 1)))} />
    <button type="button" className="px-3 py-2 text-lg" onClick={() => onChange(value + 1)}>+</button>
  </div>
);

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => String(p.id) === String(id)); // tìm theo id
  const { addToCart } = useCart();


  // Nếu không tìm thấy sản phẩm → về trang 404 hoặc Home
  useEffect(() => {
    if (!product) {
      // navigate("/not-found");
      console.warn("Product not found, id=", id);
    }
  }, [product, id]);

  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [qty, setQty] = useState(1);
  const handleAddToCart = () => {
  addToCart(product, qty);
  navigate("/cart");
};

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-3 md:px-4 py-10">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Không tìm thấy sản phẩm</h1>
          <Link to="/" className="mt-3 inline-block text-red-600 hover:underline">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 md:px-4 py-6">
      {/* Breadcrumb đơn giản */}
      <nav className="text-sm text-gray-500 mb-3">
        <Link to="/" className="hover:underline">Trang chủ</Link> /{" "}
        <a href="#" className="hover:underline">{product.category || "Danh mục"}</a> /{" "}
        <span className="text-gray-800">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* GALLERY */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-3">
            <Swiper modules={[Thumbs, Navigation]} navigation thumbs={{ swiper: thumbsSwiper }} className="mb-3 rounded-xl overflow-hidden">
              {product.images.map((src, i) => (
                <SwiperSlide key={i}>
                  <img src={src} alt={`${product.title} ${i+1}`} className="w-full h-[420px] object-contain" />
                </SwiperSlide>
              ))}
            </Swiper>
            <Swiper onSwiper={setThumbsSwiper} modules={[Thumbs]} watchSlidesProgress slidesPerView={4} spaceBetween={8}>
              {product.images.map((src, i) => (
                <SwiperSlide key={i}>
                  <img src={src} alt={`thumb ${i+1}`} className="w-full h-20 object-contain rounded-lg border" />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <div className="font-semibold mb-2">Chính sách cửa hàng</div>
            <Policies />
          </div>
        </div>

        {/* INFO + ACTIONS */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{product.title}</h1>
            {product.author && <div className="mt-1 text-sm text-gray-500">Tác giả: {product.author}</div>}
            <div className="mt-3">
              <Price price={product.price} oldPrice={product.oldPrice} badge={product.badge} />
            </div>

            <div className="mt-4"><ShippingCard /></div>

            <div className="mt-4 flex items-center gap-4">
              <span className="text-sm text-gray-600">Số lượng</span>
              <Quantity value={qty} onChange={setQty} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleAddToCart}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-white font-semibold hover:bg-red-700"
              >
                <FiShoppingCart className="h-5 w-5" /> Thêm vào giỏ
              </button>

              <button className="inline-flex items-center gap-2 rounded-xl border-2 border-red-600 px-5 py-3 text-red-600 font-semibold hover:bg-red-50">
                Mua ngay
              </button>
              <button className="ml-auto inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-gray-700 hover:bg-gray-50">
                <FiHeart /> Yêu thích
              </button>
            </div>
          </div>

          <InfoTable specs={product.specs || []} />

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="font-semibold mb-2">Mô tả sản phẩm</div>
            <p className="whitespace-pre-line text-gray-800 leading-relaxed">
              {product.description || "Đang cập nhật mô tả..."}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-3 font-semibold">Đánh giá & nhận xét</div>
            <RatingSummary />
            <div className="mt-3 text-sm text-gray-500">Chưa có đánh giá. Hãy là người đầu tiên!</div>
          </div>
        </div>
      </div>
    </div>
  );
}
