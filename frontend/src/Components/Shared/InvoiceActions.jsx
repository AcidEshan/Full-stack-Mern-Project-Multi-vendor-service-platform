import React, { useState } from 'react';
import { FaDownload, FaEnvelope, FaFileInvoice } from 'react-icons/fa';
import { invoiceApi } from '../../api/invoiceApi';

const InvoiceActions = ({ order, type = 'invoice' }) => {
  const [loading, setLoading] = useState({ download: false, email: false });
  const [message, setMessage] = useState('');

  const handleDownload = async () => {
    setLoading({ ...loading, download: true });
    setMessage('');
    
    try {
      let blob;
      if (type === 'invoice') {
        blob = await invoiceApi.downloadInvoice(order._id);
      } else {
        blob = await invoiceApi.downloadReceipt(order._id);
      }

      // The blob is already a Blob object from axios with responseType: 'blob'
      // Create URL directly from the blob without wrapping it again
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_${order._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setMessage(`${type === 'invoice' ? 'Invoice' : 'Receipt'} downloaded successfully!`);
    } catch (error) {
      setMessage(error.response?.data?.error?.message || `Failed to download ${type}`);
    } finally {
      setLoading({ ...loading, download: false });
    }
  };

  const handleEmail = async () => {
    setLoading({ ...loading, email: true });
    setMessage('');
    
    try {
      if (type === 'invoice') {
        await invoiceApi.emailInvoice(order._id);
      } else {
        // For receipts, we use the same API (backend should handle receipt emailing)
        await invoiceApi.emailInvoice(order._id);
      }
      setMessage(`${type === 'invoice' ? 'Invoice' : 'Receipt'} sent to your email successfully!`);
    } catch (error) {
      setMessage(error.response?.data?.error?.message || `Failed to email ${type}`);
    } finally {
      setLoading({ ...loading, email: false });
    }
  };

  return (
    <div className="inline-flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={loading.download}
          className="btn btn-sm btn-outline border-[#1B4B36] text-[#1B4B36] hover:bg-[#1B4B36] hover:text-white disabled:opacity-50"
          title={`Download ${type}`}
        >
          {loading.download ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <FaDownload />
          )}
          <span className="hidden sm:inline ml-1">
            Download {type === 'invoice' ? 'Invoice' : 'Receipt'}
          </span>
        </button>
        
        <button
          onClick={handleEmail}
          disabled={loading.email}
          className="btn btn-sm btn-outline border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white disabled:opacity-50"
          title={`Email ${type}`}
        >
          {loading.email ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <FaEnvelope />
          )}
          <span className="hidden sm:inline ml-1">
            Email {type === 'invoice' ? 'Invoice' : 'Receipt'}
          </span>
        </button>
      </div>
      
      {message && (
        <div className={`text-xs ${message.includes('Failed') || message.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default InvoiceActions;
