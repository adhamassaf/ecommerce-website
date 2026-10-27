import { createContext, useState, useEffect } from 'react';

import {
  onAuthStateChangedListener,
  createUserDocumentFromAuth,
  checkIsAdmin,
} from '../utils/firebase/firebase.utils.js';

export const UserContext = createContext({
  setCurrentUser: () => null,
  currentUser: null,
  isAdmin: false,
  isAuthReady: false,
});

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const value = { currentUser, setCurrentUser, isAdmin, isAuthReady };

  useEffect(() => {
    let isActive = true;

    const unsubscribe = onAuthStateChangedListener(async (user) => {
      setIsAuthReady(false);

      if (user) {
        createUserDocumentFromAuth(user);
      }

      setCurrentUser(user);

      const adminStatus = user ? await checkIsAdmin(user.uid) : false;

      if (!isActive) return;

      setIsAdmin(adminStatus);
      setIsAuthReady(true);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
