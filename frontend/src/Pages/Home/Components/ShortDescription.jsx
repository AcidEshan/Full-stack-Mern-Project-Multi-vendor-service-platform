import React from 'react';
import homecleanlogo from '../../../../Images/homecleanlogo.jpg'

const ShortDescription = () => {
    return (
        <div className="">
            <div className='text-5xl font-semibold flex justify-center mt-20'>
                Our Services
            </div>
            <div className='section1'>
                <div className='flex items-center w-150 gap-5'>
                    <div className="bg-base-100 border-base-300 collapse border">
                        <input type="checkbox" className="peer" />
                        <div
                            className="collapse-title bg-[#045344] text-[#ddab4e] peer-checked:bg-[#ddab4e] peer-checked:text-[#045344] text-xl font-semibold"
                        >
                            Home Cleaning Services
                        </div>
                        <div
                            className="collapse-content bg-[#ddab4e] text-primary-content peer-checked:bg-[#ddab4e] peer-checked:text-[#045344] font-semibold"
                        >
                            Professional home cleaning solutions to keep your living space fresh, hygienic, and organized.
                            Our trained cleaners use safe products to ensure deep cleaning for a healthier home.
                        </div>
                    </div>
                    <div className="hover:rotate-x-360 transform-all duration-700">
                        <img className='w-30 h-20 ' src={homecleanlogo}></img>
                    </div>
                </div>
                <div className='flex items-center w-150 gap-5'>
                    <div className="bg-base-100 border-base-300 collapse border">
                        <input type="checkbox" className="peer" />
                        <div
                            className="collapse-title bg-[#ddab4e] text-[#045344] peer-checked:bg-[#045344] peer-checked:text-[#ddab4e] text-xl font-semibold"
                        >
                            Home Renovation Services
                        </div>
                        <div
                            className="collapse-content bg-[#045344] text-primary-content peer-checked:bg-[#045344] peer-checked:text-[#ddab4e] font-semibold"
                        >
                            Expert renovation services to improve the comfort, design, and functionality of your home.
                            We provide reliable solutions for repairs, remodeling, and modern home upgrades.
                        </div>
                    </div>
                    <div className="hover:rotate-x-360 transform-all duration-700">
                        <img className='w-30 h-20' src={homecleanlogo}></img>
                    </div>
                </div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>

    );
};

export default ShortDescription;