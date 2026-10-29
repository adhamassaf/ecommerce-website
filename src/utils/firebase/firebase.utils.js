import { initializeApp, deleteApp } from 'firebase/app';
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
      disabled: Boolean(data.disabled),
      createdAt:
        data.createdAt && typeof data.createdAt.toDate === 'function'
          ? data.createdAt.toDate()
          : null,
    };
  });
};

export const createUserByAdmin = async ({
  email,
  password,
  displayName = '',
  makeAdmin = false,
}) => {
  const trimmedEmail = String(email || '').trim().toLowerCase();
  const trimmedName = String(displayName || '').trim();
  const trimmedPassword = String(password || '');

  if (!trimmedEmail || !trimmedPassword) {
    throw new Error('missing-fields');
  }

  if (trimmedPassword.length < 6) {
    throw new Error('weak-password');
  }

  const secondaryApp = initializeApp(firebaseConfig, `admin-create-${Date.now()}`);

  try {
    const secondaryAuth = getAuth(secondaryApp);
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      trimmedEmail,
      trimmedPassword
    );
    const { user } = credential;

    if (trimmedName) {
      await updateProfile(user, { displayName: trimmedName });
    }

    await setDoc(
      doc(db, 'users', user.uid),
      {
        email: trimmedEmail,
        displayName: trimmedName,
        phone: '',
        photoURL: '',
        disabled: false,
        createdAt: serverTimestamp(),
        createdByAdmin: true,
      },
      { merge: true }
    );

    if (makeAdmin) {
      await setDoc(doc(db, 'admins', user.uid), {
        role: 'admin',
        createdAt: serverTimestamp(),
      });
    }

    await signOut(secondaryAuth);

    return {
      id: user.uid,
      email: trimmedEmail,
      displayName: trimmedName,
      phone: '',
      photoURL: '',
      isAdmin: Boolean(makeAdmin),
      disabled: false,
      createdAt: new Date(),
    };
  } finally {
    await deleteApp(secondaryApp);
  }
};

export const setUserDisabled = async (uid, disabled) => {
  if (!uid) throw new Error('Missing user id');

  await setDoc(
    doc(db, 'users', uid),
    {
      disabled: Boolean(disabled),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const setUserAdminRole = async (uid, isAdmin) => {
  if (!uid) throw new Error('Missing user id');

  const adminRef = doc(db, 'admins', uid);

  if (isAdmin) {
    await setDoc(adminRef, {
      role: 'admin',
      updatedAt: serverTimestamp(),
    });
  } else {
    await deleteDoc(adminRef);
  }
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

export const submitContactMessage = async (payload) => {
  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const phone = String(payload.phone || '').trim();
  const subject = String(payload.subject || '').trim();
  const message = String(payload.message || '').trim();
  const customValues = Array.isArray(payload.customValues)
    ? payload.customValues
        .map((item) => ({
          id: String(item.id || ''),
          label: String(item.label || '').trim().slice(0, 120),
          value: String(item.value || '').trim().slice(0, 1000),
        }))
        .filter((item) => item.id)
        .slice(0, 20)
    : [];

  if (!name || !email || !subject || !message) {
    throw new Error('missing-fields');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('invalid-email');
  }

  if (name.length > 100 || subject.length > 150 || message.length > 2000) {
    throw new Error('too-long');
  }

  const docRef = await addDoc(collection(db, 'contactMessages'), {
    name,
    email,
    phone,
    subject,
    message,
    customValues,
    status: 'new',
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getContactMessages = async () => {
  const snapshot = await getDocs(collection(db, 'contactMessages'));

  return snapshot.docs
    .map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        subject: data.subject || '',
        message: data.message || '',
        customValues: Array.isArray(data.customValues)
          ? data.customValues.map((item) => ({
              id: item.id || '',
              label: item.label || '',
              value: item.value || '',
            }))
          : [],
        status: data.status === 'read' ? 'read' : 'new',
        createdAt:
          data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate()
            : null,
      };
    })
    .sort(
      (a, b) =>
        (b.createdAt ? b.createdAt.getTime() : 0) -
        (a.createdAt ? a.createdAt.getTime() : 0)
    );
};

export const updateContactMessageStatus = async (id, status) => {
  if (!id) throw new Error('Missing message id');
  await updateDoc(doc(db, 'contactMessages', id), {
    status: status === 'read' ? 'read' : 'new',
    updatedAt: serverTimestamp(),
  });
};

export const deleteContactMessage = async (id) => {
  if (!id) throw new Error('Missing message id');
  await deleteDoc(doc(db, 'contactMessages', id));
};

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
    disabled: Boolean(data.disabled),
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
