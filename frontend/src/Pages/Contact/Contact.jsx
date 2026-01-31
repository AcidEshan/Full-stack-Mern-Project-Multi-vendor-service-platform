import React from 'react';
import { useState } from "react";
import { FaLocationArrow } from "react-icons/fa6";
import { IoIosMail } from "react-icons/io";
import { FaPhone } from "react-icons/fa6";
import ContactUs from '../Home/Components/ContactUs';
import TittleSection from "../../Components/Shared/TittleSection";
import aboutBg from '../../../Images/about-bg.jpg';
import { contactApi } from '../../api/contactApi';





const Contact = () => 
    {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validation functions
  const validateName = (name) => {
    if (!name.trim()) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name can only contain letters and spaces';
    return '';
  };

  const validateEmail = (email) => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone.trim()) return 'Phone number is required';
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(phone)) return 'Please enter a valid Bangladeshi phone number (11 digits starting with 01)';
    return '';
  };

  const validateMessage = (message) => {
    if (!message.trim()) return 'Message is required';
    if (message.trim().length < 10) return 'Message must be at least 10 characters';
    return '';
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear success message
    if (success) setSuccess(false);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = '';
    
    switch (name) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'phone':
        error = validatePhone(value);
        break;
      case 'message':
        error = validateMessage(value);
        break;
      default:
        break;
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const nameError = validateName(form.name);
    const emailError = validateEmail(form.email);
    const phoneError = validatePhone(form.phone);
    const messageError = validateMessage(form.message);
    
    if (nameError || emailError || phoneError || messageError) {
      setErrors({
        name: nameError,
        email: emailError,
        phone: phoneError,
        message: messageError
      });
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      
      const response = await contactApi.sendMessage(form);
      
      if (response.success) {
        setSuccess(true);
        setForm({
          name: '',
          email: '',
          phone: '',
          message: ''
        });
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setErrors({ 
        submit: error.response?.data?.message || 'Failed to send message. Please try again later.' 
      });
    } finally {
      setLoading(false);
    }
  };
    return (<div>
      <div className="container mx-auto  mt-10">
      <TittleSection
        title="Contact Us"
        bgImage={aboutBg}
      /></div>
        <div className="max-w-[90rem] mx-auto px-4 md:px-10 my-16">
          
      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            ✓ Your message has been sent successfully! We'll get back to you soon.
          </p>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">✗ {errors.submit}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* LEFT — CONTACT FORM */}
        <div className="bg-gray-50 rounded-3xl p-8 shadow-sm border">
          <p className="text-green-700 font-semibold mb-2">
            ● CONTACT US
          </p>

          <h2 className="text-3xl md:text-4xl font-bold">
            Contact us & let's <br />
            <span className="text-yellow-500">collaborate!</span>
          </h2>

          <p className="text-gray-600 mt-3">
            Whether it's a small repair or a big project — 
            we connect you with trusted vendors and reliable services.
          </p>

          <hr className="my-6" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                name="name"
                placeholder="Name"
                className={`w-full border rounded-lg px-4 py-3 outline-none ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  name="email"
                  placeholder="Email"
                  className={`w-full border rounded-lg px-4 py-3 outline-none ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <input
                  name="phone"
                  placeholder="Phone (01XXXXXXXXX)"
                  maxLength="11"
                  className={`w-full border rounded-lg px-4 py-3 outline-none ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <textarea
                name="message"
                placeholder="Message (minimum 10 characters)"
                rows="4"
                className={`w-full border rounded-lg px-4 py-3 outline-none ${
                  errors.message ? 'border-red-500' : 'border-gray-300'
                }`}
                value={form.message}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-600">{errors.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`bg-yellow-400 hover:bg-yellow-500 transition px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                'Send Your Message →'
              )}
            </button>
          </form>
        </div>

        {/* RIGHT — MAP + INFO */}
        <div>
          {/* MAP */}
          <div className="rounded-3xl overflow-hidden border shadow-sm">
            <iframe
              title="map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.7052096124844!2d90.426!3d23.792!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c7a0a7853c09%3A0x8c2dc61c!2sBanasree%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v0000000000"
              width="100%"
              height="380"
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>

          {/* CONTACT DETAILS */}
          <div className="mt-6 space-y-5">

            <div>
              <p className="font-bold flex items-center gap-2">
               <p className='text-xl text-yellow-500 bg-[#1B4B36] p-2 rounded-full'><FaLocationArrow /> </p> Location
              </p>
              <p className="text-gray-600">
                Banasree, Dhaka, Bangladesh
              </p>
            </div>

            <div>
              <p className="font-bold flex items-center gap-2">
                <p className='text-xl text-yellow-500 bg-[#1B4B36] p-2 rounded-full'><IoIosMail /></p> Email
              </p>
              <p className="text-gray-600">
                eshanlucifer@gmail.com
              </p>
            </div>

            <div>
              <p className="font-bold flex items-center gap-2">
                <p className='text-xl text-yellow-500 bg-[#1B4B36] p-2 rounded-full'><FaPhone /></p> Phone
              </p>
              <p className="text-gray-600">
                +880 1718440268
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
    </div>
    );
};

export default Contact;
