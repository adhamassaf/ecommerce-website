import { useEffect, useState } from 'react';
import { getPageCovers } from '../utils/firebase/firebase.utils.js';
import { normalizeLocaleValue } from '../utils/i18n.js';

const DEFAULTS = {
  about: { en: 'About us', ar: 'من نحن' },
  contact: { en: 'Contact us', ar: 'تواصل معنا' },
  shop: { en: 'Shop', ar: 'المتجر' },
  services: { en: 'Services', ar: 'الخدمات' },
  orders: { en: 'My orders', ar: 'طلباتي' },
};

export const usePageCover = (pageKey) => {
  const [cover, setCover] = useState({
    title: normalizeLocaleValue(DEFAULTS[pageKey] || { en: '', ar: '' }),
    imageUrl: '',
    isLoading: true,
  });

  useEffect(() => {
    let active = true;
    getPageCovers()
      .then((doc) => {
        if (!active) return;
        const item = (doc && doc[pageKey]) || {};
        const title = normalizeLocaleValue(
          item.title,
          (DEFAULTS[pageKey] && DEFAULTS[pageKey].en) || ''
        );
        if (!title.ar && DEFAULTS[pageKey]) title.ar = DEFAULTS[pageKey].ar;
        setCover({
          title,
          imageUrl: item.imageUrl || '',
          isLoading: false,
        });
      })
      .catch(() => {
        if (active) {
          setCover((prev) => ({ ...prev, isLoading: false }));
        }
      });
    return () => {
      active = false;
    };
  }, [pageKey]);

  return cover;
};
