import React from 'react';
import aboutBg from '../../../Images/about-bg.jpg'
import TittleSection from '../../Components/Shared/TittleSection';
import aboutBanner from '../../../Images/Drake-Funny-Meme.jpg'
import { IoBulbSharp, IoStar } from "react-icons/io5";
import { IoMdCall } from "react-icons/io";

const About = () => {
  return (
    <div>
      {/* Title Section */}
      <div className="container mx-auto mt-10">
        <TittleSection title="About Us" bgImage={aboutBg} />
      </div>

      {/* Main Content */}
      <div className="container mx-auto flex flex-col lg:flex-row gap-16 px-6 lg:px-20 mt-14">

        {/* LEFT — IMAGE WITH STICKY TEXT */}
        <div className="flex flex-col items-center w-full lg:w-1/2">
          <p className="text-3xl font-bold mb-6 text-center">
            Always Remember What We Say
          </p>

          {/* Image wrapper MUST be relative */}
          <div className="relative w-full">
            <img
              src={aboutBanner}
              alt="About Banner"
              className="w-full h-[50vh] object-cover border-2 border-yellow-500 rounded-2xl shadow-2xl"
            />

            {/* Overlay Text */}
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
              <p className="text-xl md:text-xl font-bold bg-white px-4 py-2 rounded-lg text-yellow-500 mb-4 translate-x-40 -mt-35">
                Got a daily-life problem? <br /> Don’t worry
              </p>

              <p className="text-xl md:text-xl font-bold bg-white px-4 py-2 rounded-lg text-[#1B4B36] translate-x-40 translate-y-35">
                we’ll find the best <br /> solution for you.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — CONTENT */}
        <div className="space-y-5 w-full lg:w-1/2 mt-6 lg:mt-0">

          <p className="text-green-700 font-semibold">• WHO WE ARE</p>

          <h2 className="text-4xl font-bold leading-tight">
            Trusted experts in
            <span className="text-yellow-500"> home services</span>
          </h2>

          <p className="text-gray-600">
            From quick fixes to full-scale projects, our verified professionals
            deliver reliable and safe services right at your doorstep — fast and hassle-free.
          </p>

          <ul className="space-y-2 text-gray-700">
            <li>✔ Dedicated to quality, safety, and timely service.</li>
            <li>✔ Experienced professionals you can trust.</li>
            <li>✔ Convenience, transparency, and fair pricing.</li>
          </ul>

          <div className="border rounded-2xl flex flex-col md:flex-row gap-6 p-5">

            <div className="flex gap-3 items-center">
              <div className="bg-green-900 text-yellow-500 text-2xl p-3 rounded-full">
                <IoBulbSharp />
              </div>
              <p className="font-semibold">
                We understand your everyday needs.
                <br />
                <span className="text-gray-600 font-normal">
                  We match you with the right expert.
                </span>
              </p>
            </div>

            <div className="flex gap-3 items-center">
              <div className="bg-yellow-300 text-[#1B4B36] text-2xl p-3 rounded-full">
                <IoStar />
              </div>
              <p className="font-semibold">
                Delivering outstanding results.
                <br />
                <span className="text-gray-600 font-normal">
                  Safe, responsible, professional work.
                </span>
              </p>
            </div>

          </div>

          <div className="flex flex-wrap items-center gap-5 mt-9">
            <button className="bg-yellow-400 px-6 py-3 rounded-xl font-semibold">
              Know More →
            </button>

            <div className="flex items-center gap-3">
              <div className="bg-[#1B4B36] p-3 text-yellow-500 text-2xl rounded-full">
                <IoMdCall />
              </div>
              <div>
                <p className="text-sm text-gray-500">Call Us 24/7</p>
                <p className="font-bold">+8801718440268</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;
