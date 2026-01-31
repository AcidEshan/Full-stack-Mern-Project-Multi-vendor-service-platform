import React, { useState, useEffect } from "react";
import VendorCard from "../../../Components/Shared/VendorCard";
import { vendorApi } from "../../../api/vendorApi";
import vendorBg from "../../../../Images/vendorbg6.jpg";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/pagination";

const CardShow = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await vendorApi.getAllVendors({ 
        approvalStatus: 'approved', 
        isActive: true 
      });
      setVendors(response.data?.vendors || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section>
        <div className="max-w-[90rem] mx-auto rounded-2xl border-2 border-yellow-500 py-20 flex justify-center">
          <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
        </div>
      </section>
    );
  }

  if (vendors.length === 0) {
    return null; // Don't show section if no vendors
  }
  return (
    <section>
      <div
        className="max-w-[90rem] mx-auto rounded-2xl border-2 border-yellow-500 relative"
        style={{
          backgroundImage: `url(${vendorBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70 rounded-2xl" />

        {/* Content */}
        <div className="relative py-14">
          {/* Heading */}
          <div className="flex justify-center mb-12">
            <h2 className="text-3xl font-bold text-yellow-500 border-2 px-10 py-3 rounded-full bg-[#1B4B36]">
              Meet Our Vendors
            </h2>
          </div>

          {/* Swiper */}
          <Swiper
            slidesPerView={3}
            spaceBetween={28}
            loop={true}
            modules={[Pagination]}
            pagination={{
              clickable: true,
              el: ".custom-swiper-pagination",
              renderBullet: (index, className) => {
                const isActive = className.includes(
                  "swiper-pagination-bullet-active"
                );

                return `
                  <span class="
                    ${className}
                    w-3 h-3
                    rounded-full
                    inline-block
                    transition
                    ${
                      isActive
                        ? "bg-[#1B4B36] opacity-100 scale-125"
                        : "bg-[#1B4B36] opacity-40"
                    }
                  "></span>
                `;
              },
            }}
            className="pb-6"
            breakpoints={{
              320: { slidesPerView: 1 },
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {vendors.map((vendor) => (
              <SwiperSlide key={vendor._id}>
                <div className="max-w-[400px] mx-auto">
                  <VendorCard
                    vendorId={vendor._id}
                    image={vendor.companyLogo || 'https://via.placeholder.com/400x300?text=No+Image'}
                    name={vendor.companyName}
                    service={vendor.businessCategory || 'Service Provider'}
                    shortDescription={vendor.bio || 'Professional service provider'}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Pagination */}
          <div className="custom-swiper-pagination mt-10 flex justify-center" />
        </div>
      </div>
    </section>
  );
};

export default CardShow;
