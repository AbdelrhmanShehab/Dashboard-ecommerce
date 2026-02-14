export default function VariantTable({ variants, setVariants }) {
  if (!variants.length) return null;

  const updateStock = (id, value) => {
    setVariants(prev =>
      prev.map(v =>
        v.id === id
          ? { ...v, stock: Number(value) }
          : v
      )
    );
  };

  return (
    <div className="mt-6">
      <h3 className="font-semibold mb-3">
        Variant Stock
      </h3>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Color</th>
              <th className="p-3 text-left">Size</th>
              <th className="p-3 text-left">Stock</th>
            </tr>
          </thead>

          <tbody>
            {variants.map((variant) => (
              <tr key={variant.id} className="border-t">
                <td className="p-3">{variant.color}</td>
                <td className="p-3">{variant.size}</td>
                <td className="p-3">
                  <input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(e) =>
                      updateStock(variant.id, e.target.value)
                    }
                    className="border rounded px-3 py-1 w-24"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
