import React from 'react';
import { useEffect, useRef } from "react";
import { FaAngleDoubleDown } from "react-icons/fa";



const cardsData = [
  {
    title: "Explore as a Client",
    description:
      "Find trusted renovation vendors for any size project — from quick fixes to full remodels. Compare options, connect instantly, and get your work done with confidence.",
    button: "Get Started",
  },
  {
    title: "Become a Vendor",
    description:
      "Showcase your skills, reach more clients, and grow your business. Join our platform to receive job leads, manage projects, and build your reputation.",
    button: "Join as Vendor",
  },
];

const Explore = () => {
  const exploreRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  return (
    <div className="w-full bg-gray-100">
      {/* Banner Section */}
      <section className="container mx-auto py-8">
        <div className="bg-[#FCDE70] flex flex-col md:flex-row items-center justify-between rounded-lg p-6  shadow-2xl">
          <div className="text-[#1B4B36] max-w-xl flex flex-col gap-5">
            <h2 className="text-4xl font-bold mb-2">
              Find the right people, tools, and expertise all in one place.
            </h2>
            <p className="text-2xl font-semibold">We're the Bridge between you.</p>
          </div>

          <button onClick={() =>
        exploreRef.current?.scrollIntoView({ behavior: "smooth" })} className="mt-4 md:mt-0 bg-[#1B4B36] text-[#FCDE70] border-2 border-[#1B4B36] text-xl font-semibold px-6 py-3 rounded-md hover:bg-[#FCDE70] hover:text-[#1B4B36] transition flex items-center  gap-3">
            Explore roles<span className="animate-bounce"><FaAngleDoubleDown /></span>
          </button>
        </div>
      </section>

      {/* Cards Section */}
      <section id='explore-section' ref={exploreRef} className="bg-[#1B4B36] py-16 container mx-auto rounded-xl shadow-2xl">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 justify-items-center">
            {cardsData.map((card, index) => (
              <div
                key={index}
                className="bg-[#FCDE70] text-[#1B4B36] rounded-2xl shadow-md border p-8 w-full max-w-md flex flex-col justify-between text-center"
              >
                <div>
                  <h3 className="text-3xl font-bold mb-4">
                    {card.title}
                  </h3>

                  <p className="text-lg font-semibold leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <button className="mt-8 border-2 border-[#1B4B36] text-xl font-medium py-2 px-4 rounded-md bg-[#1B4B36] text-[#FCDE70] hover:bg-[#FCDE70] hover:text-[#1B4B36] transition">
                  {card.button}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
};

export default Explore;