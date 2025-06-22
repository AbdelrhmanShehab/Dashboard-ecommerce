// components/StatusCard.js
const StatusCard = ({ title, value, secondaryValue, iconSrc, trend }) => {
  return (
    <div className="bg-white rounded-lg shadow w-full p-4 flex flex-col dark:text-[#1a1b23] dark:bg-[#0D1321]">
      <div className="flex justify-between items-start">
        <h3 className="text-gray-500 text-sm font-medium dark:text-white">{title}</h3>
        {iconSrc && (
          <img src={iconSrc} alt={title} className="w-5 h-5 text-gray-400 dark:invert dark:brightness-200" />
        )}
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold dark:text-white">{value}</p>

        {secondaryValue && (
          <p className="text-sm text-green-600">{secondaryValue}</p>
        )}

        {trend && (
          <div
            className={`flex items-center mt-2 text-sm ${trend.positive ? "text-green-600" : "text-red-500"
              }`}
          >
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusCard;
