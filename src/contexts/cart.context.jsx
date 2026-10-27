import { createContext, useState, useEffect, useRef, useContext } from 'react';

import { UserContext } from './user.context.jsx';

const CART_STORAGE_KEY = 'cartItems';
const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const loadCartItems = () => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);

    if (!stored) return [];

    const parsed = JSON.parse(stored);

    if (Array.isArray(parsed)) return parsed;

    if (!parsed || !Array.isArray(parsed.items)) return [];

    if (
      typeof parsed.savedAt !== 'number' ||
      Date.now() - parsed.savedAt > CART_TTL_MS
    ) {
      return [];
    }

    return parsed.items;
  } catch (error) {
    return [];
  }
};

const saveCartItems = (cartItems) => {
  try {
    if (cartItems.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items: cartItems, savedAt: Date.now() })
    );
  } catch (error) {
    return;
  }
};

const addCartItem = (cartItems, productToAdd, quantity = 1) => {
  const existingCartItem = cartItems.find(
    (cartItem) => cartItem.id === productToAdd.id
  );

  if (existingCartItem) {
    return cartItems.map((cartItem) =>
      cartItem.id === productToAdd.id
        ? { ...cartItem, quantity: cartItem.quantity + quantity }
        : cartItem
    );
  }

  return [...cartItems, { ...productToAdd, quantity }];
};

const removeCartItem = (cartItems, cartItemToRemove) => {
  const existingCartItem = cartItems.find(
    (cartItem) => cartItem.id === cartItemToRemove.id
  );

  if (!existingCartItem) return cartItems;

  if (existingCartItem.quantity === 1) {
    return cartItems.filter((cartItem) => cartItem.id !== cartItemToRemove.id);
  }

  return cartItems.map((cartItem) =>
    cartItem.id === cartItemToRemove.id
      ? { ...cartItem, quantity: cartItem.quantity - 1 }
      : cartItem
  );
};

const clearCartItem = (cartItems, cartItemToClear) =>
  cartItems.filter((cartItem) => cartItem.id !== cartItemToClear.id);

export const CartContext = createContext({
  isCartOpen: false,
  setIsCartOpen: () => {},
  cartItems: [],
  addItemToCart: () => {},
  increaseItemQuantity: () => {},
  removeItemFromCart: () => {},
  clearItemFromCart: () => {},
  clearCart: () => {},
  lastAdded: null,
  cartCount: 0,
  cartTotal: 0,
});

export const CartProvider = ({ children }) => {
  const { currentUser } = useContext(UserContext);
  const previousUserRef = useRef(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(loadCartItems);
  const [lastAdded, setLastAdded] = useState(null);

  useEffect(() => {
    saveCartItems(cartItems);
  }, [cartItems]);

  useEffect(() => {
    if (previousUserRef.current && !currentUser) {
      setCartItems([]);
      setIsCartOpen(false);
      setLastAdded(null);
    }

    previousUserRef.current = currentUser;
  }, [currentUser]);

  const cartCount = cartItems.reduce(
    (total, cartItem) => total + cartItem.quantity,
    0
  );

  const cartTotal = cartItems.reduce(
    (total, cartItem) => total + cartItem.quantity * cartItem.price,
    0
  );

  const addItemToCart = (productToAdd, quantity = 1) => {
    setCartItems((items) => addCartItem(items, productToAdd, quantity));
    setLastAdded((previous) => ({
      key: (previous ? previous.key : 0) + 1,
      name: productToAdd.name,
      imageUrl: productToAdd.imageUrl,
      quantity,
    }));
  };

  const increaseItemQuantity = (cartItem) => {
    setCartItems((items) => addCartItem(items, cartItem, 1));
  };

  const removeItemFromCart = (cartItemToRemove) => {
    setCartItems((items) => removeCartItem(items, cartItemToRemove));
  };

  const clearItemFromCart = (cartItemToClear) => {
    setCartItems((items) => clearCartItem(items, cartItemToClear));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const value = {
    isCartOpen,
    setIsCartOpen,
    addItemToCart,
    increaseItemQuantity,
    removeItemFromCart,
    clearItemFromCart,
    clearCart,
    lastAdded,
    cartItems,
    cartCount,
    cartTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
