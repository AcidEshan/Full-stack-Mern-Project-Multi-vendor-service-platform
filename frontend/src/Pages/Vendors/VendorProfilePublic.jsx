import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaArrowLeft, FaBuilding, FaClock, FaUsers, FaLock, FaCheckCircle, FaBriefcase, FaCheck, FaCalendarAlt, FaCommentDots } from 'react-icons/fa';
import { vendorApi } from '../../api/vendorApi';
import { serviceApi } from '../../api/serviceApi';
import { getFileUrl } from '../../api/uploadApi';
import ServiceCard from '../../Components/Shared/ServiceCard';
import LoginModal from '../Auth/LoginModal';
import SignupModal from '../Auth/SignupModal';
import useAuthStore from '../../store/authStore';

const VendorProfilePublic = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [requiresAuth, setRequiresAuth] = useState(false);

  useEffect(() => {
    fetchVendorData();
  }, [id, isAuthenticated]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      setRequiresAuth(false);
      // Fetch vendor details
      const vendorResponse = await vendorApi.getVendorById(id);
      setVendor(vendorResponse.data.vendor);

      // Fetch vendor's services
      try {
        const servicesResponse = await serviceApi.getAllServices({ 
          vendorId: id,
          isActive: true,
          isAvailable: true 
        });
        setServices(servicesResponse.data?.services || []);
      } catch (err) {
        console.log('No services found for this vendor');
        setServices([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching vendor:', err);
      // Check if it's a 401 unauthorized error
      if (err.response?.status === 401) {
        setRequiresAuth(true);
        setError(null);
      } else {
        setError('Failed to load vendor profile');
      }
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
      </div>
    );
  }

  // Show login prompt if authentication is required
  if (requiresAuth) {
    return (
      <>
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-50 px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
            <div className="w-20 h-20 bg-[#1B4B36] rounded-full flex items-center justify-center mx-auto mb-4">
              <FaLock className="text-white text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-[#1B4B36] mb-3">Login Required</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to view vendor profiles. Please sign in to continue.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={openLoginModal}
                className="btn bg-[#1B4B36] text-white hover:bg-[#143426] px-6"
              >
                Login
              </button>
              <button
                onClick={openSignupModal}
                className="btn btn-outline border-[#1B4B36] text-[#1B4B36] hover:bg-[#1B4B36] hover:text-white px-6"
              >
                Sign Up
              </button>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-4 text-gray-600 hover:text-[#1B4B36] underline"
            >
              Go back to home
            </button>
          </div>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <LoginModal
            onClose={closeModals}
            onSwitchToSignup={openSignupModal}
            preventNavigation
          />
        )}

        {/* Signup Modal */}
        {showSignupModal && (
          <SignupModal
            onClose={closeModals}
            onSwitchToLogin={openLoginModal}
          />
        )}
      </>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-xl">{error || 'Vendor not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="btn bg-[#1B4B36] text-white hover:bg-[#143426]"
        >
          <FaArrowLeft /> Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Card - No Cover Image */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              {vendor.companyLogo ? (
                <img
                  src={vendor.companyLogo}
                  alt={vendor.companyName}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover bg-[#1B4B36] shadow-md"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-20 h-20 md:w-24 md:h-24 bg-[#1B4B36] rounded-lg flex items-center justify-center text-white text-3xl font-bold shadow-md ${vendor.companyLogo ? 'hidden' : 'flex'}`}
              >
                {vendor.companyName?.[0]?.toUpperCase() || 'V'}
              </div>
            </div>

            {/* Company Info */}
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-[#1B4B36]">{vendor.companyName}</h1>
                {vendor.approvalStatus === 'approved' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    <FaCheckCircle className="text-xs" /> VERIFIED VENDOR
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                {/* Rating */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={i < Math.floor(vendor.rating || 0) ? 'text-[#FCDE70]' : 'text-gray-300'} 
                    />
                  ))}
                  <span className="ml-1 text-gray-500">
                    ({vendor.rating?.toFixed(1) || '0.0'} ⭐ {vendor.totalReviews || 0} Reviews)
                  </span>
                </div>

                {/* Experience */}
                {vendor.yearsInBusiness && (
                  <div className="flex items-center gap-1">
                    <FaClock className="text-[#1B4B36]" />
                    <span>{vendor.yearsInBusiness} Years Experience</span>
                  </div>
                )}

                {/* Employees */}
                {vendor.numberOfEmployees && (
                  <div className="flex items-center gap-1">
                    <FaUsers className="text-[#1B4B36]" />
                    <span>{vendor.numberOfEmployees}+ Employees</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <button className="btn bg-[#1B4B36] text-white hover:bg-[#143426] px-6 border-none">
                <FaCalendarAlt /> Book Appointment
              </button>
              <button className="btn btn-outline border-[#1B4B36] text-[#1B4B36] hover:bg-[#1B4B36] hover:text-white px-6">
                <FaCommentDots /> Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Us */}
            {vendor.description && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#1B4B36] rounded"></span>
                  About Us
                </h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {vendor.description}
                </p>
              </div>
            )}

            {/* Our Services */}
            {services.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1 h-6 bg-[#1B4B36] rounded"></span>
                    Our Services
                  </h2>
                  
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map(service => (
                    <ServiceCard
                      key={service._id}
                      plan={{
                        _id: service._id,
                        title: service.name,
                        tagline: service.categoryId?.name || 'Service',
                        price: service.discount > 0 
                          ? (service.price * (1 - service.discount / 100)).toFixed(0)
                          : service.price,
                        discount: service.discount,
                        billingType: service.billingType || 'service',
                        features: service.features || [],
                        image: service.images?.[0] || null,
                        rating: service.rating || 0,
                      }}
                      onViewDetails={() => navigate(`/services/${service._id}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#1B4B36] rounded"></span>
                Contact Information
              </h2>
              
              <div className="space-y-4">
                {/* Office Address */}
                {vendor.address && (
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaMapMarkerAlt className="text-[#1B4B36]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Office Address
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {[
                            vendor.address.street,
                            vendor.address.city,
                            vendor.address.state,
                            vendor.address.zipCode,
                            vendor.address.country
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Support */}
                {vendor.userId?.email && (
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaEnvelope className="text-[#1B4B36]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Email Support
                        </p>
                        <a 
                          href={`mailto:${vendor.userId.email}`} 
                          className="text-sm text-gray-700 hover:text-[#1B4B36]"
                        >
                          {vendor.userId.email}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Phone Number */}
                {vendor.userId?.phone && (
                  <div>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FaPhone className="text-[#1B4B36]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Phone Number
                        </p>
                        <a 
                          href={`tel:${vendor.userId.phone}`} 
                          className="text-sm font-semibold text-gray-900"
                        >
                          {vendor.userId.phone}
                        </a>
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            AVAILABLE NOW
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Connect With Us */}
            {(vendor.facebook || vendor.twitter || vendor.instagram || vendor.linkedin) && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-[#1B4B36] rounded"></span>
                  Connect With Us
                </h2>
                
                <div className="flex gap-3">
                  {vendor.facebook && (
                    <a
                      href={vendor.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <FaFacebook className="text-white text-xl" />
                    </a>
                  )}
                  {vendor.twitter && (
                    <a
                      href={vendor.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-sky-500 hover:bg-sky-600 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <FaTwitter className="text-white text-xl" />
                    </a>
                  )}
                  {vendor.instagram && (
                    <a
                      href={vendor.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 rounded-lg flex items-center justify-center transition-opacity"
                    >
                      <FaInstagram className="text-white text-xl" />
                    </a>
                  )}
                  {vendor.linkedin && (
                    <a
                      href={vendor.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-blue-700 hover:bg-blue-800 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <FaLinkedin className="text-white text-xl" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Working Hours */}
            <div className="bg-gradient-to-br from-[#1B4B36] to-[#2d6b54] rounded-lg shadow-md p-6 text-white">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FaClock />
                Working Hours
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/20">
                  <span className="text-sm">Mon - Fri</span>
                  <span className="text-sm font-semibold">09:00 AM - 08:00 PM</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/20">
                  <span className="text-sm">Saturday</span>
                  <span className="text-sm font-semibold">10:00 AM - 06:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Sunday</span>
                  <span className="inline-flex items-center gap-1 text-xs bg-red-500 text-white px-2 py-1 rounded-full font-medium">
                    CLOSED
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfilePublic;
