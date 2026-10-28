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
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  writeBatch,
  runTransaction,
  getCountFromServer,
  query,
  where,
  getDocs,
  serverTimestamp,
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

export const getAdminIds = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'admins'));
    return new Set(snapshot.docs.map((docSnapshot) => docSnapshot.id));
  } catch (error) {
    return new Set();
  }
};

export const getUserDocuments = async () => {
  const [querySnapshot, adminIds] = await Promise.all([
    getDocs(collection(db, 'users')),
    getAdminIds(),
  ]);

  return querySnapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();

    return {
      id: docSnapshot.id,
      email: data.email || '',
      displayName: data.displayName || '',
      phone: data.phone || '',
      photoURL: data.photoURL || '',
      isAdmin: adminIds.has(docSnapshot.id),
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

const mapOrderDocument = (docSnapshot) => {
  const data = docSnapshot.data();

  return {
    id: docSnapshot.id,
    userId: data.userId || '',
    userEmail: data.userEmail || '',
    userName: data.userName || '',
    items: Array.isArray(data.items) ? data.items : [],
    itemsCount: Number(data.itemsCount) || 0,
    total: Number(data.total) || 0,
    shipping: data.shipping || {},
    paymentMethod: data.paymentMethod || 'cod',
    paymentStatus: data.paymentStatus || 'pending',
    status: data.status || 'pending',
    createdAt:
      data.createdAt && typeof data.createdAt.toDate === 'function'
        ? data.createdAt.toDate()
        : null,
  };
};

const sortOrdersByDate = (orders) =>
  [...orders].sort(
    (a, b) =>
      (b.createdAt ? b.createdAt.getTime() : 0) -
      (a.createdAt ? a.createdAt.getTime() : 0)
  );

export const createOrder = async ({
  user,
  items,
  total,
  shipping,
  paymentMethod,
}) => {
  const docRef = await addDoc(collection(db, 'orders'), {
    userId: user.uid,
    userEmail: user.email || '',
    userName: shipping.fullName,
    items,
    itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
    total,
    shipping,
    paymentMethod,
    paymentStatus: paymentMethod === 'demo-card' ? 'paid-demo' : 'pending',
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getOrderById = async (orderId) => {
  const snapshot = await getDoc(doc(db, 'orders', orderId));

  return snapshot.exists() ? mapOrderDocument(snapshot) : null;
};

export const getUserOrders = async (uid) => {
  const querySnapshot = await getDocs(
    query(collection(db, 'orders'), where('userId', '==', uid))
  );

  return sortOrdersByDate(querySnapshot.docs.map(mapOrderDocument));
};

export const getAllOrders = async () => {
  const querySnapshot = await getDocs(collection(db, 'orders'));

  return sortOrdersByDate(querySnapshot.docs.map(mapOrderDocument));
};

export const updateOrderStatus = async (orderId, status) =>
  updateDoc(doc(db, 'orders', orderId), {
    status,
    updatedAt: serverTimestamp(),
  });

export const getOrdersCount = async () => {
  const snapshot = await getCountFromServer(collection(db, 'orders'));
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
    const { displayName, email, photoURL } = userAuth;
    const createdAt = new Date();

    try {
      await setDoc(
        userDocRef,
        {
          email,
          createdAt,
          ...(displayName ? { displayName } : {}),
          ...(photoURL ? { photoURL } : {}),
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

export const getUserProfile = async (uid) => {
  if (!uid) return null;

  const userDocRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userDocRef);

  if (!snapshot.exists()) return null;

  const data = snapshot.data();

  return {
    uid,
    email: data.email || '',
    displayName: data.displayName || '',
    photoURL: data.photoURL || '',
    phone: data.phone || '',
  };
};

export const updateUserProfile = async (uid, { displayName, phone, photoURL }) => {
  if (!uid) throw new Error('Missing user id');

  const payload = {
    updatedAt: serverTimestamp(),
  };

  if (typeof displayName === 'string') {
    payload.displayName = displayName.trim();
  }

  if (typeof phone === 'string') {
    payload.phone = phone.trim();
  }

  if (typeof photoURL === 'string') {
    payload.photoURL = photoURL;
  }

  await setDoc(doc(db, 'users', uid), payload, { merge: true });

  if (auth.currentUser && auth.currentUser.uid === uid) {
    const authUpdates = {};

    if (typeof displayName === 'string') {
      authUpdates.displayName = displayName.trim() || null;
    }

    if (
      typeof photoURL === 'string' &&
      photoURL &&
      !photoURL.startsWith('data:') &&
      photoURL.length < 2000
    ) {
      authUpdates.photoURL = photoURL;
    }

    if (Object.keys(authUpdates).length > 0) {
      await updateProfile(auth.currentUser, authUpdates);
    }
  }
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });

const compressImageFile = async (file, { maxSize = 320, quality = 0.72 } = {}) => {
  const dataUrl = await readFileAsDataUrl(file);

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not process image'));
    img.src = dataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
};

export const uploadProfilePhoto = async (uid, file) => {
  if (!uid || !file) throw new Error('Missing upload data');

  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }

  const photoURL = await compressImageFile(file);
  await updateUserProfile(uid, { photoURL });

  return photoURL;
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
