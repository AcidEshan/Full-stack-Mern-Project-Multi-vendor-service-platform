import React, { useState } from 'react';
import { FaCreditCard, FaMoneyBillWave, FaUniversity, FaTimes, FaUpload } from 'react-icons/fa';
import { paymentApi } from '../../api/paymentApi';
import { uploadDocument } from '../../api/uploadApi';

const PaymentModal = ({ order, onClose, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // stripe, sslcommerz, manual
  const [loading, setLoading] = useState(false);
  const [manualPaymentType, setManualPaymentType] = useState('cash'); // cash, bank_transfer
  const [paymentProof, setPaymentProof] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState('');

  const handleStripePayment = async () => {
    setLoading(true);
    try {
      // Create payment intent
      const intentResponse = await paymentApi.createPaymentIntent({
        orderId: order._id,
        amount: order.totalAmount
      });

      // In a real implementation, you would integrate Stripe Elements here
      // For now, we'll simulate the payment
      alert('Stripe payment integration: In production, this would open Stripe payment form');
      
      // Simulate payment confirmation
      setTimeout(async () => {
        try {
          await paymentApi.confirmPayment(intentResponse.data.paymentIntentId);
          onPaymentSuccess();
        } catch (error) {
          alert('Payment failed');
        } finally {
          setLoading(false);
        }
      }, 2000);
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const handleSSLCommerzPayment = async () => {
    setLoading(true);
    try {
      const response = await paymentApi.initSSLCommerzPayment(order._id);
      console.log('SSLCommerz Response:', response);
      
      // Check for different possible gateway URL field names
      const gatewayUrl = response.data?.gatewayUrl || response.data?.gatewayPageURL || response.data?.GatewayPageURL;
      
      // Redirect to SSLCommerz payment gateway
      if (gatewayUrl) {
        window.location.href = gatewayUrl;
      } else {
        console.error('No gateway URL in response:', response);
        alert('Failed to get payment gateway URL');
        setLoading(false);
      }
    } catch (error) {
      console.error('SSLCommerz Error:', error);
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const handleManualPayment = async (e) => {
    e.preventDefault();
    if (!paymentProof) {
      alert('Please upload payment proof');
      return;
    }

    setLoading(true);
    try {
      // First, upload the payment proof file
      const formData = new FormData();
      formData.append('document', paymentProof);
      
      const uploadResponse = await uploadDocument(formData);
      const fileId = uploadResponse.data?.file?._id || uploadResponse.data?.fileId;

      // Then, submit the payment proof with transaction
      const proofFormData = new FormData();
      proofFormData.append('paymentMethod', manualPaymentType);
      proofFormData.append('referenceNumber', referenceNumber);
      proofFormData.append('proofFileId', fileId);

      await paymentApi.uploadPaymentProof(order.transactionId || order._id, proofFormData);
      
      alert('Payment proof uploaded successfully! Waiting for admin verification.');
      onPaymentSuccess();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to upload payment proof');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setPaymentProof(file);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'stripe') {
      handleStripePayment();
    } else if (paymentMethod === 'sslcommerz') {
      handleSSLCommerzPayment();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">Complete Payment</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-800 mb-2">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">{order._id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium">{order.service?.name || 'Service'}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-[#1B4B36] pt-2 border-t">
                <span>Total Amount:</span>
                <span>৳{order.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Select Payment Method</h4>
            <div className="space-y-3">
              {/* Stripe */}
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[#1B4B36] transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="stripe"
                  checked={paymentMethod === 'stripe'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <FaCreditCard className="text-2xl text-blue-600 mr-3" />
                <div>
                  <p className="font-semibold">Credit/Debit Card</p>
                  <p className="text-sm text-gray-600">Pay with Stripe (International)</p>
                </div>
              </label>

              {/* SSLCommerz */}
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[#1B4B36] transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="sslcommerz"
                  checked={paymentMethod === 'sslcommerz'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <FaMoneyBillWave className="text-2xl text-green-600 mr-3" />
                <div>
                  <p className="font-semibold">SSLCommerz</p>
                  <p className="text-sm text-gray-600">bKash, Nagad, Rocket, Card (Bangladesh)</p>
                </div>
              </label>

              {/* Manual Payment */}
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-[#1B4B36] transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="manual"
                  checked={paymentMethod === 'manual'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mr-3"
                />
                <FaUniversity className="text-2xl text-purple-600 mr-3" />
                <div>
                  <p className="font-semibold">Cash / Bank Transfer</p>
                  <p className="text-sm text-gray-600">Upload payment proof for verification</p>
                </div>
              </label>
            </div>
          </div>

          {/* Manual Payment Form */}
          {paymentMethod === 'manual' && (
            <form onSubmit={handleManualPayment} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-semibold text-gray-800 mb-3">Payment Details</h5>
              
              {/* Payment Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type
                </label>
                <select
                  value={manualPaymentType}
                  onChange={(e) => setManualPaymentType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                  required
                >
                  <option value="cash">Cash Payment</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Reference Number */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number (Optional)
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Transaction ID or Receipt Number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                />
              </div>

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Payment Proof *
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#1B4B36] transition-colors">
                    <FaUpload className="mr-2" />
                    <span className="text-sm">
                      {paymentProof ? paymentProof.name : 'Choose File'}
                    </span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      className="hidden"
                      required
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Accepted: Images, PDF (Max 10MB)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !paymentProof}
                className="w-full py-3 bg-[#1B4B36] text-white rounded-lg font-semibold hover:bg-[#2d7a54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Uploading...' : 'Submit Payment Proof'}
              </button>
            </form>
          )}

          {/* Pay Button for Online Methods */}
          {paymentMethod !== 'manual' && (
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-3 bg-[#1B4B36] text-white rounded-lg font-semibold hover:bg-[#2d7a54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : `Pay ৳${order.totalAmount?.toFixed(2)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
