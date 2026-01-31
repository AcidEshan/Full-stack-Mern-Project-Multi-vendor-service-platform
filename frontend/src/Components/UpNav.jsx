import React from 'react';
import { TbWorld } from "react-icons/tb";
import { IoIosArrowDown } from "react-icons/io";
import { NavLink } from 'react-router-dom';




const UpNav = ({ onBecomeVendor }) => {
    return (
        <div className='bg-[#1B4B36] h-15 flex items-center text-yellow-500 justify-end px-20 relative z-3'>
            <div className='flex items-center text-xl gap-2'>
               <TbWorld /><p>English</p> <IoIosArrowDown />
               <div className='h-10 w-px bg-yellow-500'></div>
               <div className='flex gap-x-3 items-center-safe'>
                <NavLink to='/about'><p>ABOUT</p></NavLink>
                 <div className='h-10 w-px bg-yellow-500'></div>
               </div>
               <div>
                <button 
                    onClick={onBecomeVendor}
                    className='bg-yellow-500 text-[#1B4B36] border-2 border-yellow-500 px-5 py-2 rounded-full text-center items-center hover:bg-[#045344] hover:text-yellow-500 text-xl'
                >
                    Become a Vendor
                </button>
               </div>
            </div>
            
        </div>
    );
};

export default UpNav;