/**
 * Translates Firebase Authentication error codes and raw messages
 * into clear, user-friendly Arabic explanations with helpful guidance.
 */
export function getFriendlyAuthError(errorCode, rawMessage = '') {
  let code = errorCode || '';

  if (!code && rawMessage) {
    if (rawMessage.includes('invalid-credential')) code = 'auth/invalid-credential';
    else if (rawMessage.includes('user-not-found')) code = 'auth/user-not-found';
    else if (rawMessage.includes('wrong-password')) code = 'auth/wrong-password';
    else if (rawMessage.includes('email-already-in-use')) code = 'auth/email-already-in-use';
    else if (rawMessage.includes('weak-password')) code = 'auth/weak-password';
    else if (rawMessage.includes('invalid-email')) code = 'auth/invalid-email';
    else if (rawMessage.includes('network-request-failed')) code = 'auth/network-request-failed';
    else if (rawMessage.includes('popup-closed-by-user')) code = 'auth/popup-closed-by-user';
    else if (rawMessage.includes('popup-blocked')) code = 'auth/popup-blocked';
    else if (rawMessage.includes('operation-not-allowed')) code = 'auth/operation-not-allowed';
    else if (rawMessage.includes('unauthorized-domain')) code = 'auth/unauthorized-domain';
    else if (rawMessage.includes('too-many-requests')) code = 'auth/too-many-requests';
  }

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. إذا كنت مستخدماً جديداً، يرجى الضغط على "إنشاء حساب جديد" بالأسفل.';
    case 'auth/user-not-found':
      return 'لا يوجد حساب مسجل بهذا البريد الإلكتروني. يمكنك إنشاء حساب جديد بالضغط أدناه.';
    case 'auth/email-already-in-use':
      return 'هذا البريد الإلكتروني مسجل مسبقاً! يرجى اختيار "تسجيل الدخول" بدلاً من إنشاء حساب.';
    case 'auth/weak-password':
      return 'كلمة المرور قصيرة أو ضعيفة. يجب ألا تقل عن 6 خانات.';
    case 'auth/invalid-email':
      return 'صيغة البريد الإلكتروني غير صالحة. تأكد من كتابته بالشكل: name@example.com';
    case 'auth/popup-closed-by-user':
      return 'تم إغلاق نافذة تسجيل الدخول بواسطة Google قبل إتمام العملية.';
    case 'auth/popup-blocked':
      return 'قام المتصفح بحظر نافذة Google المنبثقة. يرجى السماح بالنوافذ المنبثقة أو الدخول عبر الحساب التجريبي.';
    case 'auth/operation-not-allowed':
      return 'طريقة تسجيل الدخول بجوجل غير مفعلة حالياً في مشروع Firebase. يمكنك الدخول السريع بالحساب التجريبي فوراً!';
    case 'auth/unauthorized-domain':
      return 'النطاق الحالي غير مصرح له في Firebase. يمكنك استخدام الدخول بالحساب التجريبي للتجربة بكل سهولة.';
    case 'auth/network-request-failed':
      return 'تعذر الاتصال بالخادم بسبب ضعف الإنترنت. يمكنك استخدام الدخول السريع بالحساب التجريبي.';
    case 'auth/too-many-requests':
      return 'محاولات دخول خاطئة متكررة. تم تعليق المحاولات مؤقتاً لحمايتك، يرجى المحاولة بعد قليل.';
    default:
      return 'تعذر تسجيل الدخول في الوقت الحالي. يمكنك استخدام الدخول بالحساب التجريبي بضغطة زر.';
  }
}
