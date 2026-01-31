import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import useAuthStore from "../../../store/authStore";
import LoginModal from "../../Auth/LoginModal";
import SignupModal from "../../Auth/SignupModal";
import { serviceApi } from "../../../api/serviceApi";
import { getFileUrl } from "../../../api/uploadApi";

// Images
import heroBanner from "../../../../Images/heroBanner.png";
import heroBanner2 from "../../../../Images/heroBanner2.png";

// Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function Hero() {
  const { isAuthenticated } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [heroSlides, setHeroSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscountServices();
  }, []);

  const fetchDiscountServices = async () => {
    try {
      const response = await serviceApi.getAllServices({ isActive: true, isAvailable: true });
      const services = response.data?.services || [];
      
      // Filter services with discounts and map to hero slide format
      const discountServices = services
        .filter(service => service.discount > 0)
        .slice(0, 5) // Show max 5 discount services
        .map((service, index) => ({
          id: service._id,
          serviceId: service._id,
          vendorId: service.vendorId?._id,
          image: service.images?.[0] ? getFileUrl(service.images[0]) : (index % 2 === 0 ? heroBanner2 : heroBanner),
          discountText: `${service.discount}% Discount On`,
          title: service.name,
          price: service.price,
          discountedPrice: (service.price - (service.price * service.discount / 100)).toFixed(2),
          theme: index % 2 === 0 ? "dark" : "light",
        }));

      // If no discount services, show default slides
      if (discountServices.length === 0) {
        setHeroSlides([
          {
            id: 1,
            image: heroBanner2,
            discountText: "Quality Services",
            title: "Home Renovation Services",
            theme: "dark",
          },
          {
            id: 2,
            image: heroBanner,
            discountText: "Trusted Vendors",
            title: "Home Cleaning Services",
            theme: "light",
          },
        ]);
      } else {
        setHeroSlides(discountServices);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching discount services:', error);
      // Fallback to default slides
      setHeroSlides([
        {
          id: 1,
          image: heroBanner2,
          discountText: "Quality Services",
          title: "Home Renovation Services",
          theme: "dark",
        },
        {
          id: 2,
          image: heroBanner,
          discountText: "Trusted Vendors",
          title: "Home Cleaning Services",
          theme: "light",
        },
      ]);
      setLoading(false);
    }
  };

  const openLoginModal = () => {
    setShowLoginModal(true);
    setShowSignupModal(false);
  };

  const openSignupModal = () => {
    setShowSignupModal(true);
    setShowLoginModal(false);
  };

  const closeModals = () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
  };

  if (loading) {
    return (
      <section className="w-full h-[85vh] flex items-center justify-center bg-gray-100">
        <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
      </section>
    );
  }

  return (
    <>
      <section className="w-full overflow-x-hidden">
        <div className="w-full mx-auto">
          <Swiper
            slidesPerView={1}
            loop={heroSlides.length > 1}
            autoplay={{ delay: 5000 }}
            navigation
            modules={[Pagination, Navigation]}
            className="w-full h-[85vh]"
          >
            {heroSlides.map((slide) => (
              <SwiperSlide key={slide.id} className="w-full">
                <div
                  className="relative w-full h-[82.5vh] bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.image})` }}
                >
                  {/* Overlay */}
                  <div
                    className={`absolute inset-0 ${
                      slide.theme === "dark"
                        ? "bg-gradient-to-r from-black/70 via-black/40 to-transparent"
                        : "bg-gradient-to-r from-white/70 via-white/40 to-transparent"
                    }`}
                  />

                  {/* Content */}
                  <div className="relative h-full flex items-center">
                    <div className="pl-60 max-w-3xl space-y-6">
                      <p
                        className={`text-3xl font-bold ${
                          slide.theme === "dark"
                            ? "text-yellow-500"
                            : "text-[#1B4B36]"
                        }`}
                      >
                        {slide.discountText}
                      </p>

                      <h1
                        className={`text-6xl font-bold leading-tight ${
                          slide.theme === "dark"
                            ? "text-yellow-500"
                            : "text-[#1B4B36]"
                        }`}
                      >
                        {slide.title}
                      </h1>

                      <div className="flex gap-4">
                        {slide.serviceId ? (
                          <NavLink
                            to={`/services/${slide.serviceId}`}
                            className={`inline-block px-8 py-3 rounded-full text-lg font-semibold transition ${
                              slide.theme === "dark"
                                ? "bg-[#1B4B36] text-yellow-500 hover:bg-yellow-500 hover:text-[#1B4B36]"
                                : "bg-yellow-500 text-[#045344] hover:bg-[#1B4B36] hover:text-yellow-500"
                            }`}
                          >
                            View Service
                          </NavLink>
                        ) : (
                          <NavLink
                            to="/services"
                            className={`inline-block px-8 py-3 rounded-full text-lg font-semibold transition ${
                              slide.theme === "dark"
                                ? "bg-[#1B4B36] text-yellow-500 hover:bg-yellow-500 hover:text-[#1B4B36]"
                                : "bg-yellow-500 text-[#045344] hover:bg-[#1B4B36] hover:text-yellow-500"
                            }`}
                          >
                            Browse Services
                          </NavLink>
                        )}
                        
                        {!isAuthenticated && (
                          <>
                            <button
                              onClick={openLoginModal}
                              className={`px-8 py-3 rounded-full text-lg font-semibold transition ${
                                slide.theme === "dark"
                                  ? "bg-yellow-500 text-[#1B4B36] hover:bg-white hover:text-[#1B4B36]"
                                  : "bg-[#1B4B36] text-yellow-500 hover:bg-yellow-600 hover:text-white"
                              }`}
                            >
                              Login
                            </button>
                            <button
                              onClick={openSignupModal}
                              className={`px-8 py-3 rounded-full text-lg font-semibold transition ${
                                slide.theme === "dark"
                                  ? "bg-white text-[#1B4B36] hover:bg-gray-100"
                                  : "bg-white text-[#1B4B36] hover:bg-gray-100"
                              }`}
                            >
                              Create Account
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Modals */}
      {showLoginModal && (
        <LoginModal
          onClose={closeModals}
          onSwitchToSignup={openSignupModal}
        />
      )}

      {showSignupModal && (
        <SignupModal
          onClose={closeModals}
          onSwitchToLogin={openLoginModal}
        />
      )}
    </>
  );
}
