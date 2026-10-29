import emailjs from '@emailjs/browser';

const serviceId = (process.env.REACT_APP_EMAILJS_SERVICE_ID || '').trim();
const templateId = (process.env.REACT_APP_EMAILJS_TEMPLATE_ID || '').trim();
const publicKey = (process.env.REACT_APP_EMAILJS_PUBLIC_KEY || '').trim();

export const isEmailJsConfigured = () =>
  Boolean(serviceId && templateId && publicKey);

export const getEmailJsConfigStatus = () => ({
  serviceId: Boolean(serviceId),
  templateId: Boolean(templateId),
  publicKey: Boolean(publicKey),
  serviceIdValue: serviceId ? `${serviceId.slice(0, 8)}…` : '',
  templateIdValue: templateId || '',
});

export const sendContactReplyEmail = async ({
  toEmail,
  toName,
  subject,
  originalMessage,
  replyText,
}) => {
  if (!isEmailJsConfigured()) {
    const error = new Error('emailjs-not-configured');
    error.code = 'emailjs-not-configured';
    throw error;
  }

  try {
    const result = await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: toEmail,
        to_name: toName || toEmail,
        subject: subject || 'Reply',
        message: originalMessage || '',
        reply_message: replyText || '',
        from_name: 'CRWN Clothing',
      },
      {
        publicKey,
      }
    );
    return result;
  } catch (err) {
    const detail =
      err?.text ||
      err?.message ||
      (typeof err === 'string' ? err : 'EmailJS send failed');
    const error = new Error(detail);
    error.code = 'emailjs-send-failed';
    error.original = err;
    throw error;
  }
};
