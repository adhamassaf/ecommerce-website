import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { UserProvider } from './contexts/user.context.jsx';
import { CategoriesProvider } from './contexts/categories.context.jsx';
import { CartProvider } from './contexts/cart.context.jsx';
import { LanguageProvider } from './contexts/language.context.jsx';
import { ThemeProvider } from './contexts/theme.context.jsx';

import './index.scss';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <UserProvider>
            <CategoriesProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </CategoriesProvider>
          </UserProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
