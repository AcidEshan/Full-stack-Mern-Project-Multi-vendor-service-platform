import { useEffect, useState } from "react";
import SectionSlider from "../../Components/Shared/VendorSectionCards";
import TittleSection from "../../Components/Shared/TittleSection";
import aboutBg from '../../../Images/about-bg.jpg';
import { vendorApi } from "../../api/vendorApi";

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await vendorApi.getAllVendors({
          isActive: true,
          approvalStatus: 'approved'
        });
        
        const vendorsList = response.data.vendors || response.data || [];
        setVendors(vendorsList);
      } catch (err) {
        console.error('Error fetching vendors:', err);
        setError('Failed to load vendors');
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  // Group vendors by criteria
  const topRatedVendors = vendors
    .filter(v => v.rating >= 4.0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);
    
  const featuredVendors = vendors
    .filter(v => v.totalOrders >= 10)
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 10);
  
  const discountVendors = vendors
    .filter(v => v.hasActiveDiscounts || v.commission > 0)
    .slice(0, 10);
    
  const newVendors = vendors
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
    
  const experiencedVendors = vendors
    .filter(v => v.yearsInBusiness >= 3)
    .sort((a, b) => b.yearsInBusiness - a.yearsInBusiness)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-lg">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn bg-[#1B4B36] text-white hover:bg-[#143426]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto mt-10">
        <TittleSection
          title="Our Existing Vendors"
          bgImage={aboutBg}
        />
      </div>
      <div className="container mx-auto px-15 mt-30">
        {topRatedVendors.length > 0 && (
          <SectionSlider title="Top Rated Vendors" list={topRatedVendors} />
        )}
        {discountVendors.length > 0 && (
          <SectionSlider title="Running Discount Vendors" list={discountVendors} />
        )}
        {featuredVendors.length > 0 && (
          <SectionSlider title="Featured Vendors" list={featuredVendors} />
        )}
        {experiencedVendors.length > 0 && (
          <SectionSlider title="Experienced Vendors" list={experiencedVendors} />
        )}
        {newVendors.length > 0 && (
          <SectionSlider title="New Vendors" list={newVendors} />
        )}
      </div>
    </div>
  );
};

export default Vendors;