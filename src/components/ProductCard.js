// components/TopProducts.js
import ProductsPage from "@/app/products/page";
import products from "../../data/products";
import TitlePage from "./TitlePage";
const parseDate = (dateStr) => new Date(dateStr);

const ProductCard = () => {
  const topProducts = [...products]
    .sort((a, b) => parseDate(b.dateAdded) - parseDate(a.dateAdded))
    .slice(0, 3);

  return (
    <div className=" bg-white rounded-xl shadow p-6 mt-10  w-full dark:bg-[#0b1120] text-white">
      <TitlePage header="Recent Products" paragraph="Latest products added." />
      <ul className="space-y-4">
        {topProducts.map((product, index) => (
          <li key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={product.image}
                alt={product.name}
                className="w-10 h-10 rounded-md object-cover border border-gray-300"
              />
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-gray-500">${product.price}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">{product.stock} in stock</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductCard;
