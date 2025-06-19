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

const TitlePage = ({header, paragraph }) => {
  return (
    <div className="mb-4">
      <h1 className="primary text-2xl font-bold">{header}</h1>
      <p className="secondry text-base">{paragraph}</p>
    </div>
  );
};

export default TitlePage;
