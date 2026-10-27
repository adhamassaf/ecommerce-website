# CRWN Clothing (ecommerce-website) - ملاحظات المشروع

## التشغيل
- `npm install` ثم `npm start` ثم `localhost:3000`
- ملف `.env` في الجذر (متغيرات REACT_APP_FIREBASE_*)، وأي تعديل عليه يحتاج إعادة تشغيل `npm start`
- ملف `.env` مضاف إلى `.gitignore`

## التقنيات
- React 18 (createRoot) + react-router-dom 6 + Firebase 9 (Auth + Firestore) + SCSS (CRA / react-scripts 5.0.1)
- styled-components مثبّت لكنه غير مستخدم حالياً

## الهيكل (src)
- components: toast, button, cart-dropdown, cart-icon, cart-item, category-preview, checkout-item, directory, directory-item, form-input, product-card, sign-in-form, sign-up-form, spinner, status-message, announcement-bar, admin-field
- contexts: user (مع isAdmin وisAuthReady)، categories (categories + categoriesMap + isLoading + error + refreshCategories)، cart (مع حفظ في localStorage)
- routes: authentication, categories-preview, category, checkout, home, navigation, product-details, shop, admin, admin-overview, admin-categories, admin-products, admin-users, admin-settings
- utils/firebase/firebase.utils.js, slugify.js, is-valid-url.js, admin-errors.js, category-defaults.js
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

## لوحة التحكم (/admin)
- الصفحات: نظرة عامة، الأقسام، المنتجات، المستخدمون، إعدادات الموقع (شريط إعلان أعلى المتجر)
- الواجهة عربية RTL، وكل أنماطها في routes/admin/admin.styles.scss
- الصلاحية: وثيقة admins/{uid} في Firestore (المعرّف هو uid الحساب، والمحتوى أي حقل مثل role: 'admin')، تُنشأ يدوياً من Firebase Console فقط، والقواعد تمنع إنشاءها من المتصفح
- الصفحة /admin تحوّل غير المسجّل إلى /auth، وتعرض رسالة رفض لغير المدير، ويظهر رابط ADMIN في الشريط العلوي للمدير فقط
- الأقسام: معرّف الوثيقة (slug) هو مفتاح الرابط /shop/:category، ولا يمكن تغيير اسم القسم بعد إنشائه، وحقل order اختياري (الأقسام الأساسية تحتل 0 إلى 4)، وحقل imageUrl لصورة القسم في الصفحة الرئيسية
- المنتجات: تُخزَّن داخل مصفوفة items في وثيقة القسم، والمعرّف الجديد = أكبر معرّف موجود + 1 (فريد على مستوى كل الأقسام لأن السلة تعتمد على id)، والإضافة والنقل بين الأقسام والحذف تتم داخل transaction
- الصور بالروابط فقط (لا رفع ملفات حالياً)
- الصفحة الرئيسية صارت تقرأ الأقسام من Firestore بدل القائمة الثابتة، وبطاقة القسم صارت تفتح /shop/:category
- إعدادات الموقع في settings/site: announcementEnabled وannouncementText

## تفعيل لوحة التحكم (خطوات لمرة واحدة)
1. نشر القواعد: Firebase Console > Firestore > Rules، ألصق محتوى firestore.rules ثم Publish
2. سجّل الدخول في الموقع بحسابك، ثم انسخ UID حسابك من Authentication > Users
3. Firestore > Start collection باسم admins > Document ID = الـ UID، وأضف حقلاً واحداً مثل role (string) = admin
4. حدّث الموقع، سيظهر رابط ADMIN

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
- addCollectionAndDocuments لن تعمل من المتصفح إلا لحساب مدير (الكتابة على categories مقصورة على admins)

## الخطوات التالية المقترحة
1. الدفع عبر Stripe (يحتاج خادماً صغيراً مثل Firebase Functions)
2. صفحة طلبات في لوحة التحكم (بعد Stripe)
3. رفع صور المنتجات عبر Firebase Storage بدل الروابط
4. تحسينات اختيارية: ترقيم الصفحات، المفضلة، تحويل رسالة خطأ sign-up إلى واجهة
