import plumber from '../../../../Images/plumber.jpg';
import electrician from '../../../../Images/electrician.jpg';
import pestcontrol from '../../../../Images/pestcontrol.jpg';

import { FaHandshake, FaLink } from "react-icons/fa";
import { BiSolidPhoneCall } from "react-icons/bi";
import { NavLink } from 'react-router-dom';

const AboutUs = () => {
  return (
    <section className="max-w-[90rem] mx-auto px-4 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">

        {/* LEFT SIDE — IMAGE GRID (35% / 65%) */}
        <div className="grid grid-cols-8 grid-rows-[240px_260px] gap-6 h-full">

          {/* TOP IMAGE — 35% */}
          <div className="col-span-3 h-full rounded-3xl overflow-hidden">
            <img
              src={plumber}
              alt="Plumber"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>

          {/* EXPERIENCE CARD — 65% */}
          <div className="col-span-5 h-full border-2 border-[#1B4B36] rounded-3xl p-6 flex flex-col justify-center shadow-sm">
            <FaHandshake className="text-5xl text-yellow-500 mb-4" />
            <h3 className="font-bold text-2xl mb-2">
              Smart Services, Simple Experience
            </h3>
            <p className="text-lg font-medium">
              Trusted service partners delivering reliable solutions.
            </p>
          </div>

          {/* BOTTOM LARGE IMAGE — 65% */}
          <div className="col-span-5 h-full rounded-3xl overflow-hidden">
            <img
              src={electrician}
              alt="Electrician"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>

          {/* BOTTOM SMALL IMAGE — 35% */}
          <div className="col-span-3 h-full rounded-3xl overflow-hidden">
            <img
              src={pestcontrol}
              alt="Pest Control"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>
        </div>

        {/* RIGHT SIDE — TEXT CONTENT */}
        <div className="flex flex-col justify-center">
          <p className="text-xl text-[#1B4B36] font-semibold mb-2">
            • Who We Are
          </p>

          <h2 className="text-4xl font-bold leading-snug text-[#1B4B36]">
            Complete service solutions for{" "}
            <span className="text-yellow-500">every need</span>
          </h2>

          <p className="mt-5 text-lg text-gray-700">
            From small fixes to major projects — we connect you with trusted,
            verified vendors ready to help whenever you need.
          </p>

          {/* FEATURES */}
          <div className="flex flex-col sm:flex-row gap-10 mt-10">

            {/* Support */}
            <div>
              <BiSolidPhoneCall className="text-4xl text-[#1B4B36]" />
              <h4 className="font-semibold text-xl mt-3">24/7 Our Support</h4>
              <p className="text-lg text-gray-700">
                Instant help for urgent service needs.
              </p>
            </div>

            {/* Connection */}
            <div className="sm:border-l sm:pl-8">
              <FaLink className="text-4xl text-yellow-500" />
              <h4 className="font-semibold text-xl mt-3">
                We connect you with trusted professionals
              </h4>
              <p className="text-lg text-gray-700">
                Skilled service providers focused on quality and reliability.
              </p>
            </div>
          </div>

          {/* CTA */}
          <NavLink to="/about">
            <button className="mt-12 bg-[#1B4B36] text-yellow-500 hover:bg-yellow-500 hover:text-[#1B4B36] transition px-8 py-3 rounded-lg font-medium w-fit">
              Connect With Us →
            </button>
          </NavLink>
        </div>

      </div>
    </section>
  );
};

export default AboutUs;