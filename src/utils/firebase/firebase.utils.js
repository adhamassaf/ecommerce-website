import { api, getToken, setToken } from '../api-client.js';

/* Auth state (JWT) */
let authListeners = [];
let currentAuthUser = null;

const notifyAuth = (user) => {
  currentAuthUser = user;
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch {
      /* ignore */
    }
  });
};

export const onAuthStateChangedListener = (callback) => {
  authListeners.push(callback);
  // hydrate
  (async () => {
    const token = getToken();
    if (!token) {
      callback(null);
      return;
    }
    try {
      const data = await api('/auth/me');
      const user = {
        uid: data.user.uid,
        email: data.user.email,
        displayName: data.user.displayName,
        photoURL: data.user.photoURL,
      };
      notifyAuth(user);
    } catch {
      setToken('');
      notifyAuth(null);
    }
  })();
  return () => {
    authListeners = authListeners.filter((cb) => cb !== callback);
  };
};

export const createAuthUserWithEmailAndPassword = async (email, password, displayName = '') => {
  const data = await api('/auth/register', {
    method: 'POST',
    body: { email, password, displayName },
  });
  setToken(data.token);
  const user = {
    uid: data.user.uid,
    email: data.user.email,
    displayName: data.user.displayName,
    photoURL: data.user.photoURL || '',
  };
  notifyAuth(user);
  return { user };
};

export const signInAuthUserWithEmailAndPassword = async (email, password) => {
  const data = await api('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setToken(data.token);
  const user = {
    uid: data.user.uid,
    email: data.user.email,
    displayName: data.user.displayName,
    photoURL: data.user.photoURL || '',
  };
  notifyAuth(user);
  return { user };
};

export const signOutUser = async () => {
  setToken('');
  notifyAuth(null);
};

export const createUserDocumentFromAuth = async () => {
  // no-op: user created on register
  return null;
};

export const checkIsAdmin = async (uid) => {
  try {
    const data = await api('/auth/me');
    return Boolean(data.user?.isAdmin) && (!uid || data.user.uid === uid);
  } catch {
    return false;
  }
};

export const getUserProfile = async (uid) => {
  const data = await api(`/users/${uid}`);
  return data;
};

export const updateUserProfile = async (
  uid,
  { displayName, displayNameAr, phone, photoURL }
) => {
  await api(`/users/${uid}`, {
    method: 'PUT',
    body: { displayName, displayNameAr, phone, photoURL },
  });
};

export const uploadProfilePhoto = async (uid, file) => {
  const { isCloudinaryConfigured, uploadImageToCloudinary } = await import(
    '../cloudinary.js'
  );

  let photoURL = '';
  if (isCloudinaryConfigured()) {
    photoURL = await uploadImageToCloudinary(file, { folder: 'crwn/profiles' });
  } else {
    // Fallback for local demo without Cloudinary: data URL
    photoURL = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  await updateUserProfile(uid, { photoURL });
  return photoURL;
};

/* Categories / products */
export const getCategoriesAndDocuments = async () => {
  const data = await api('/categories');
  return data;
};

export const saveCategoryDocument = async (id, payload) => {
  await api(`/categories/${id}`, { method: 'PUT', body: payload });
};

export const deleteCategoryDocument = async (id) => {
  await api(`/categories/${id}`, { method: 'DELETE' });
};

export const saveProductDocument = async (id, payload) => {
  await api(`/products/${id}`, { method: 'PUT', body: payload });
};

export const deleteProductDocument = async (id) => {
  await api(`/products/${id}`, { method: 'DELETE' });
};

/* Orders */
export const createOrderDocument = async (order) => {
  const data = await api('/orders', {
    method: 'POST',
    body: order,
  });
  return data.id;
};

export const getUserOrders = async (userId) => {
  const data = await api('/orders');
  return Array.isArray(data) ? data : [];
};

export const getOrderById = async (orderId) => {
  return api(`/orders/${orderId}`);
};

export const getAllOrders = async () => {
  return api('/orders');
};

export const updateOrderStatus = async (orderId, status) => {
  await api(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: { status },
  });
};

/* Settings */
export const getSettingsDocument = async (id = 'general') => {
  return api(`/settings/${id}`);
};

export const saveSettingsDocument = async (id, data) => {
  await api(`/settings/${id}`, { method: 'PUT', body: data });
};

/* Contact */
export const submitContactMessage = async (payload) => {
  return api('/contact-messages', { method: 'POST', body: payload });
};

export const getContactMessages = async () => {
  const data = await api('/contact-messages');
  return (data || []).map((m) => ({
    ...m,
    createdAt: m.createdAt ? new Date(m.createdAt) : null,
    repliedAt: m.repliedAt ? new Date(m.repliedAt) : null,
  }));
};

export const updateContactMessageStatus = async (id, status) => {
  await api(`/contact-messages/${id}`, { method: 'PATCH', body: { status } });
};

export const saveContactReply = async (id, replyText) => {
  await api(`/contact-messages/${id}`, {
    method: 'PATCH',
    body: { replyText },
  });
};

export const deleteContactMessage = async (id) => {
  await api(`/contact-messages/${id}`, { method: 'DELETE' });
};

/* Service categories */
export const getServiceCategories = async () => api('/service-categories');
export const saveServiceCategory = async (id, payload) =>
  api(`/service-categories/${id}`, { method: 'PUT', body: payload });
export const deleteServiceCategory = async (id) =>
  api(`/service-categories/${id}`, { method: 'DELETE' });

/* Services */
export const getServices = async () => api('/services');
export const getServiceById = async (id) => api(`/services/${id}`);
export const saveService = async (id, payload) =>
  api(`/services/${id}`, { method: 'PUT', body: payload });
export const deleteService = async (id) =>
  api(`/services/${id}`, { method: 'DELETE' });

/* Workflows */
export const getWorkflows = async () => api('/workflows');
export const getWorkflowById = async (id) => api(`/workflows/${id}`);
export const saveWorkflow = async (id, payload) =>
  api(`/workflows/${id}`, { method: 'PUT', body: payload });
export const deleteWorkflow = async (id) =>
  api(`/workflows/${id}`, { method: 'DELETE' });

/* Applications */
export const createServiceApplication = async (payload) => {
  const data = await api('/service-applications', {
    method: 'POST',
    body: payload,
  });
  return data.id;
};

export const updateServiceApplication = async (id, payload) => {
  await api(`/service-applications/${id}`, {
    method: 'PATCH',
    body: payload,
  });
};

export const getServiceApplication = async (id) => {
  const m = await api(`/service-applications/${id}`);
  return {
    ...m,
    createdAt: m.createdAt ? new Date(m.createdAt) : null,
    updatedAt: m.updatedAt ? new Date(m.updatedAt) : null,
    submittedAt: m.submittedAt ? new Date(m.submittedAt) : null,
  };
};

export const getUserServiceApplications = async () => {
  const data = await api('/service-applications/mine');
  return (data || []).map((m) => ({
    ...m,
    createdAt: m.createdAt ? new Date(m.createdAt) : null,
    updatedAt: m.updatedAt ? new Date(m.updatedAt) : null,
    submittedAt: m.submittedAt ? new Date(m.submittedAt) : null,
  }));
};

/* Google auth stubs — not available in local MySQL mode */
export const signInWithGooglePopup = async () => {
  throw new Error('Google sign-in is disabled in local MySQL mode. Use email/password.');
};

export const getCurrentAuthUser = () => currentAuthUser;


export const getCategoryDocuments = getCategoriesAndDocuments;
export const createOrder = createOrderDocument;
export const getSiteSettings = async () => getSettingsDocument('general');
export const saveSiteSettings = async (data) => saveSettingsDocument('general', data);

export const getUserDocuments = async () => {
  const data = await api('/users');
  return (data || []).map((user) => ({
    ...user,
    createdAt: user.createdAt ? new Date(user.createdAt) : null,
  }));
};

export const setUserAdminRole = async (uid, isAdmin) => {
  await api(`/users/${uid}/admin`, { method: 'PATCH', body: { isAdmin: Boolean(isAdmin) } });
};

export const setUserDisabled = async (uid, disabled) => {
  await api(`/users/${uid}/disabled`, { method: 'PATCH', body: { disabled: Boolean(disabled) } });
};

export const createUserByAdmin = async ({
  email,
  password,
  displayName,
  displayNameAr,
  photoURL,
  isAdmin,
}) => {
  return api('/users', {
    method: 'POST',
    body: { email, password, displayName, displayNameAr, photoURL, isAdmin },
  });
};

export const getUsersCount = async () => {
  const data = await api('/stats');
  return data.users || 0;
};

export const getOrdersCount = async () => {
  const data = await api('/stats');
  return data.orders || 0;
};

export const saveProductToCategory = async (arg, maybePayload) => {
  // Support both legacy (id, payload) and object form used by admin UI
  if (arg && typeof arg === 'object' && arg.product) {
    const { product, toCategoryId, fromCategoryId } = arg;
    const id = String(product.id);
    await saveProductDocument(id, {
      ...product,
      id,
      categoryId: toCategoryId || product.categoryId || '',
    });
    // If moved between categories, old row is same id (PK) so upsert handles it
    return;
  }
  await saveProductDocument(arg, maybePayload);
};

export const removeProductFromCategory = async (categoryIdOrProductId, productId) => {
  // Admin calls: removeProductFromCategory(categoryId, productId)
  const id = productId != null ? productId : categoryIdOrProductId;
  await deleteProductDocument(String(id));
};
