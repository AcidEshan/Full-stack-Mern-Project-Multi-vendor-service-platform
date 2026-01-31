import React from "react";
import { useNavigate } from "react-router-dom";
import handshake from "../../../../Images/description.jpg";
import { TiTick } from "react-icons/ti";

const Description = ({ onBecomeVendor }) => {
  const navigate = useNavigate();

  return (
    <section className="py-20">
      <div className="max-w-[90rem] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* LEFT CONTENT */}
        <div className="flex flex-col gap-8">
          <p className="text-xl text-[#1B4B36] font-semibold mb-2">
            • Who We're Looking For
          </p>
          <h2 className="text-4xl font-bold leading-snug text-[#1B4B36]">
            Connecting You With Trusted{" "}
            <span className="text-yellow-500">
              Home & Service Vendors
            </span>
          </h2>

          <p className="text-gray-800 text-xl leading-relaxed">
            Through our platform, users can easily book reliable services for
            their homes, offices, and daily needs. From cleaning to repairs —
            we connect you with verified professionals near you.
          </p>

          <p className="text-gray-800 text-xl leading-relaxed">
            Any vendor can apply — especially those who are skilled,
            certified, professional, and customer-focused.
          </p>

          <div className="flex gap-4 flex-wrap pt-4">
            <button 
              onClick={() => navigate('/services')}
              className="border-2 border-[#1B4B36] text-[#1B4B36] px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition"
            >
              Explore Services
            </button>

            <button 
              onClick={onBecomeVendor}
              className="bg-[#1B4B36] text-yellow-500 border-2 border-[#1B4B36] px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 hover:text-[#1B4B36] transition"
            >
              Become a Vendor
            </button>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex flex-col gap-8">

          {/* Image */}
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img
              src={handshake}
              alt="Vendors"
              className="w-full h-[360px] object-cover"
            />
          </div>

          {/* Vendor Types */}
          <div className="bg-gray-100 rounded-2xl py-12 flex flex-col pr-8 pl-4 gap-5 shadow-xl shadow-yellow-500">
            <h4 className="font-bold text-2xl mb-6 text-[#1B4B36]">
              Types of Vendors We Encourage
            </h4>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                "Home & Deep Cleaning Experts",
                "Electricians, Plumbers & Handymen",
                "AC & Appliance Technicians",
                "Pest Control & Disinfection Services",
                "Painting & Renovation Teams",
                "Childcare, Elder Care & Personal Help",
              ].map((item, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3"
                >
                  <span className="text-lg bg-[#1B4B36] text-yellow-500 rounded-full">
                    <TiTick />
                  </span>

                  <span
                    className="
          text-lg
          font-medium
          text-gray-800
          leading-tight
          lg:whitespace-nowrap
        "
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>

          </div>

        </div>
      </div>
    </section>
  );
};

export default Description;
