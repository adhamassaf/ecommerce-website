import { useState, useEffect } from 'react';

import { getSiteSettings } from '../../utils/firebase/firebase.utils.js';

import './announcement-bar.styles.scss';

const AnnouncementBar = () => {
  const [text, setText] = useState('');

  useEffect(() => {
    let isActive = true;

    getSiteSettings()
      .then((settings) => {
        if (isActive && settings.announcementEnabled && settings.announcementText) {
          setText(settings.announcementText);
        }
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, []);

  if (!text) return null;

  return (
    <div className='announcement-bar' role='status'>
      {text}
    </div>
  );
};

export default AnnouncementBar;
