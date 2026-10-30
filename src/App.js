import { Routes, Route } from 'react-router-dom';

import Home from './routes/home/home.component.jsx';
import Navigation from './routes/navigation/navigation.component.jsx';
import Authentication from './routes/authentication/authentication.component.jsx';
import Shop from './routes/shop/shop.component.jsx';
import Checkout from './routes/checkout/checkout.component.jsx';
import Orders from './routes/orders/orders.component.jsx';
import OrderDetails from './routes/order-details/order-details.component.jsx';
import Profile from './routes/profile/profile.component.jsx';
import Contact from './routes/contact/contact.component.jsx';
import Admin from './routes/admin/admin.component.jsx';
import AdminOverview from './routes/admin-overview/admin-overview.component.jsx';
import AdminCategories from './routes/admin-categories/admin-categories.component.jsx';
import AdminProducts from './routes/admin-products/admin-products.component.jsx';
import AdminOrders from './routes/admin-orders/admin-orders.component.jsx';
import AdminUsers from './routes/admin-users/admin-users.component.jsx';
import AdminMessages from './routes/admin-messages/admin-messages.component.jsx';
import AdminSettings from './routes/admin-settings/admin-settings.component.jsx';
import AdminServiceCategories from './routes/admin-service-categories/admin-service-categories.component.jsx';
import AdminServices from './routes/admin-services/admin-services.component.jsx';
import Services from './routes/services/services.component.jsx';
import ServiceDetails from './routes/service-details/service-details.component.jsx';

const App = () => {
  return (
    <Routes>
      <Route path='/' element={<Navigation />}>
        <Route index element={<Home />} />
        <Route path='shop/*' element={<Shop />} />
        <Route path='auth' element={<Authentication />} />
        <Route path='checkout' element={<Checkout />} />
        <Route path='orders' element={<Orders />} />
        <Route path='orders/:orderId' element={<OrderDetails />} />
        <Route path='profile' element={<Profile />} />
        <Route path='contactUs' element={<Contact />} />
        <Route path='services' element={<Services />} />
        <Route path='services/:serviceId' element={<ServiceDetails />} />
        <Route path='admin' element={<Admin />}>
          <Route index element={<AdminOverview />} />
          <Route path='categories' element={<AdminCategories />} />
          <Route path='products' element={<AdminProducts />} />
          <Route path='orders' element={<AdminOrders />} />
          <Route path='users' element={<AdminUsers />} />
          <Route path='messages' element={<AdminMessages />} />
          <Route path='service-categories' element={<AdminServiceCategories />} />
          <Route path='services' element={<AdminServices />} />
          <Route path='settings' element={<AdminSettings />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
