/* SectionCard.jsx */

import { Link } from "react-router-dom";

const SectionCard = ({ service }) => {
  return (
    <div className="bg-white rounded-2xl shadow shadow-transparent p-5 space-y-3 hover:shadow-xl hover:shadow-yellow-500 transition duration-200">
      
      <img
        src={service.image}
        alt={service.serviceTitle}
        className="w-full h-48 object-cover rounded-xl"
      />

      <h2 className="text-xl font-semibold">
        {service.serviceTitle}
      </h2>

      <p className="text-gray-700 font-medium">
        {service.question}
      </p>

      <p className="text-gray-500 text-sm">
        {service.answer}
      </p>

      <Link
        to={`/services/${service.serviceKey}`}
        className="inline-block mt-3 bg-yellow-400 px-4 py-2 rounded-xl font-medium hover:bg-yellow-500"
      >
        Explore
      </Link>
    </div>
  );
};

export default SectionCard;
