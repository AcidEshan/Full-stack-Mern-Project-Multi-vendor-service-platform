import React, { useEffect, useState } from 'react';
import { FaComments, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { messageApi } from '../../api/messageApi';
import { vendorApi } from '../../api/vendorApi';
import useAuthStore from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../../Pages/Auth/LoginModal';
import Toast from './Toast';

const ContactVendorButton = ({ vendorId, vendorUserId: vendorUserIdProp, vendorName, serviceId = null }) => {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);
  const [vendorUserId, setVendorUserId] = useState(vendorUserIdProp || null);
  const [loadingVendor, setLoadingVendor] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);

  useEffect(() => {
    if (!vendorUserId && vendorId && !vendorUserIdProp && isAuthenticated && accessToken) {
      fetchVendorUserId();
    }
  }, [vendorId, vendorUserId, vendorUserIdProp, isAuthenticated, accessToken]);

  const fetchVendorUserId = async () => {
    // Avoid hitting protected endpoint when logged out or token missing
    if (!isAuthenticated || !accessToken) return;

    try {
      setLoadingVendor(true);
      const response = await vendorApi.getVendorById(vendorId);
      const fetchedVendorUserId = response?.data?.vendor?.userId?._id || response?.vendor?.userId?._id || response?.vendor?.userId;
      if (fetchedVendorUserId) {
        setVendorUserId(fetchedVendorUserId);
        if (pendingOpen && isAuthenticated) {
          setShowModal(true);
          setPendingOpen(false);
        }
      } else {
        setToast({ message: 'Unable to resolve vendor contact. Please try again later.', type: 'error' });
      }
    } catch (err) {
      setToast({ message: 'Unable to load vendor contact. Please try again.', type: 'error' });
    } finally {
      setLoadingVendor(false);
    }
  };

  const handleClick = () => {
    if (!isAuthenticated || !accessToken) {
      setShowLoginModal(true);
      setToast({ message: 'Login required to contact vendor', type: 'error' });
      return;
    }
    if (!vendorUserId) {
      setPendingOpen(true);
      fetchVendorUserId();
      return;
    }
    setShowModal(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!vendorUserId) {
      setToast({ message: 'Unable to send message: contact not resolved yet.', type: 'error' });
      return;
    }

    setSending(true);
    try {
      await messageApi.sendMessage({
        recipientId: vendorUserId,
        message: message.trim(),
        messageType: 'text',
        relatedService: serviceId
      });

      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        setMessage('');
        setSuccess(false);
        // Navigate to messages
        if (user.role === 'user') {
          navigate('/user-dashboard?tab=messages');
        } else if (user.role === 'vendor') {
          navigate('/vendor-dashboard?tab=messages');
        }
      }, 2000);
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#1B4B36] text-[#1B4B36] rounded-lg hover:bg-[#1B4B36] hover:text-white transition-colors font-semibold"
      >
        <FaComments />
        Contact Vendor
      </button>

      {/* Message Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1B4B36]">
                Contact {vendorName}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <p className="text-lg font-semibold text-gray-800">Message sent successfully!</p>
                <p className="text-sm text-gray-600 mt-2">Redirecting to messages...</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                    placeholder="Ask about service availability, pricing, or any questions..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="px-4 py-2 bg-[#1B4B36] text-white rounded-lg hover:bg-[#2d7a54] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FaPaperPlane />
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {showLoginModal && (
        <LoginModal
          onClose={() => {
            setShowLoginModal(false);
          }}
          onSwitchToSignup={() => {
            setShowLoginModal(false);
          }}
          preventNavigation
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={5000}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default ContactVendorButton;
