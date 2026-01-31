import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { serviceApi } from "../../api/serviceApi";
import { categoryApi } from "../../api/categoryApi";

import ServicePlanCard from "../../Components/Shared/ServiceCard";
import SearchFilters from "../../Components/Shared/SearchFilters";

const ITEMS_PER_PAGE = 8;

const Services = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([{ label: "All", value: "all" }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilters, setSearchFilters] = useState({});
  const navigate = useNavigate();

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getAllCategories();
        const categoryList = response.data.categories || response.data || [];
        
        const formattedCategories = [
          { label: "All", value: "all" },
          ...categoryList
            .filter(cat => cat.isActive)
            .map(cat => ({
              label: cat.name,
              value: cat._id
            }))
        ];
        
        setCategories(formattedCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch services whenever category or search filters change
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build filter params
        const filters = {
          isActive: true,
          isAvailable: true,
          ...searchFilters
        };

        // Add category filter if not "all"
        if (selectedCategory !== "all") {
          filters.category = selectedCategory;
        }
        
        let response;
        if (selectedCategory === "all") {
          // Get all services with filters
          response = await serviceApi.getAllServices(filters);
        } else {
          // Get services by category with filters
          response = await serviceApi.getServicesByCategory(selectedCategory, filters);
        }
        
        const servicesList = response.data.services || response.data || [];
        setServices(servicesList);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services');
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [selectedCategory, searchFilters]);

  // 🔁 Reset page when category or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchFilters]);

  // Handle filter application
  const handleApplyFilters = (filters) => {
    setSearchFilters(filters);
  };

  const handleClearFilters = () => {
    setSearchFilters({});
  };

  // Helper function to extract numeric price from string like "৳2500 /per_service"
  const extractPrice = (priceString) => {
    if (!priceString) return 0;
    // Convert to string if it's not already
    const priceStr = String(priceString);
    const match = priceStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // ✅ Filter and sort services
  const filteredServices = useMemo(() => {
    let result = [...services];
    
    // Apply sorting if sort filter is present
    const sortOption = searchFilters.sort;
    
    if (sortOption === 'price') {
      // Price: Low to High
      result.sort((a, b) => extractPrice(a.price) - extractPrice(b.price));
    } else if (sortOption === '-price') {
      // Price: High to Low
      result.sort((a, b) => extractPrice(b.price) - extractPrice(a.price));
    } else if (sortOption === '-rating') {
      // Highest Rated
      result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortOption === 'name') {
      // Name: A to Z
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortOption === '-name') {
      // Name: Z to A
      result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    } else if (sortOption === '-createdAt' || !sortOption) {
      // Newest First (default) - backend already sorted
      // No need to sort again
    }
    
    return result;
  }, [services, searchFilters.sort]);

  // 📄 Pagination calculations
  const totalPages = Math.ceil(
    filteredServices.length / ITEMS_PER_PAGE
  );

  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredServices.slice(start, end);
  }, [filteredServices, currentPage]);

  return (
    <div className="py-10">
      <div className="w-11/12 mx-auto px-4">

        {/* Page Title */}
        <h1 className="text-3xl font-semibold mb-8">
          All Services
        </h1>

        {/* Search & Filters */}
        <SearchFilters 
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />

        <div className="grid grid-cols-12 gap-8">

          {/* ================= CATEGORY BOX ================= */}
          <aside className="col-span-12 md:col-span-3">
            <div className="bg-gray-200 rounded-xl p-5 space-y-3">

              <h3 className="text-xl font-semibold mb-3">
                Categories
              </h3>

              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`w-full text-left px-4 py-2 rounded-lg font-medium transition
                    ${selectedCategory === cat.value
                      ? "bg-black text-white"
                      : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </aside>

          {/* ================= SERVICES GRID ================= */}
          <section className="col-span-12 md:col-span-9">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500 text-lg">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 btn bg-[#1B4B36] text-white hover:bg-[#143426]"
                >
                  Retry
                </button>
              </div>
            ) : paginatedServices.length === 0 ? (
              <p className="text-gray-500 text-center py-20">
                No services found in this category.
              </p>
            ) : (
              <>
                {/* GRID: 4 columns desktop */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {paginatedServices.map(service => {
                    return (
                      <ServicePlanCard
                        key={service._id}
                        plan={{
                          _id: service._id,
                          title: service.name,
                          tagline: service.vendorId?.companyName || 'Vendor',
                          price: service.discount > 0 
                            ? (service.price * (1 - service.discount / 100)).toFixed(0)
                            : service.price,
                          discount: service.discount,
                          billingType: service.billingType || 'service',
                          features: service.features || [],
                          image: service.images?.[0] || null,
                          rating: service.rating || 0
                        }}
                        onViewDetails={() => navigate(`/services/${service._id}`)}
                      />
                    );
                  })}
                </div>

                {/* ================= PAGINATION ================= */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-10 gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-md font-medium
                            ${currentPage === page
                              ? "bg-[#1B4B36] text-white"
                              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default Services;
