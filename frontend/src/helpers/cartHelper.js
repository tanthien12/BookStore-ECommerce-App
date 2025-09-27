
// ————— Storage —————
export const readCart = () => {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); }
  catch { return []; }
};
export const writeCart = (cart) => {
  try { localStorage.setItem("cart", JSON.stringify(cart)); } catch { /* empty */ }
};

// ————— Utils —————
const toInt = (n, def = 1) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : def;
};
const clamp = (n, min = 1, max = 999) => Math.min(max, Math.max(min, toInt(n)));

// Chuẩn hoá product → cartItem
export const toCartItem = (product, qty = 1) => ({
  productId: product.id,
  title: product.title,
  price: Number(product.price ?? 0),
  oldPrice: Number(product.oldPrice ?? 0),
  image: product.img || product.images?.[0],
  qty: clamp(qty, 1),
});

// ————— Mutations thuần (immutable) —————
// Thêm/ cộng dồn
export const addItem = (cart, product, qty = 1) => {
  const item = toCartItem(product, qty);
  const i = cart.findIndex((it) => it.productId === item.productId);
  if (i >= 0) {
    const next = cart.slice();
    next[i] = { ...next[i], qty: clamp(next[i].qty + item.qty) };
    return next;
  }
  return [...cart, item];
};

export const updateItemQty = (cart, productId, qty) =>
  cart.map((it) => (it.productId === productId ? { ...it, qty: clamp(qty) } : it));

export const removeItem = (cart, productId) =>
  cart.filter((it) => it.productId !== productId);

export const clearCart = () => [];

// ————— Derivations —————
export const countItems = (cart) => cart.reduce((s, it) => s + toInt(it.qty, 0), 0);
export const subtotalOf = (cart) =>
  cart.reduce((s, it) => s + Number(it.price ?? 0) * toInt(it.qty, 0), 0);
