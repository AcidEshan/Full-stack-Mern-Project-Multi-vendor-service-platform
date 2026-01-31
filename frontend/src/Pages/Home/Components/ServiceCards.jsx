import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { serviceApi } from "../../../api/serviceApi";
import { getFileUrl } from "../../../api/uploadApi";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";

// Swiper styles
import "swiper/css";

import ServicePlanCard from "../../../Components/Shared/ServiceCard";

const ServiceCards = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await serviceApi.getAllServices({ 
        isActive: true, 
        isAvailable: true 
      });
      setServices(response.data?.services || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20">
        <div className="max-w-[90rem] mx-auto px-4 flex justify-center">
          <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return (
      <section className="py-20">
        <div className="max-w-[90rem] mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-[#1B4B36]">
            Popular Services
          </h2>
          <p className="text-gray-500 text-center py-8">No services available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="max-w-[90rem] mx-auto px-4">

        <h2 className="text-3xl font-bold mb-8 text-[#1B4B36]">
          Popular Services
        </h2>

        <Swiper
          slidesPerView={4}
          spaceBetween={24}
          loop={services.length > 4}
          className="overflow-hidden"
          breakpoints={{
            320: { slidesPerView: 1 },
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 },
          }}
        >
          {services.map(service => {
            return (
              <SwiperSlide key={service._id}>
                <ServicePlanCard
                  plan={{
                    _id: service._id,
                    rating: service.rating || 0,
                    title: service.name,
                    tagline: service.vendorId?.companyName || 'Vendor',
                    price: service.price,
                    discount: service.discount,
                    billingType: service.billingType,
                    features: service.features?.slice(0, 4) || [],
                    image: service.images?.[0] ? getFileUrl(service.images[0]) : null,
                  }}
                  onViewDetails={() => navigate(`/services/${service._id}`)}
                />
              </SwiperSlide>
            );
          })}
        </Swiper>

      </div>
    </section>
  );
};

export default ServiceCards;
