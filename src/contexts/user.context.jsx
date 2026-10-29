import { createContext, useState, useEffect, useCallback } from 'react';

import {
  onAuthStateChangedListener,
  createUserDocumentFromAuth,
  checkIsAdmin,
  getUserProfile,
  signOutUser,
} from '../utils/firebase/firebase.utils.js';

export const UserContext = createContext({
  setCurrentUser: () => null,
  currentUser: null,
  userProfile: null,
  isAdmin: false,
  isAuthReady: false,
  refreshUserProfile: async () => {},
});

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const refreshUserProfile = useCallback(async (uid) => {
    const targetUid = uid || (currentUser && currentUser.uid);

    if (!targetUid) {
      setUserProfile(null);
      return null;
    }

    try {
      const profile = await getUserProfile(targetUid);

      if (profile) {
        setUserProfile(profile);
        return profile;
      }

      const fallback = {
        uid: targetUid,
        email: (currentUser && currentUser.email) || '',
        displayName: (currentUser && currentUser.displayName) || '',
        photoURL: (currentUser && currentUser.photoURL) || '',
        phone: '',
      };

      setUserProfile(fallback);
      return fallback;
    } catch {
      setUserProfile(null);
      return null;
    }
  }, [currentUser]);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = onAuthStateChangedListener(async (user) => {
      setIsAuthReady(false);

      if (user) {
        await createUserDocumentFromAuth(user);
      }

      if (!isActive) return;

      setCurrentUser(user);

      const adminStatus = user ? await checkIsAdmin(user.uid) : false;

      if (!isActive) return;

      setIsAdmin(adminStatus);

      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (!isActive) return;

          if (profile && profile.disabled) {
            await signOutUser();
            if (!isActive) return;
            setCurrentUser(null);
            setIsAdmin(false);
            setUserProfile(null);
            if (isActive) setIsAuthReady(true);
            return;
          }

          if (profile) {
            setUserProfile(profile);
          } else {
            setUserProfile({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              phone: '',
              disabled: false,
            });
          }
        } catch {
          if (isActive) {
            setUserProfile({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              phone: '',
              disabled: false,
            });
          }
        }
      } else {
        setUserProfile(null);
      }

      if (isActive) setIsAuthReady(true);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    setCurrentUser,
    userProfile,
    isAdmin,
    isAuthReady,
    refreshUserProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
