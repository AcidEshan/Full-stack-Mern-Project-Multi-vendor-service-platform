import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Hero from './Components/Hero';
import ShortDescription from './Components/ShortDescription';
import Explore from './Components/Explore';
import AboutUs from './Components/AboutUs';
import ContactUs from './Components/ContactUs';
import CardShow from './Components/CardShow';
import Description from './Components/Description';
import ServiceCards from './Components/ServiceCards';
import Features from './Components/Features';
import OurGoals from './Components/OurGoals';

const Home = () => {
    const { onBecomeVendor } = useOutletContext();
    
    return (
        <div>
            <Hero/>
            <AboutUs/>
            <ServiceCards/>
            <ContactUs/>
            <CardShow/>
            <Description onBecomeVendor={onBecomeVendor} />
            <Features/>
            <OurGoals/>
        </div>
    );
};

export default Home;