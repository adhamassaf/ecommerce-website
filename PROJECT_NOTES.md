# CRWN Clothing (ecommerce-website) - ملاحظات المشروع

## التشغيل
- `npm install` ثم `npm start` ثم `localhost:3000`
- ملف `.env` في الجذر (متغيرات REACT_APP_FIREBASE_*)، وأي تعديل عليه يحتاج إعادة تشغيل `npm start`
- ملف `.env` مضاف إلى `.gitignore`

## التقنيات
- React 18 (createRoot) + react-router-dom 6 + Firebase 9 (Auth + Firestore) + SCSS (CRA / react-scripts 5.0.1)
- styled-components مثبّت لكنه غير مستخدم حالياً

## الهيكل (src)
- components: toast, button, cart-dropdown, cart-icon, cart-item, category-preview, checkout-item, directory, directory-item, form-input, product-card, sign-in-form, sign-up-form, spinner, status-message
- contexts: user, categories (categoriesMap + isLoading + error)، cart (مع حفظ في localStorage)
- routes: authentication, categories-preview, category, checkout, home, navigation, product-details, shop
- utils/firebase/firebase.utils.js
- shop-data.js (بيانات المنتجات الأصلية، مرفوعة مسبقاً إلى Firestore)

## ما تم إنجازه
- توحيد اسم الدالة removeItemFromCart، وحذف الـ console.log التطويرية، وإصلاح بارامترات getCategoriesAndDocuments / addCollectionAndDocuments
- إغلاق قائمة السلة عند النقر خارجها أو بالضغط على Esc أو بعد CHECKOUT، وإظهار رسالة السلة الفارغة
- معالجة أخطاء تسجيل الدخول (إغلاق نافذة جوجل لا يسبب خطأ، وتظهر رسائل مفهومة للمستخدم)
- تحويل المستخدم المسجّل من /auth إلى الرئيسية
- حفظ السلة في localStorage
- مؤشر تحميل ورسائل خطأ / "Category not found" في صفحات الـ shop
- الانتقال من ReactDOM.render إلى createRoot
- إصلاح تحذير manifest: أيقونة favicon.svg بدل ملفات PNG المفقودة، وعنوان الصفحة CRWN Clothing
- صفحة تفاصيل المنتج: المسار /shop/:category/:productId (صورة، سعر، اختيار الكمية، إضافة للسلة، منتجات مشابهة)، وبطاقة المنتج صارت رابطاً لها
- addItemToCart(product, quantity = 1) في cart.context، وتحديثات السلة بصيغة دالة (functional setState)
- إشعار (Toast) أسفل الشاشة عند الإضافة للسلة ونبضة على أيقونة السلة؛ cart.context يوفّر lastAdded وincreaseItemQuantity (زيادة صامتة تستخدمها صفحة checkout)
- البحث والفلترة والفرز: بحث بالاسم (وبالفئة في /shop)، فرز (السعر والاسم)، حد أدنى وأعلى للسعر؛ تُحفظ في رابط الصفحة (?q=&sort=&min=&max=) عبر hooks/use-product-filters.js، والمنطق في utils/product-filters.js، والواجهة في components/product-filters و components/no-results
- نقل إعدادات Firebase إلى .env
- قواعد Firestore في firestore.rules: categories قراءة فقط، وusers لصاحب الوثيقة فقط

## تسجيل الدخول بجوجل (إعداد خارجي)
- المشكلة السابقة: Error 401 deleted_client
- الحل: عميل OAuth جديد (Web application) في Google Cloud لمشروع crwn-eco-db، وربطه في Firebase: Authentication > Sign-in method > Google > Web SDK configuration (Web client ID + secret)
- JavaScript origins: http://localhost:3000 و https://crwn-eco-db.firebaseapp.com
- Redirect URI: https://crwn-eco-db.firebaseapp.com/__/auth/handler
- عند النشر على نطاق جديد: أضفه في Authorized domains (Firebase) وفي JavaScript origins (Google Cloud)
- الـ client secret لا يُحفظ في أي ملف في المشروع

## ملاحظات
- أخطاء Cross-Origin-Opener-Policy في Console عند نافذة جوجل المنبثقة غير مؤثرة
- مجموعة collections في Firestore غير مستخدمة (يمكن حذفها لاحقاً)
- addCollectionAndDocuments لن تعمل من المتصفح بعد القواعد الجديدة (الكتابة على categories ممنوعة)

## الخطوات التالية المقترحة
1. الدفع عبر Stripe (يحتاج خادماً صغيراً مثل Firebase Functions)
2. تحسينات اختيارية: ترقيم الصفحات، المفضلة، تحويل رسالة خطأ sign-up إلى واجهة (يحتاج خادماً صغيراً مثل Firebase Functions)
