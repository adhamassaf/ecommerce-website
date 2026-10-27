import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithRedirect,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  writeBatch,
  runTransaction,
  getCountFromServer,
  query,
  getDocs,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

initializeApp(firebaseConfig);

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const auth = getAuth();

export const signInWithGooglePopup = () =>
  signInWithPopup(auth, googleProvider);

export const signInWithGoogleRedirect = () =>
  signInWithRedirect(auth, googleProvider);

export const db = getFirestore();

export const addCollectionAndDocuments = async (collectionKey, objectsToAdd) => {
  const batch = writeBatch(db);
  const collectionRef = collection(db, collectionKey);

  objectsToAdd.forEach((object) => {
    const docRef = doc(collectionRef, object.title.toLowerCase());
    batch.set(docRef, object);
  });

  await batch.commit();
};

export const getCategoriesAndDocuments = async (collectionKey = 'categories') => {
  const collectionRef = collection(db, collectionKey);
  const q = query(collectionRef);

  const querySnapshot = await getDocs(q);
  const categoryMap = querySnapshot.docs.reduce((acc, docSnapshot) => {
    const { title, items } = docSnapshot.data();
    acc[title.toLowerCase()] = items;
    return acc;
  }, {});

  return categoryMap;
};

export const getCategoryDocuments = async () => {
  const querySnapshot = await getDocs(query(collection(db, 'categories')));

  return querySnapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();

    return {
      id: docSnapshot.id,
      title: data.title || docSnapshot.id,
      imageUrl: data.imageUrl || '',
      order: typeof data.order === 'number' ? data.order : null,
      items: Array.isArray(data.items) ? data.items : [],
    };
  });
};

export const saveCategoryDocument = async (id, data, { isNew = false } = {}) => {
  const docRef = doc(db, 'categories', id);

  await setDoc(docRef, isNew ? { ...data, items: [] } : data, { merge: true });
};

export const deleteCategoryDocument = async (id) =>
  deleteDoc(doc(db, 'categories', id));

export const saveProductToCategory = async ({
  product,
  fromCategoryId,
  toCategoryId,
}) =>
  runTransaction(db, async (transaction) => {
    const toRef = doc(db, 'categories', toCategoryId);
    const isMoving = Boolean(fromCategoryId) && fromCategoryId !== toCategoryId;
    const fromRef = isMoving ? doc(db, 'categories', fromCategoryId) : null;

    const toSnapshot = await transaction.get(toRef);
    const fromSnapshot = fromRef ? await transaction.get(fromRef) : null;

    if (!toSnapshot.exists()) throw new Error('category-not-found');

    const toItems = toSnapshot.data().items || [];

    if (!isMoving) {
      const exists = toItems.some((item) => item.id === product.id);
      const nextItems = exists
        ? toItems.map((item) => (item.id === product.id ? product : item))
        : [...toItems, product];

      transaction.update(toRef, { items: nextItems });
      return;
    }

    transaction.update(toRef, {
      items: [...toItems.filter((item) => item.id !== product.id), product],
    });

    if (fromSnapshot && fromSnapshot.exists()) {
      const fromItems = fromSnapshot.data().items || [];

      transaction.update(fromRef, {
        items: fromItems.filter((item) => item.id !== product.id),
      });
    }
  });

export const removeProductFromCategory = async (categoryId, productId) =>
  runTransaction(db, async (transaction) => {
    const categoryRef = doc(db, 'categories', categoryId);
    const snapshot = await transaction.get(categoryRef);

    if (!snapshot.exists()) return;

    const items = snapshot.data().items || [];

    transaction.update(categoryRef, {
      items: items.filter((item) => item.id !== productId),
    });
  });

export const checkIsAdmin = async (uid) => {
  try {
    const snapshot = await getDoc(doc(db, 'admins', uid));
    return snapshot.exists();
  } catch (error) {
    return false;
  }
};

export const getUserDocuments = async () => {
  const querySnapshot = await getDocs(collection(db, 'users'));

  return querySnapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();

    return {
      id: docSnapshot.id,
      email: data.email || '',
      displayName: data.displayName || '',
      createdAt:
        data.createdAt && typeof data.createdAt.toDate === 'function'
          ? data.createdAt.toDate()
          : null,
    };
  });
};

export const getUsersCount = async () => {
  const snapshot = await getCountFromServer(collection(db, 'users'));
  return snapshot.data().count;
};

export const getSiteSettings = async () => {
  const snapshot = await getDoc(doc(db, 'settings', 'site'));
  return snapshot.exists() ? snapshot.data() : {};
};

export const saveSiteSettings = async (settings) =>
  setDoc(doc(db, 'settings', 'site'), settings, { merge: true });

export const createUserDocumentFromAuth = async (
  userAuth,
  additionalInformation = {}
) => {
  if (!userAuth) return;

  const userDocRef = doc(db, 'users', userAuth.uid);

  const userSnapshot = await getDoc(userDocRef);

  if (!userSnapshot.exists()) {
    const { displayName, email } = userAuth;
    const createdAt = new Date();

    try {
      await setDoc(
        userDocRef,
        {
          email,
          createdAt,
          ...(displayName ? { displayName } : {}),
          ...additionalInformation,
        },
        { merge: true }
      );
    } catch (error) {
      console.log('error creating the user', error.message);
    }
  } else if (additionalInformation.displayName) {
    try {
      await setDoc(
        userDocRef,
        { displayName: additionalInformation.displayName },
        { merge: true }
      );
    } catch (error) {
      console.log('error updating the user', error.message);
    }
  }

  return userDocRef;
};

export const createAuthUserWithEmailAndPassword = async (email, password) => {
  if (!email || !password) return;

  return await createUserWithEmailAndPassword(auth, email, password);
};

export const signInAuthUserWithEmailAndPassword = async (email, password) => {
  if (!email || !password) return;

  return await signInWithEmailAndPassword(auth, email, password);
};

export const signOutUser = async () => await signOut(auth);

export const onAuthStateChangedListener = (callback) =>
  onAuthStateChanged(auth, callback);
