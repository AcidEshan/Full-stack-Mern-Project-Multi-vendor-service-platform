import React from "react";
import { NavLink } from "react-router-dom";

// Replace this with your logo
import logo from "../../Images/logo.png"; // <-- change path if needed

const Footer = () => {
  return (
    <footer className="w-full py-12 bg-[#1B4B36] rounded-3xl mt-20">
      <div className=" px-10 py-14 text-white">

        {/* TOP CONTENT */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* BRAND */}
          <div className="space-y-4 items-start">
            <div className="flex gap-3">
              <img
                src={logo}
                alt="Logo"
                className="w-50 h-15 rounded-full"
              />
            </div>

            <p className="text-lg text-gray-200 leading-relaxed font-medium">
              Ous service platform connecting users with trusted and verified
              service providers. Reliable solutions for everyday needs.
            </p>
          </div>

          {/* SERVICES */}
          <div>
            <h4 className="font-bold mb-4 uppercase text-xl tracking-wide text-gray-300">
              Services
            </h4>

            <ul className="space-y-2 text-lg">
              <li><NavLink to="/services">Home Cleaning</NavLink></li>
              <li><NavLink to="/services">Electrical Services</NavLink></li>
              <li><NavLink to="/services">Plumbing</NavLink></li>
              <li><NavLink to="/services">Renovation</NavLink></li>
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h4 className="font-bold mb-4 uppercase text-xl tracking-wide text-gray-300">
              Company
            </h4>

            <ul className="space-y-2 text-lg">
              <li><NavLink to="/about">About Us</NavLink></li>
              <li><NavLink to="/contact">Contact</NavLink></li>
              <li><NavLink to="/vendor">Vendors</NavLink></li>
              <li><NavLink to="/services">Services</NavLink></li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div>
            <h4 className="font-semibold mb-4 uppercase text-sm tracking-wide text-gray-300">
              Newsletter
            </h4>

            <p className="text-sm text-gray-200 mb-4">
              Subscribe to get service updates and offers.
            </p>

            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded-l-lg text-black focus:outline-none border border-yellow-500"
              />
              <button className="bg-yellow-400 px-5 py-2 rounded-r-lg font-semibold text-[#1B4B36] hover:bg-yellow-500 transition">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-white/20 mt-12 pt-6 text-center text-sm text-gray-200">
          © {new Date().getFullYear()} All rights reserved by সমাধান আছে
        </div>

      </div>
    </footer>
  );
};

export default Footer;
