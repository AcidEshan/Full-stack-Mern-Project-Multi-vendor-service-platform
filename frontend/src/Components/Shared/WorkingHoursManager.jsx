import React, { useState, useEffect } from 'react';
import { FaClock, FaPlus, FaTrash, FaToggleOn, FaToggleOff, FaSave } from 'react-icons/fa';
import { vendorApi } from '../../api/vendorApi';
import Toast from './Toast';

const WorkingHoursManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({ date: '', reason: '' });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [workingHours, setWorkingHours] = useState({
    Monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    Tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    Wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    Thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    Friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    Saturday: { isOpen: true, openTime: '10:00', closeTime: '16:00' },
    Sunday: { isOpen: false, openTime: '', closeTime: '' }
  });

  useEffect(() => {
    fetchWorkingHours();
  }, []);

  const fetchWorkingHours = async () => {
    try {
      setLoading(true);
      const response = await vendorApi.getMyProfile();
      const vendor = response.data.vendor;
      
      if (vendor.workingHours) {
        // Merge vendor's working hours with default structure to ensure all days exist
        const defaultHours = {
          Monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          Tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          Wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          Thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          Friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
          Saturday: { isOpen: true, openTime: '10:00', closeTime: '16:00' },
          Sunday: { isOpen: false, openTime: '', closeTime: '' }
        };
        
        // Merge with defaults to ensure all properties exist
        const mergedHours = {};
        daysOfWeek.forEach(day => {
          mergedHours[day] = {
            isOpen: vendor.workingHours[day]?.isOpen ?? defaultHours[day].isOpen,
            openTime: vendor.workingHours[day]?.openTime ?? defaultHours[day].openTime,
            closeTime: vendor.workingHours[day]?.closeTime ?? defaultHours[day].closeTime
          };
        });
        
        setWorkingHours(mergedHours);
      }
      
      if (vendor.holidays) {
        setHolidays(vendor.holidays);
      }
    } catch (error) {
      console.error('Failed to load working hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (day) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen,
        openTime: !prev[day].isOpen ? '09:00' : prev[day].openTime,
        closeTime: !prev[day].isOpen ? '18:00' : prev[day].closeTime
      }
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSaveWorkingHours = async () => {
    try {
      setSaving(true);
      
      // Transform workingHours object to array format expected by backend
      const workingHoursArray = daysOfWeek.map(day => ({
        day: day.toLowerCase(),
        isOpen: workingHours[day].isOpen,
        ...(workingHours[day].isOpen && {
          openTime: workingHours[day].openTime,
          closeTime: workingHours[day].closeTime
        })
      }));
      
      await vendorApi.updateWorkingHours({ workingHours: workingHoursArray });
      setToast({ message: 'Working hours updated successfully', type: 'success' });
    } catch (error) {
      setToast({ 
        message: error.response?.data?.error?.message || 'Failed to update working hours', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.reason.trim()) {
      setToast({ message: 'Please enter both date and reason', type: 'error' });
      return;
    }

    // Check if date is in the future
    const selectedDate = new Date(newHoliday.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setToast({ message: 'Holiday date must be in the future', type: 'error' });
      return;
    }

    try {
      await vendorApi.addHoliday(newHoliday);
      setToast({ message: 'Holiday added successfully', type: 'success' });
      setNewHoliday({ date: '', reason: '' });
      await fetchWorkingHours();
    } catch (error) {
      setToast({ 
        message: error.response?.data?.error?.message || 'Failed to add holiday', 
        type: 'error' 
      });
    }
  };

  const handleRemoveHoliday = async (holidayId) => {
    if (!window.confirm('Are you sure you want to remove this holiday?')) return;

    try {
      await vendorApi.removeHoliday(holidayId);
      setToast({ message: 'Holiday removed successfully', type: 'success' });
      await fetchWorkingHours();
    } catch (error) {
      setToast({ message: 'Failed to remove holiday', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="loading loading-spinner loading-lg text-[#1B4B36]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Working Hours Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaClock className="text-[#1B4B36]" />
            Weekly Working Hours
          </h3>
          <button
            onClick={handleSaveWorkingHours}
            disabled={saving}
            className="btn btn-sm bg-[#1B4B36] text-white hover:bg-[#2d7a54] disabled:opacity-50"
          >
            <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-3">
          {daysOfWeek.map((day) => {
            const dayData = workingHours[day] || { isOpen: false, openTime: '', closeTime: '' };
            return (
              <div
                key={day}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-colors ${
                  dayData.isOpen 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {/* Day Name */}
                <div className="w-32 font-semibold text-gray-800">{day}</div>

              {/* Toggle */}
              <button
                onClick={() => handleToggleDay(day)}
                className="flex items-center gap-2"
              >
                {dayData.isOpen ? (
                  <FaToggleOn className="text-3xl text-green-600" />
                ) : (
                  <FaToggleOff className="text-3xl text-gray-400" />
                )}
              </button>

              {/* Time Pickers */}
              {dayData.isOpen ? (
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="time"
                    value={dayData.openTime}
                    onChange={(e) => handleTimeChange(day, 'openTime', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                  />
                  <span className="text-gray-600">to</span>
                  <input
                    type="time"
                    value={dayData.closeTime}
                    onChange={(e) => handleTimeChange(day, 'closeTime', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
                  />
                </div>
              ) : (
                <span className="text-gray-500 italic">Closed</span>
              )}
            </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              const allOpen = {};
              daysOfWeek.forEach(day => {
                allOpen[day] = { isOpen: true, openTime: '09:00', closeTime: '18:00' };
              });
              setWorkingHours(allOpen);
            }}
            className="btn btn-sm btn-outline border-[#1B4B36] text-[#1B4B36]"
          >
            Open All Days
          </button>
          <button
            onClick={() => {
              setWorkingHours(prev => ({
                ...prev,
                Saturday: { isOpen: false, openTime: '', closeTime: '' },
                Sunday: { isOpen: false, openTime: '', closeTime: '' }
              }));
            }}
            className="btn btn-sm btn-outline border-gray-400 text-gray-700"
          >
            Close Weekends
          </button>
        </div>
      </div>

      {/* Holidays Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Holidays & Special Closures
        </h3>

        {/* Add Holiday Form */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-800 mb-3">Add New Holiday</h4>
          <div className="flex gap-3">
            <input
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday(prev => ({ ...prev, date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
            />
            <input
              type="text"
              value={newHoliday.reason}
              onChange={(e) => setNewHoliday(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Reason (e.g., Eid Holiday, Vacation)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4B36] focus:border-transparent"
            />
            <button
              onClick={handleAddHoliday}
              className="btn bg-[#1B4B36] text-white hover:bg-[#2d7a54]"
            >
              <FaPlus /> Add
            </button>
          </div>
        </div>

        {/* Holidays List */}
        {holidays.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No holidays scheduled</p>
          </div>
        ) : (
          <div className="space-y-2">
            {holidays
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((holiday) => (
                <div
                  key={holiday._id || holiday.date}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      {new Date(holiday.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-600">{holiday.reason}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveHoliday(holiday._id || holiday.date)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default WorkingHoursManager;
