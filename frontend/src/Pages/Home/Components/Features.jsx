import React from "react";
import { FaShieldAlt } from "react-icons/fa";
import {
  FiClock,
  FiLayers,
  FiSettings,
} from "react-icons/fi";

const features = [
  {
    title: "24/7 Emergency Services",
    description:
      "We're here for you any time, day or night, to resolve urgent issues.",
    icon: <FiClock />,
    bg: "bg-[#1B4B36]",
    text: "text-yellow-500",
  },
  {
    title: "Advanced Technology",
    description:
      "We use state-of-the-art tools and techniques to deliver efficient results.",
    icon: <FiLayers />,
    bg: "bg-[#1B4B36]",
    text: "text-yellow-500",
  },
  {
    title: "Safety First Approach",
    description:
      "Your safety is our priority. We strictly follow industry standards.",
    icon: <FaShieldAlt />,
    bg: "bg-[#1B4B36]",
    text: "text-yellow-500",
  },
  {
    title: "Customizable Solutions",
    description:
      "We provide tailored service solutions designed to fit your needs.",
    icon: <FiSettings />,
    bg: "bg-[#1B4B36]",
    text: "text-yellow-500",
  },
];

const Features = () => {
  return (
    <section className="py-24">
      <div className="max-w-[90rem] mx-auto px-6">

        {/* SECTION HEADING */}
        <div className="text-center mb-16">
          <p className="text-md font-bold tracking-widest text-yellow-500 flex justify-center items-center gap-2">
            <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
            OUR FEATURES
          </p>

          <h2 className="text-4xl font-bold mt-4 text-[#1B4B36]">
            Features that define our quality{" "}
            <span className="text-yellow-400">and reliability</span>
          </h2>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center gap-5"
            >
              {/* ICON */}
              <div
                className={`w-16 h-16 flex items-center justify-center hover:bg-yellow-500 hover:text-[#1B4B36] transition-all duration-700 rounded-full text-2xl ${feature.bg} ${feature.text}`}
              >
                {feature.icon}
              </div>

              {/* TITLE */}
              <h3 className="text-xl font-semibold text-[#1B4B36]">
                {feature.title}
              </h3>

              {/* DESCRIPTION */}
              <p className="text-gray-600 text-base max-w-xs">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Features;
