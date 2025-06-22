// components/UserCard.js
import users from "../../data/users";
import TitlePage from "./TitlePage";
// Helper to parse "DD/MM/YYYY" into a Date object
const parseDate = (dateStr) => {
  const [day, month, year] = dateStr.split("/");
  return new Date(`${year}-${month}-${day}`);
};

const UserCard = () => {
  // Sort users by dateCreated (newest first)
  const latestUsers = [...users]
    .sort((a, b) => parseDate(b.dateCreated) - parseDate(a.dateCreated))
    .slice(0, 3);

  return (
    <div className=" bg-white rounded-xl shadow p-6 mt-10  w-full dark:bg-[#0D1321] text-white">
      <TitlePage header="Recent Users" paragraph="Latest user registrations." />
      <ul className="space-y-4">
        {latestUsers.map((user) => (
          <li key={user.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${user.active
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-500"
                }`}
            >
              {user.active ? "active" : "inactive"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserCard;
