export const getAdminErrorMessage = (error) => {
  if (error && error.code === 'permission-denied') {
    return 'ليس لديك صلاحية لتنفيذ هذه العملية. تأكد من نشر قواعد Firestore ومن إضافة حسابك إلى مجموعة admins.';
  }

  if (error && error.code === 'unavailable') {
    return 'تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت.';
  }

  if (error && error.message === 'category-not-found') {
    return 'القسم المحدد غير موجود، حدّث الصفحة وحاول مرة أخرى.';
  }

  return 'حدث خطأ غير متوقع، حاول مرة أخرى.';
};
