import React, { useState } from 'react';
import Explore from '../Home/Components/Explore';
import { contactApi } from '../../api/contactApi';

const ConnectWithUs = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      message: ''
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

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      
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
      const nameError = validateName(formData.name);
      const emailError = validateEmail(formData.email);
      const phoneError = validatePhone(formData.phone);
      const messageError = validateMessage(formData.message);
      
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
        
        const response = await contactApi.sendMessage(formData);
        
        if (response.success) {
          setSuccess(true);
          setFormData({
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

    return (
        <div>
             <section className="max-w-[90rem] mx-auto px-6 py-16">
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
        {/* LEFT — Steps */}
        <div className="bg-white border-2 rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1B4B36] mb-4">
            Connect With Us
          </h2>

          <p className="text-gray-600 leading-relaxed mb-4">
            We connect you with trusted and verified service providers across
            Dhaka. From repairs to cleaning, renovation to urgent home support —
            get the right help, exactly when you need it.
          </p>

          <p className="text-gray-600 leading-relaxed mb-3">
            Our role is to make your experience simple, transparent, and safe.
            Every vendor on our platform shares service details, pricing, and
            availability clearly before you book.
          </p>

          <p className="text-gray-600 leading-relaxed">
            By continuing, you agree that you will review all information, ask
            questions when needed, and contact support if anything feels unclear
            — we’re always here to help.
          </p>
        </div>

        {/* RIGHT — Content + Terms */}
        
        <div className="bg-white border-2 rounded-2xl shadow-2xl p-8">
          <h4 className="text-xl font-semibold mb-4 text-[#1B4B36]">
            Send Us a Message
          </h4>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="example@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                maxLength="11"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="01XXXXXXXXX"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Bangladeshi number (11 digits starting with 01)</p>
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                onBlur={handleBlur}
                rows="5"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent resize-none ${
                  errors.message ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="How can we help you?"
              />
              {errors.message && (
                <p className="mt-1 text-sm text-red-600">{errors.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Minimum 10 characters</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#1B4B36] text-white py-3 rounded-lg font-semibold transition-all ${
                loading 
                  ? 'opacity-70 cursor-not-allowed' 
                  : 'hover:bg-[#143426] hover:shadow-lg'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </span>
              ) : (
                'Send Your Message'
              )}
            </button>
          </form>

          <p className="text-sm text-gray-500 mt-4 leading-relaxed">
            Note: We typically respond within 24-48 hours during business days.
          </p>
        </div>
      </div>
    </section>
        </div>
    );
};

export default ConnectWithUs;