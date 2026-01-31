import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaExclamationCircle } from 'react-icons/fa';

const PaymentCancelled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const transactionId = searchParams.get('tran_id') || searchParams.get('transactionId');

  const handleRetry = () => {
    navigate('/user-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center">
          <div className="bg-yellow-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <FaExclamationCircle className="text-5xl text-yellow-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Payment Cancelled</h2>
          <p className="text-gray-600 mb-6">
            You have cancelled the payment process.
          </p>

          {transactionId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Transaction ID:</strong> {transactionId}
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              Your order is still pending. You can complete the payment from your dashboard anytime.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-[#1B4B36] hover:bg-[#143426] text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/services')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
