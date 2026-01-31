import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaTrash, FaStore, FaConciergeBell, FaSyncAlt } from 'react-icons/fa';
import { favoritesApi } from '../../api/favoritesApi';
import Toast from '../../Components/Shared/Toast';

const Favorites = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (activeTab === 'services') {
      loadServices();
    } else {
      loadVendors();
    }
  }, [activeTab]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await favoritesApi.getFavoriteServices();
      console.log('Favorite services response:', res);
      setServices(res?.data?.favorites || []);
    } catch (err) {
      console.error('Failed to load favorite services:', err);
      setToast({ type: 'error', message: 'Failed to load favorite services' });
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    try {
      setLoading(true);
      const res = await favoritesApi.getFavoriteVendors();
      console.log('Favorite vendors response:', res);
      setVendors(res?.data?.favorites || []);
    } catch (err) {
      console.error('Failed to load favorite vendors:', err);
      setToast({ type: 'error', message: 'Failed to load favorite vendors' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveService = async (id) => {
    try {
      await favoritesApi.removeServiceFromFavorites(id);
      setServices(prev => prev.filter(s => (s._id || s.id) !== id));
      setToast({ type: 'success', message: 'Removed from favorites' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to remove service' });
    }
  };

  const handleRemoveVendor = async (id) => {
    try {
      await favoritesApi.removeVendorFromFavorites(id);
      setVendors(prev => prev.filter(v => (v._id || v.id) !== id));
      setToast({ type: 'success', message: 'Removed from favorites' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to remove vendor' });
    }
  };

  const renderEmpty = (label) => (
    <div className="text-center text-gray-500 py-10">
      <FaHeart className="mx-auto text-4xl mb-3 text-gray-300" />
      <p>No favorite {label} yet.</p>
    </div>
  );

  const serviceRows = useMemo(() => services, [services]);
  const vendorRows = useMemo(() => vendors, [vendors]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1B4B36]">My Favorites</h1>
          <p className="text-sm text-gray-600">Quick access to services and vendors you love.</p>
        </div>
        <button
          onClick={() => (activeTab === 'services' ? loadServices() : loadVendors())}
          className="btn bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
          disabled={loading}
        >
          <FaSyncAlt /> Refresh
        </button>
      </div>

      <div className="tabs tabs-boxed bg-white border rounded-lg p-2 mb-6">
        <button
          className={`tab tab-lg ${activeTab === 'services' ? 'tab-active bg-[#1B4B36] text-[#FCDE70]' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          <FaConciergeBell /> Services
        </button>
        <button
          className={`tab tab-lg ${activeTab === 'vendors' ? 'tab-active bg-[#1B4B36] text-[#FCDE70]' : ''}`}
          onClick={() => setActiveTab('vendors')}
        >
          <FaStore /> Vendors
        </button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-[#1B4B36]"></span>
          </div>
        ) : activeTab === 'services' ? (
          serviceRows.length === 0 ? (
            renderEmpty('services')
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {serviceRows.map((svc) => {
                    const id = svc._id || svc.id;
                    const name = svc.name || svc.title || 'Service';
                    const vendorName = svc.vendorId?.companyName || svc.vendorId?.businessName || svc.vendor?.companyName || 'Vendor';
                    const price = svc.price || svc.totalPrice || svc.basePrice || 0;
                    const rating = svc.rating || svc.averageRating || 0;
                    return (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{vendorName}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-[#1B4B36]">৳{price}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{rating > 0 ? rating.toFixed ? rating.toFixed(1) : rating : '—'}</td>
                        <td className="px-4 py-3 text-sm flex gap-3">
                          <button
                            onClick={() => navigate(`/services/${id}`)}
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleRemoveService(id)}
                            className="text-red-600 hover:underline flex items-center gap-1"
                          >
                            <FaTrash /> Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          vendorRows.length === 0 ? (
            renderEmpty('vendors')
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vendorRows.map((v) => {
                    const id = v._id || v.id;
                    const name = v.companyName || v.name || 'Vendor';
                    const category = v.category || v.primaryService || '—';
                    const rating = v.rating || v.averageRating || 0;
                    return (
                      <tr key={id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800">{name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{category}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{rating > 0 ? rating.toFixed ? rating.toFixed(1) : rating : '—'}</td>
                        <td className="px-4 py-3 text-sm flex gap-3">
                          <button
                            onClick={() => navigate(`/vendors/${id}`)}
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleRemoveVendor(id)}
                            className="text-red-600 hover:underline flex items-center gap-1"
                          >
                            <FaTrash /> Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Favorites;
