import { createContext, useState, useEffect } from 'react';

const CART_STORAGE_KEY = 'cartItems';

const loadCartItems = () => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
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
  lastAdded: null,
  cartCount: 0,
  cartTotal: 0,
});

export const CartProvider = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState(loadCartItems);
  const [lastAdded, setLastAdded] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      return;
    }
  }, [cartItems]);

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

  const value = {
    isCartOpen,
    setIsCartOpen,
    addItemToCart,
    increaseItemQuantity,
    removeItemFromCart,
    clearItemFromCart,
    lastAdded,
    cartItems,
    cartCount,
    cartTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
