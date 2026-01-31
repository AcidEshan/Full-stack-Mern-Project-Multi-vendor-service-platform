import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../../Images/Logo.PNG'
import { IoSearchSharp } from "react-icons/io5";
import { FaUserAlt, FaSignOutAlt, FaUserCircle, FaHeart } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FaFacebookF } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";
import useAuthStore from '../store/authStore';
import LoginModal from '../Pages/Auth/LoginModal';
import SignupModal from '../Pages/Auth/SignupModal';
import NotificationBell from './Shared/NotificationBell';

const Navbar = ({ onShowEmailVerification }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const openLoginModal = () => {
    setShowLoginModal(true);
    setShowSignupModal(false);
  };

  const openSignupModal = () => {
    setShowSignupModal(true);
    setShowLoginModal(false);
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleDashboardNavigate = () => {
    if (user?.role === 'super_admin') {
      navigate('/super-admin');
    } else if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'vendor') {
      navigate('/vendor-dashboard');
    } else {
      navigate('/user-dashboard');
    }
  };

  return (
    <div>
      <div className="navbar bg-base-200 shadow-sm px-20 relative z-5">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
            </div>
            <ul
              tabIndex="-1"
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
              <li><NavLink to='/'>Home</NavLink></li>
              <li><NavLink to='/services'>Services</NavLink></li>
              <li><NavLink to='/vendor'>Vendors</NavLink></li>
              <li><NavLink to='/contact'>Contact Us</NavLink></li>
              {isAuthenticated && user?.role === 'user' && (
                <li><NavLink to='/user-dashboard'>Dashboard</NavLink></li>
              )}
            </ul>
          </div>
          <NavLink to='/'>
            <img className='h-19 w-50' src={logo} alt="Logo"></img>
          </NavLink>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1  text-xl font-semibold text-[#1B4B36]">
            <li><NavLink to='/' className="relative
        after:content-['']
        after:absolute
        after:left-0
        after:-bottom-0.5
        after:h-[2px]
        after:w-0
        hover:after:w-full
        after:bg-[#1B4B36] after:transition-all after:duration-700">HOME</NavLink></li>
            <li><NavLink to='/services' className="relative
        after:content-['']
        after:absolute
        after:left-0
        after:-bottom-0.5
        after:h-[2px]
        after:w-0
        hover:after:w-full
        after:bg-[#1B4B36] after:transition-all after:duration-700">SERVICES</NavLink></li>
            <li><NavLink to='/vendor' className="relative
        after:content-['']
        after:absolute
        after:left-0
        after:-bottom-0.5
        after:h-[2px]
        after:w-0
        hover:after:w-full
        after:bg-[#1B4B36] after:transition-all after:duration-700">VENDORS</NavLink></li>
            <li><NavLink to='/contact' className="relative
        after:content-['']
        after:absolute
        after:left-0
        after:-bottom-0.5
        after:h-[2px]
        after:w-0
        hover:after:w-full
        after:bg-[#1B4B36] after:transition-all after:duration-700">CONTACT US</NavLink></li>
            {isAuthenticated && user?.role === 'user' && (
              <li><NavLink to='/user-dashboard' className="relative
        after:content-['']
        after:absolute
        after:left-0
        after:-bottom-0.5
        after:h-[2px]
        after:w-0
        hover:after:w-full
        after:bg-[#1B4B36] after:transition-all after:duration-700">DASHBOARD</NavLink></li>
            )}
          </ul>
        </div>
        <div className="navbar-end">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              {/* Notification Bell - For all authenticated users */}
              <NotificationBell />
              
              {/* Verify Email Button - Only show for users with unverified email */}
              {user.role === 'user' && !user.isEmailVerified && (
                <button
                  onClick={onShowEmailVerification}
                  className="btn btn-sm bg-yellow-500 hover:bg-yellow-600 text-white border-none gap-1"
                  title="Verify your email"
                >
                  <MdEmail size={16} />
                  Verify Email
                </button>
              )}
              
              {/* Profile Dropdown */}
              <div className="dropdown dropdown-bottom dropdown-end">
                <div tabIndex={0} role="button" className="flex items-center gap-2">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-[#1B4B36]">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                  </div>
                  {user.profileImage ? (
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full ring ring-[#1B4B36] ring-offset-base-100 ring-offset-2">
                        <img src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} />
                      </div>
                    </div>
                  ) : (
                    <p className='btn m-1 text-lg py-6 rounded-full bg-[#1B4B36] text-yellow-500'><FaUserAlt /></p>
                  )}
                </div>
                <ul tabIndex="-1" className="dropdown-content menu bg-base-100 rounded-box z-1 w-60 p-2 shadow-sm text-xl font-semibold">
                  <li><a onClick={handleDashboardNavigate}><FaUserCircle /> Dashboard</a></li>
                  <li><a onClick={handleLogout}><FaSignOutAlt /> Logout</a></li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="dropdown dropdown-bottom dropdown-end">
              <div tabIndex={0} role="button" className="">
                <p className='btn m-1 text-lg py-6 rounded-full bg-[#1B4B36] text-yellow-500'><FaUserAlt /></p>
              </div>
              <ul tabIndex="-1" className="dropdown-content menu bg-base-100 rounded-box z-1 w-60 p-2 shadow-sm text-xl font-semibold">
                <li><a onClick={openLoginModal}>Log In</a></li>
                <li><a onClick={openSignupModal}>Sign Up</a></li>
              </ul>
            </div>
          )}
          <div className='flex gap-1.5 ml-2'>
            <p className='text-2xl px-3 py-3 rounded-full text-yellow-500 bg-[#1B4B36]'>
            <FaFacebookF />
          </p>
            <p className='text-2xl px-3 py-3 rounded-full text-yellow-500 bg-[#1B4B36]'><FaXTwitter /></p></div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          onClose={closeModals}
          onSwitchToSignup={openSignupModal}
        />
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <SignupModal 
          onClose={closeModals}
          onSwitchToLogin={openLoginModal}
        />
      )}
    </div>
  );
};

export default Navbar;