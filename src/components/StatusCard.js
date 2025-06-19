// components/StatusCard.js
const StatusCard = ({ title, value, secondaryValue, iconSrc, trend }) => {
  return (
    <div className="bg-white rounded-lg shadow lg:md-[380px] w-full p-4 flex flex-col">
      <div className="flex justify-between items-start">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        {iconSrc && (
          <img src={iconSrc} alt={title} className="w-5 h-5 text-gray-400" />
        )}
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold">{value}</p>

        {secondaryValue && (
          <p className="text-sm text-gray-500 mt-1">{secondaryValue}</p>
        )}

        {trend && (
          <div
            className={`flex items-center mt-2 text-sm ${
              trend.positive ? "text-green-500" : "text-red-500"
            }`}
          >
            <span>{trend.value}</span>
            {trend.positive ? (
              <img
                src="/icons/trend-up.png"
                alt="Up trend"
                className="w-4 h-4 ml-1"
              />
            ) : (
              <img
                src="/icons/trend-down.png"
                alt="Down trend"
                className="w-4 h-4 ml-1"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusCard;
