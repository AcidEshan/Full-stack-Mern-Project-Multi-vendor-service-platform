import React from "react";
import { VscWorkspaceTrusted } from "react-icons/vsc";
import { FaPhone } from "react-icons/fa6";
import {
    FiUsers,
} from "react-icons/fi";

import img1 from "../../../../Images/our-goals-img-1.jpg"; // replace with your images
import img2 from "../../../../Images/our-goals-img-12.jpg";
import img3 from "../../../../Images/our-goals-img-3.jpg";
import img4 from "../../../../Images/our-goals-img-33.jpg";

const OurGoals = () => {
    return (
        <section className="">
            <div className="max-w-[90rem] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                {/* LEFT CONTENT */}
                <div>
                    {/* Small heading */}
                    <p className="text-sm font-bold tracking-widest text-[#1B4B36] flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 bg-[#1B4B36] rounded-full"></span>
                        OUR GOALS
                    </p>

                    {/* Main heading */}
                    <h2 className="text-4xl font-bold leading-snug text-[#1B4B36]">
                        Connecting the right people to the{" "}
                        <span className="text-yellow-400">
                            right service experts
                        </span>
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 text-lg mt-6 max-w-xl leading-relaxed">
                        Our mission is to act as a trusted bridge between users facing real-life
                        problems and skilled service providers who can solve them. We ensure
                        that every request reaches the right professional — quickly, safely,
                        and reliably.
                    </p>

                    {/* Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">

                        <div className="border rounded-2xl p-6 bg-white shadow-sm">
                            <FiUsers className="text-3xl text-[#1B4B36] mb-4" />
                            <h4 className="text-lg font-semibold mb-2">
                                Right Match, Every Time
                            </h4>
                            <p className="text-gray-600 text-sm">
                                We connect users with verified experts who are best suited
                                to solve their specific problems.
                            </p>
                        </div>
                        <div className="border rounded-2xl p-6 bg-white shadow-sm">
                            <VscWorkspaceTrusted className="text-3xl text-[#1B4B36] mb-4" />
                            <h4 className="text-lg font-semibold mb-2">
                                Trust & Reliability
                            </h4>
                            <p className="text-gray-600 text-sm">
                                Every service provider is carefully reviewed to ensure
                                safety, professionalism, and quality service.
                            </p>
                        </div>

                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-6 mt-10">
                        <button className="bg-yellow-400 hover:bg-[#1B4B36] hover:text-yellow-400 transition px-6 py-3 rounded-lg font-semibold text-[#1B4B36]">
                            Know More →
                        </button>

                        <div className="flex items-center gap-3 text-[#1B4B36] font-medium">
                            <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1B4B36] text-yellow-400">
                                <FaPhone/>
                            </span>
                            +8801718440268
                        </div>
                    </div>
                </div>

                {/* RIGHT IMAGES GRID */}
                <div className="grid grid-cols-2 gap-6 ml-20">

                    {/* LEFT COLUMN — SHORTER IMAGES */}
                    <div className="flex flex-col gap-4 mt-13">
                        <div className="h-[250px] w-[231px] rounded-2xl overflow-hidden shadow-lg ml-23">
                            <img
                                src={img1}
                                alt="Service Work"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="h-[250px] w-[231px] rounded-2xl overflow-hidden shadow-lg ml-23">
                            <img
                                src={img3}
                                alt="Service Work"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN — TALLER IMAGES */}
                    <div className="flex flex-col gap-4 ml-6 mt-5">
                        <div className="h-[280px] w-[271px] rounded-2xl overflow-hidden shadow-lg ">
                            <img
                                src={img2}
                                alt="Service Work"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <div className="h-[280px] w-[271px] rounded-2xl overflow-hidden shadow-lg">
                            <img
                                src={img4}
                                alt="Service Work"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                </div>


            </div>
        </section>
    );
};

export default OurGoals;
