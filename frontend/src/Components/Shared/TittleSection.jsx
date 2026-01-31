import React from "react";

const TittleSection = ({
  title,
  bgImage,
  height = "h-72", // default height
}) => {
  return (
    <div
      className={`
        relative
        ${height}
        rounded-2xl
        bg-fixed
        bg-center
        bg-cover
        flex
        items-center
        justify-center
        text-white
      `}
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 rounded-2xl" />

      {/* Title */}
      <h2 className="relative z-10 text-5xl font-bold tracking-wide">
        {title}
      </h2>
    </div>
  );
};

export default TittleSection;
