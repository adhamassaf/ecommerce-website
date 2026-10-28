import { useContext, useEffect, useRef, useState } from 'react';

import {
  ThemeContext,
  THEME_PALETTES,
} from '../../contexts/theme.context.jsx';
import { LanguageContext } from '../../contexts/language.context.jsx';

import './theme-controls.styles.scss';

const ThemeControls = () => {
  const { mode, palette, toggleMode, setPalette } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className='theme-controls' ref={rootRef}>
      <button
        type='button'
        className='theme-icon-btn'
        onClick={toggleMode}
        title={mode === 'dark' ? t('lightMode') : t('darkMode')}
        aria-label={mode === 'dark' ? t('lightMode') : t('darkMode')}
      >
        {mode === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className='theme-settings-wrap'>
        <button
          type='button'
          className={`theme-icon-btn${open ? ' active' : ''}`}
          onClick={() => setOpen((current) => !current)}
          title={t('themeSettings')}
          aria-label={t('themeSettings')}
          aria-expanded={open}
        >
          ⚙️
        </button>

        {open && (
          <div className='theme-panel' role='dialog' aria-label={t('themeSettings')}>
            <div className='theme-panel-header'>
              <strong>{t('chooseTheme')}</strong>
              <span>{t('themeHint')}</span>
            </div>

            <div className='theme-palette-grid'>
              {THEME_PALETTES.map((item) => (
                <button
                  key={item.id}
                  type='button'
                  className={`theme-palette-card${
                    palette === item.id ? ' active' : ''
                  }`}
                  onClick={() => setPalette(item.id)}
                >
                  <span className='theme-swatches' aria-hidden='true'>
                    {item.swatch.map((color) => (
                      <i key={color} style={{ background: color }} />
                    ))}
                  </span>
                  <span className='theme-palette-name'>{t(item.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeControls;
