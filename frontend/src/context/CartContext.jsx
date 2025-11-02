// src/context/CartContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom"; // (THÊM)
import cartApi from "../api/cartApi";

const CartContext = createContext();

function readCartFromStorage() {
  try {
    const raw = localStorage.getItem("cart_items");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCartToStorage(cart) {
  localStorage.setItem("cart_items", JSON.stringify(cart));
}

function clearCartStorage() {
  localStorage.removeItem("cart_items");
}

function isLoggedIn() {
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("token");
  return !!token;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => readCartFromStorage());
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [loadedFromServer, setLoadedFromServer] = useState(false);
  const loggedIn = isLoggedIn();
  const navigate = useNavigate(); // (THÊM)

  // 1) Khi login: merge local -> server -> fetch lại
  useEffect(() => {
    if (!loggedIn) {
      setLoadedFromServer(false);
      return;
    }

    (async () => {
      try {
        // merge local trước
        const localCart = readCartFromStorage();
        if (localCart.length > 0) {
          for (const item of localCart) {
            // item.productId là book_id
            await cartApi.addItem(item.productId, item.qty);
          }
          clearCartStorage();
        }

        // fetch giỏ hàng thật
        const data = await cartApi.getCart();
        if (data.success && Array.isArray(data.items)) {
          const mapped = data.items.map((it) => ({
            cartItemId: it.cart_item_id,
            productId: it.book_id,
            title: it.title,
            image: it.image_url,
            price: Number(it.price_snapshot || it.book_price),
            qty: it.quantity,
            oldPrice: null,
          }));
          setCart(mapped);
          writeCartToStorage(mapped);
        }
      } catch (err) {
        console.error("load/merge cart error:", err);
      } finally {
        setLoadedFromServer(true);
      }
    })();
  }, [loggedIn]);

  // 2) sync local mỗi khi cart thay đổi
  useEffect(() => {
    writeCartToStorage(cart);
    setSelectedProductIds((prev) =>
      prev.filter((id) => cart.some((i) => i.productId === id))
    );
  }, [cart]);

  // 3) tổng
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  // 4) thêm vào giỏ
  const addToCart = useCallback(
    async (product, quantity = 1) => {
      // (SỬA) nếu chưa login -> chuyển login và return false
      if (!loggedIn) {
        // nếu có id sản phẩm thì redirect về lại đúng sản phẩm
        const redirectUrl = product?.id
          ? `/product/${product.id}`
          : "/cart";
        navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        return false;
      }

      // đã login -> gọi API
      try {
        await cartApi.addItem(product.id, quantity);
      } catch (err) {
        console.error("add cart api error:", err);
      }

      // cập nhật local để hiển thị tức thì
      setCart((prev) => {
        const exist = prev.find(
          (p) => p.productId === product.id || p.productId === product.productId
        );
        if (exist) {
          return prev.map((p) =>
            p.productId === exist.productId
              ? { ...p, qty: p.qty + quantity }
              : p
          );
        }
        return [
          ...prev,
          {
            cartItemId: product.cartItemId,
            productId: product.id ?? product.productId,
            title: product.title,
            image:
              Array.isArray(product.images) && product.images.length
                ? product.images[0]
                : product.image_url || product.image || "",
            price: product.price,
            oldPrice: product.oldPrice || null,
            qty: quantity,
          },
        ];
      });

      return true; // (THÊM) để FE biết là add thành công
    },
    [loggedIn, navigate]
  );

  // 5) cập nhật số lượng
  const updateQty = useCallback(
    async (productId, newQty) => {
      const safe = newQty < 1 ? 1 : newQty;
      const item = cart.find((i) => i.productId === productId);
      if (!item) return;

      if (loggedIn && item.cartItemId) {
        try {
          await cartApi.updateItem(item.cartItemId, safe);
        } catch (err) {
          console.error("update cart api error:", err);
        }
      }

      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId ? { ...i, qty: safe } : i
        )
      );
    },
    [cart, loggedIn]
  );

  // 6) xóa 1 item
  const removeFromCart = useCallback(
    async (productId) => {
      const item = cart.find((i) => i.productId === productId);
      if (loggedIn && item?.cartItemId) {
        try {
          await cartApi.removeItem(item.cartItemId);
        } catch (err) {
          console.error("remove cart api error:", err);
        }
      }

      setCart((prev) => prev.filter((i) => i.productId !== productId));
    },
    [cart, loggedIn]
  );

  // 7) clear all
  const clearCart = useCallback(async () => {
    if (loggedIn) {
      try {
        await cartApi.clearCart();
      } catch (err) {
        console.error("clear cart api error:", err);
      }
    }
    setCart([]);
    setSelectedProductIds([]);
    clearCartStorage();
  }, [loggedIn]);

  // 8) chọn / bỏ chọn
  const toggleSelect = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAll = () => {
    if (selectedProductIds.length === cart.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(cart.map((i) => i.productId));
    }
  };

  const removeSelected = () => {
    if (loggedIn) {
      cart.forEach((i) => {
        if (selectedProductIds.includes(i.productId) && i.cartItemId) {
          cartApi.removeItem(i.cartItemId).catch(() => {});
        }
      });
    }
    setCart((prev) =>
      prev.filter((i) => !selectedProductIds.includes(i.productId))
    );
    setSelectedProductIds([]);
  };

  const clearSelected = () => setSelectedProductIds([]);

  const getSelectedItems = () =>
    cart.filter((i) => selectedProductIds.includes(i.productId));

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        subtotal,

        addToCart,
        updateQty,
        removeFromCart,
        clearCart,

        selectedProductIds,
        toggleSelect,
        selectAll,
        removeSelected,
        clearSelected,
        getSelectedItems,

        loadedFromServer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
