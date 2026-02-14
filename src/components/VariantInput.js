export default function VariantInput({
  label,
  value,
  setValue,
  items,
  setItems,
}) {
  return (
    <div className="mb-6">
      <h3 className="font-semibold mb-2">{label}</h3>

      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={`Add ${label.slice(0, -1)} and press Enter`}
        className="border p-2 rounded w-full mb-2"
        onKeyDown={e => {
          if (e.key === "Enter" && value.trim()) {
            e.preventDefault();
            if (!items.includes(value.trim())) {
              setItems([...items, value.trim()]);
            }
            setValue("");
          }
        }}
      />

      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="bg-gray-100 px-3 py-1 rounded-full text-sm flex gap-2"
          >
            {item}
            <button
              type="button"
              onClick={() =>
                setItems(items.filter(v => v !== item))
              }
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
