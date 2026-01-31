import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // Get transaction details from URL params
    // Backend sends 'transaction' parameter
    const transactionId = searchParams.get('transaction') || 
                         searchParams.get('tran_id') || 
                         searchParams.get('transactionId') ||
                         searchParams.get('transaction_id') ||
                         searchParams.get('merchant_trans_id');
    
    const status = searchParams.get('status');
    const valId = searchParams.get('val_id');
    const amount = searchParams.get('amount');
    
    // Log all params for debugging
    console.log('Payment Success - All URL Params:', Object.fromEntries(searchParams.entries()));
    console.log('Payment Success - Transaction ID:', transactionId);
    console.log('Payment Success - Status:', status);
    console.log('Payment Success - Validation ID:', valId);
    console.log('Payment Success - Amount:', amount);

    // Backend IPN will handle the order update
    // We just show success message and redirect
    setTimeout(() => {
      setProcessing(false);
    }, 2000);
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/user-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        {processing ? (
          <div className="text-center">
            <FaSpinner className="text-6xl text-[#1B4B36] mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing Payment...</h2>
            <p className="text-gray-600">Please wait while we confirm your payment</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-5xl text-green-600" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800 break-all">
                <strong>Transaction ID:</strong> {
                  searchParams.get('transaction') || 
                  searchParams.get('tran_id') || 
                  searchParams.get('transactionId') ||
                  searchParams.get('transaction_id') ||
                  searchParams.get('merchant_trans_id') ||
                  'Processing...'
                }
              </p>
              {searchParams.get('val_id') && (
                <p className="text-sm text-green-800 mt-2">
                  <strong>Validation ID:</strong> {searchParams.get('val_id')}
                </p>
              )}
              {searchParams.get('amount') && (
                <p className="text-sm text-green-800 mt-2">
                  <strong>Amount:</strong> ৳{searchParams.get('amount')}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleContinue}
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
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
