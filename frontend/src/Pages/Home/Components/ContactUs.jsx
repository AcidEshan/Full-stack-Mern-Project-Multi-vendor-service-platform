import acMechanic from '../../../../Images/AcMechanic.jpg';
import babySitter from '../../../../Images/babysitter.jpg';
import stoveMechanic from '../../../../Images/stoveMechanic.webp';

import { FaLocationDot } from "react-icons/fa6";
import { RiContactsBook3Fill } from "react-icons/ri";
import { FaChartLine } from "react-icons/fa";

const ContactUs = () => {
  return (
    <section className="max-w-[90rem] mx-auto px-4 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">

        {/* LEFT SIDE — TEXT CONTENT */}
        <div className="flex flex-col justify-center">
          <p className="text-xl text-yellow-500 font-semibold mb-2">
            • Contact Us
          </p>

          <h2 className="text-4xl font-bold leading-snug text-yellow-500">
            We’re here when{" "}
            <span className="text-[#1B4B36]">you need us</span>
          </h2>

          <p className="mt-5 text-xl text-gray-700">
            Tell us what you need — we’ll connect you with the right service partner.
          </p>

          {/* INFO ROW */}
          <div className="flex flex-col sm:flex-row gap-10 mt-10">

            {/* Location */}
            <div>
              <FaLocationDot className="text-4xl text-[#1B4B36]" />
              <h4 className="font-semibold text-xl mt-3">Our Location</h4>
              <p className="text-lg text-gray-700">
                Banasree, Dhaka, Bangladesh
              </p>
            </div>

            {/* Contact */}
            <div className="sm:border-l sm:pl-8">
              <RiContactsBook3Fill className="text-4xl text-yellow-500" />
              <h4 className="font-semibold text-xl mt-3">Contact Us</h4>
              <p className="text-lg text-gray-700 mt-1">
                Email: eshamlucifer@gmail.com
              </p>
              <p className="text-lg text-gray-700">
                Phone: +8801718440268
              </p>
            </div>
          </div>

          {/* CTA */}
          <button className="mt-12 bg-yellow-400 hover:bg-[#1B4B36] hover:text-yellow-500 transition px-8 py-3 rounded-lg font-medium w-fit">
            Contact Us →
          </button>
        </div>

        {/* RIGHT SIDE — IMAGE GRID (35% / 65%) */}
        <div className="grid grid-cols-8 grid-rows-[240px_260px] gap-6 h-full">

          {/* TOP IMAGE — 35% */}
          <div className="col-span-3 h-full rounded-3xl overflow-hidden">
            <img
              src={acMechanic}
              alt="AC Mechanic"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>

          {/* EXPERIENCE CARD — 65% */}
          <div className="col-span-5 h-full border-2 border-yellow-500 rounded-3xl p-6 flex flex-col justify-center shadow-sm">
            <FaChartLine className="text-5xl text-[#1B4B36] mb-4" />
            <h3 className="font-bold text-2xl mb-2">
              Growing With Your Needs
            </h3>
            <p className="text-lg font-medium">
              We’re building a better way to connect services and customers — step by step.
            </p>
          </div>

          {/* BOTTOM LARGE IMAGE — 65% */}
          <div className="col-span-5 h-full rounded-3xl overflow-hidden">
            <img
              src={stoveMechanic}
              alt="Stove Mechanic"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>

          {/* BOTTOM SMALL IMAGE — 35% */}
          <div className="col-span-3 h-full rounded-3xl overflow-hidden">
            <img
              src={babySitter}
              alt="Babysitter"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default ContactUs;
