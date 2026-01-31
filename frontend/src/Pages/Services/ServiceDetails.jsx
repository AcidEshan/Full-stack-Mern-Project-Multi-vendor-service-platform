import { useParams, useNavigate } from "react-router-dom";
import services from "../../Services.json";
import vendors from "../../VendorProfile.json";
import { useState } from "react";

const ServiceDetails = () => {
  const { vendorId, serviceId } = useParams();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  // find vendor
  const vendor = vendors.find(
    v => String(v.vendorId) === String(vendorId)
  );

  // find service
  const service = services.find(
    s =>
      String(s.vendorId) === String(vendorId) &&
      s.serviceId === serviceId
  );

  if (!vendor || !service) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        Service not found
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">

      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-[#1B4B36]">
          {service.title}
        </h1>
        <p className="text-gray-600 mt-1">
          {vendor.name} · {vendor.service}
        </p>
      </div>

      {/* Price Section */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <p className="text-sm text-gray-500">Service Price</p>
        <p className="text-4xl font-bold text-green-700">
          ৳{service.price}
        </p>
        <p className="text-sm text-gray-500">
          Billing: {service.billingType}
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-2">
          Service Overview
        </h3>
        <p className="text-gray-700 leading-relaxed">
          {service.overview}
        </p>
      </div>

      {/* Work Process */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-3">
          How the work will be done
        </h3>
        <ul className="list-decimal pl-6 space-y-2 text-gray-700">
          {service.workProcess.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ul>
      </div>

      {/* Key Info */}
      <div className="grid md:grid-cols-3 gap-4">
        <InfoCard title="Manpower" value={`${service.manpower} Person`} />
        <InfoCard title="Estimated Time" value={service.timeRange} />
        <InfoCard
          title="Tools Used"
          value={service.tools.join(", ")}
        />
      </div>

      {/* Safety Measures */}
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-3">
          Safety Measures
        </h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          {service.safetyMeasures.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Terms & Conditions (Scrollable) */}
      <div className="bg-yellow-50 border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-3">
          Terms & Conditions
        </h3>

        <div className="max-h-40 overflow-y-auto border bg-white p-4 text-sm whitespace-pre-wrap">
          {service.terms}
        </div>

        <label className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            checked={accepted}
            onChange={() => setAccepted(!accepted)}
          />
          <span className="text-sm">
            I have read and agree to the terms & conditions
          </span>
        </label>
      </div>

      {/* Confirm Booking Button */}
      <button
        disabled={!accepted}
        onClick={() =>
          navigate(`/booking/${vendor.vendorId}/${service.serviceId}`)
        }
        className={`w-full py-4 rounded-xl font-semibold text-lg transition
        ${
          accepted
            ? "bg-[#1B4B36] text-white hover:bg-green-800"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        Confirm Booking
      </button>
    </div>
  );
};

const InfoCard = ({ title, value }) => (
  <div className="bg-white border rounded-xl p-5 shadow-sm">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="font-semibold text-gray-800 mt-1">{value}</p>
  </div>
);

export default ServiceDetails;
