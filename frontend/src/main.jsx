import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css'
import App from './App.jsx'
import Root from './Route/Root.jsx';
import ErrorBoundary from './Components/ErrorBoundary.jsx';
import Home from './Pages/Home/Home.jsx';
import Vendors from './Pages/Vendors/Vendors.jsx';
import ConnectWithUs from './Pages/ConnectWithUs/ConnectWithUs.jsx';
import VendorProfile from './Pages/Vendors/VendorProfile.jsx';
import VendorProfilePublic from './Pages/Vendors/VendorProfilePublic.jsx';
import SuperAdminDashboard from './Pages/Dashboard/SuperAdminDashboard.jsx';
import AdminDashboard from './Pages/Dashboard/AdminDashboard.jsx';
import VendorDashboard from './Pages/Dashboard/VendorDashboard.jsx';
import UserDashboard from './Pages/Dashboard/UserDashboard.jsx';
import ProtectedRoute from './Components/ProtectedRoute.jsx';
import VerifyEmail from './Pages/Auth/VerifyEmail.jsx';
import ForgotPassword from './Pages/Auth/ForgotPassword.jsx';
import ResetPassword from './Pages/Auth/ResetPassword.jsx';
import Contact from './Pages/Contact/Contact.jsx';
import Services from './Pages/Services/Services.jsx';
import ServiceDetails from './Pages/Services/ServiceDetails.jsx';
import ServiceDetail from './Pages/Services/ServiceDetail.jsx';
import ServiceForm from './Pages/Services/ServiceForm.jsx';
import Favorites from './Pages/Favorites/Favorites.jsx';
import PaymentSuccess from './Pages/Payment/PaymentSuccess.jsx';
import PaymentFailed from './Pages/Payment/PaymentFailed.jsx';
import PaymentCancelled from './Pages/Payment/PaymentCancelled.jsx';
import About from './Pages/About/About.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root/>,
    children:[
      {
        path: "/",
        element:<Home/>
      },
      {
        path: "/vendor",
        element:<Vendors/>
      },
      {
        path: "/vendor/:id",
        element: <VendorProfile/>
      },
      {
        path: "/vendors/:id",
        element: <VendorProfilePublic/>
      },
      {
        path: "/services",
        element: <Services/>
      },
      {
        path: "/services/:serviceId",
        element: <ServiceDetail/>
      },
      {
        path: "/service/:vendorId/:serviceId",
        element: <ServiceDetails/>
      },
      {
        path: "/connectWithUs",
        element:<ConnectWithUs/>
      },
      {
        path: "/contact",
        element:<Contact/>
      },
      {
        path:"/about",
        element:<About/>
      },
      {
        path: "/login",
        element: <Home/>
      },
      {
        path: "/signup",
        element: <Home/>
      },
      {
        path: "/verify-email",
        element: <VerifyEmail/>
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword/>
      },
      {
        path: "/reset-password",
        element: <ResetPassword/>
      },
      {
        path: "/favorites",
        element: (
          <ProtectedRoute allowedRoles={['user']}>
            <Favorites />
          </ProtectedRoute>
        )
      },
      {
        path: "/payment/success",
        element: <PaymentSuccess />
      },
      {
        path: "/payment/failed",
        element: <PaymentFailed />
      },
      {
        path: "/payment/cancelled",
        element: <PaymentCancelled />
      }
    ]
  },
  {
    path: "/super-admin",
    element: (
      <ProtectedRoute allowedRoles={['super_admin']}>
        <SuperAdminDashboard/>
      </ProtectedRoute>
    )
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminDashboard/>
      </ProtectedRoute>
    )
  },
  {
    path: "/vendor-dashboard",
    element: (
      <ProtectedRoute allowedRoles={['vendor']}>
        <VendorDashboard/>
      </ProtectedRoute>
    )
  },
  {
    path: "/user-dashboard",
    element: (
      <ProtectedRoute allowedRoles={['user']}>
        <UserDashboard/>
      </ProtectedRoute>
    )
  },
  {
    path: "/services/create",
    element: (
      <ProtectedRoute allowedRoles={['vendor']}>
        <ServiceForm/>
      </ProtectedRoute>
    )
  },
  {
    path: "/services/edit/:id",
    element: (
      <ProtectedRoute allowedRoles={['vendor']}>
        <ServiceForm/>
      </ProtectedRoute>
    )
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)
