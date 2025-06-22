import React from "react";

const titles = [
  {
    id: "analytics",
    header: "Customers Analysis",
    paragraph: "Insights and performance metrics.",
  },
  {
    id: "settings",
    header: "Settings Page",
    paragraph: "comming soon..",
  },
  {
    id: "usercard",
    header: "Settings Page",
    paragraph: "comming soon..",
  },
];

const TitlePage = ({ header, paragraph }) => {
  return (
    <div className="mb-4">
      <h1 className="text-[#111827] text-2xl dark:text-[#f5f6fa]  font-bold">{header}</h1>
      <p className=" text-[#77758e] text-base dark:text-[#a0a0b0]">{paragraph}</p>
    </div>
  );
};

export default TitlePage;
