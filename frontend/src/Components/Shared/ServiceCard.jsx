import { TiTick } from "react-icons/ti";
import FavoriteButton from './FavoriteButton';
import RatingStars from './RatingStars';

const ServiceCard = ({ plan, onViewDetails }) => {
  return (
    <div className="
      bg-[#1B4B36]
      rounded-2xl
      overflow-hidden
      text-white
      shadow-xl
      h-[550px]
      flex
      flex-col
      relative
    ">

      {/* Favorite Button */}
      <div className="absolute top-2 left-2 z-10">
        <FavoriteButton itemId={plan._id} itemType="service" size="md" />
      </div>

      {/* IMAGE (if available) */}
      {plan.image && (
        <div className="relative h-40 w-full bg-gray-700 flex-shrink-0">
          <img
            src={plan.image}
            alt={plan.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {plan.discount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              {plan.discount}% OFF
            </div>
          )}
        </div>
      )}

      {/* CONTENT */}
      <div className="p-5 flex flex-col flex-1">
        {/* TITLE */}
        <h3 className="text-xl font-bold leading-snug line-clamp-2 mb-2 h-14">
          {plan.title}
        </h3>

        {/* VENDOR / TAGLINE */}
        <p className="text-sm text-gray-200 line-clamp-1 mb-2 h-5">
          {plan.tagline}
        </p>

        {/* RATING */}
        {plan.rating > 0 && (
          <div className="mb-3">
            <RatingStars rating={plan.rating} size="sm" showNumber={true} />
          </div>
        )}

        {/* DIVIDER */}
        <div className="border-t border-white/30 mb-3" />

        {/* PRICE */}
        <div className="mb-3 flex-shrink-0">
          <div className="
            bg-yellow-400
            text-black
            font-extrabold
            text-2xl
            px-3
            py-2
            rounded-xl
            text-center
          ">
            ৳{plan.price}
            <span className="text-xs font-medium">
              {" "}/{plan.billingType}
            </span>
          </div>
        </div>

        {/* FEATURES - Only 3 */}
        <ul className="space-y-2 text-sm mb-3 h-20 flex-shrink-0">
          {plan.features?.slice(0, 3).map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-yellow-400 text-lg flex-shrink-0">
                <span className='text-xs bg-yellow-500 text-[#1B4B36] rounded-full inline-flex items-center justify-center w-4 h-4'>
                  <TiTick />
                </span>
              </span>
              <span className="line-clamp-1 flex-1">{feature}</span>
            </li>
          ))}
        </ul>

        {/* SPACER */}
        <div className="flex-1" />

        {/* BUTTON - Always at bottom */}
        <button
          onClick={onViewDetails}
          className="
            w-full
            bg-white
            text-[#1B4B36]
            font-semibold
            rounded-xl
            py-3
            hover:bg-gray-100
            transition
            flex-shrink-0
            cursor-pointer
          "
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;
