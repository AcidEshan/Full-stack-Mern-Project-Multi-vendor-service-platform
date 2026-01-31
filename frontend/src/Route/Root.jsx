import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import UpNav from '../Components/UpNav';
import Footer from '../Components/Footer';
import VerifyEmailNotification from '../Components/VerifyEmailNotification';
import SignupModal from '../Pages/Auth/SignupModal';
import useAuthStore from '../store/authStore';

const Root = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [showVendorSignupModal, setShowVendorSignupModal] = useState(false);

    useEffect(() => {
        if (location.state?.showEmailVerification) {
            setShowEmailVerification(true);
            setUserEmail(location.state.userEmail);
            // Clear the state to prevent showing notification on page refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location, navigate]);

    const handleShowEmailVerification = () => {
        if (user && user.email) {
            setUserEmail(user.email);
            setShowEmailVerification(true);
        }
    };

    return (
        <div>
            <UpNav onBecomeVendor={() => setShowVendorSignupModal(true)} />
            <Navbar onShowEmailVerification={handleShowEmailVerification} />
            
            {/* Email Verification Notification - Below Navbar */}
            {showEmailVerification && isAuthenticated && user?.role === 'user' && !user?.isEmailVerified && (
                <VerifyEmailNotification
                    userEmail={userEmail}
                    onClose={() => setShowEmailVerification(false)}
                />
            )}
            
            {/* Vendor Signup Modal */}
            {showVendorSignupModal && (
                <SignupModal
                    onClose={() => setShowVendorSignupModal(false)}
                    onSwitchToLogin={() => setShowVendorSignupModal(false)}
                    preSelectedRole="vendor"
                    lockRole={true}
                />
            )}
            
            <Outlet context={{ onBecomeVendor: () => setShowVendorSignupModal(true) }}/>
            <Footer/>
        </div>
    );
};

export default Root;