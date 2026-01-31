import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaStar, FaMapMarkerAlt, FaClock, FaTag, FaUser, FaArrowLeft, FaShoppingCart } from 'react-icons/fa';
import { serviceApi } from '../../api/serviceApi';
import { getFileUrl } from '../../api/uploadApi';
import useAuthStore from '../../store/authStore';
import ReviewSection from '../../Components/Shared/ReviewSection';
import ContactVendorButton from '../../Components/Shared/ContactVendorButton';
import BookingModal from '../../Components/Shared/BookingModal';
import Toast from '../../Components/Shared/Toast';
import LoginModal from '../Auth/LoginModal';

const ServiceDetail = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toast, setToast] = useState(null);

  const canBook = !isAuthenticated || user?.role === 'user';

  useEffect(() => {
    fetchServiceDetail();
  }, [serviceId]);

  const fetchServiceDetail = async () => {
    try {
      setLoading(true);
      const response = await serviceApi.getServiceById(serviceId);
      setService(response.data.service);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching service:', err);
      setError('Failed to load service details');
      setLoading(false);
    }
  };

  const handleBookService = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setToast({ message: 'Booking created successfully! Redirecting to orders...', type: 'success' });
    setTimeout(() => {
      navigate('/user-dashboard');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-xl">{error || 'Service not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="btn bg-[#1B4B36] text-white hover:bg-[#143426]"
        >
          <FaArrowLeft /> Back to Home
        </button>
      </div>
    );
  }

  const discountedPrice = service.discount > 0 
    ? (service.price - (service.price * service.discount / 100)).toFixed(2)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-[#1B4B36]">Home</Link>
          <span>/</span>
          <Link to="/services" className="hover:text-[#1B4B36]">Services</Link>
          <span>/</span>
          <span className="text-[#1B4B36] font-medium">{service.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden aspect-square">
              <img
                src={service.images?.[selectedImage] ? getFileUrl(service.images[selectedImage]) : '/placeholder.png'}
                alt={service.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Images */}
            {service.images && service.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {service.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-[#1B4B36] scale-105'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={getFileUrl(image)}
                      alt={`${service.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Service Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              {/* Title and Rating */}
              <div>
                <h1 className="text-3xl font-bold text-[#1B4B36] mb-3">{service.name}</h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <FaStar className="text-yellow-500" />
                    <span className="font-semibold">{service.rating || 0}</span>
                    <span className="text-gray-500">({service.totalReviews || 0} reviews)</span>
                  </div>
                  {service.totalBookings > 0 && (
                    <span className="text-gray-600">
                      {service.totalBookings} bookings
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-gray-600 mb-2">Price</p>
                <div className="flex items-center gap-3">
                  {service.discount > 0 ? (
                    <>
                      <span className="text-4xl font-bold text-[#1B4B36]">৳{discountedPrice}</span>
                      <span className="text-2xl text-gray-400 line-through">৳{service.price}</span>
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {service.discount}% OFF
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold text-[#1B4B36]">৳{service.price}</span>
                  )}
                </div>
              </div>

              {/* Vendor Info */}
              {service.vendorId && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  {service.vendorId.companyLogo ? (
                    <img
                      src={service.vendorId.companyLogo}
                      alt={service.vendorId.companyName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%231B4B36" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle"%3E' + (service.vendorId.companyName?.[0]?.toUpperCase() || 'V') + '%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#1B4B36] rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {service.vendorId.companyName?.[0]?.toUpperCase() || 'V'}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Provided by</p>
                    <Link
                      to={`/vendors/${service.vendorId._id}`}
                      className="font-semibold text-[#1B4B36] hover:underline"
                    >
                      {service.vendorId.companyName || 'Unknown Vendor'}
                    </Link>
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <FaClock className="text-[#1B4B36]" />
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="font-medium">{service.duration || 'Varies'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaTag className="text-[#1B4B36]" />
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="font-medium">{service.categoryId?.name || 'Uncategorized'}</p>
                  </div>
                </div>
              </div>

              {/* Availability Status */}
              <div>
                {service.isAvailable ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Available Now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Currently Unavailable
                  </span>
                )}
              </div>

              {/* Book Button */}
              {canBook && (
                <button
                  onClick={handleBookService}
                  disabled={!service.isAvailable}
                  className={`w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                    service.isAvailable
                      ? 'bg-[#1B4B36] text-white hover:bg-[#143426] cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <FaShoppingCart />
                  {service.isAvailable ? 'Book This Service' : 'Service Unavailable'}
                </button>
              )}

              {/* Contact Vendor Button */}
              {service.vendorId && (
                <ContactVendorButton
                  vendorId={service.vendorId._id}
                  vendorUserId={service.vendorId.userId?._id || service.vendorId.userId}
                  vendorName={service.vendorId.companyName || 'Vendor'}
                  serviceId={service._id}
                />
              )}
            </div>
          </div>
        </div>

        {/* Description and Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-[#1B4B36] mb-4">About This Service</h2>
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">
            {service.description || 'No description available.'}
          </p>
        </div>

        {/* Features */}
        {service.features && service.features.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-[#1B4B36] mb-4">What's Included</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {service.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-5 h-5 bg-[#1B4B36] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-[#1B4B36] mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {service.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-8">
          <ReviewSection 
            serviceId={serviceId} 
            vendorId={service.vendorId?._id}
            orderId={undefined} // No orderId on service pages - reviews are read-only
            type="service"
          />
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          service={service}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Login Modal for unauthenticated booking attempts */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToSignup={() => setShowLoginModal(false)}
          preventNavigation
        />
      )}
    </div>
  );
};

export default ServiceDetail;
