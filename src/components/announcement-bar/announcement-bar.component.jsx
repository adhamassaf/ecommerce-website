import { useContext, useState, useEffect, useRef, useCallback } from 'react';

import { getSiteSettings } from '../../utils/firebase/firebase.utils.js';
import { LanguageContext } from '../../contexts/language.context.jsx';
import { getLocalized } from '../../utils/i18n.js';

import './announcement-bar.styles.scss';

const AnnouncementBar = () => {
  const { language } = useContext(LanguageContext);
  const [settings, setSettings] = useState(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const measureRef = useRef(null);
  const barRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    const load = () => {
      getSiteSettings()
        .then((data) => {
          if (isActive) setSettings(data || {});
        })
        .catch(() => {
          if (isActive) setSettings(null);
        });
    };

    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);

    return () => {
      isActive = false;
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const text = settings
    ? getLocalized(settings.announcementText, language).trim()
    : '';

  const measure = useCallback(() => {
    const textEl = measureRef.current;
    const barEl = barRef.current;
    if (!textEl || !barEl || !text) {
      setIsOverflowing(false);
      return;
    }

    setIsOverflowing(textEl.scrollWidth > barEl.clientWidth - 32);
  }, [text]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, language]);

  if (!settings || !settings.announcementEnabled || !text) return null;

  if (!isOverflowing) {
    return (
      <div className='announcement-bar is-static' role='status' ref={barRef}>
        <span className='announcement-measure' ref={measureRef}>
          {text}
        </span>
        <span className='announcement-static'>{text}</span>
      </div>
    );
  }

  const track = `${text}   •   ${text}   •   `;

  return (
    <div className='announcement-bar is-marquee' role='status' ref={barRef}>
      <span className='announcement-measure' ref={measureRef}>
        {text}
      </span>
      <div className='announcement-track'>
        <span className='announcement-text'>{track}</span>
        <span className='announcement-text' aria-hidden='true'>
          {track}
        </span>
      </div>
    </div>
  );
};

export default AnnouncementBar;
