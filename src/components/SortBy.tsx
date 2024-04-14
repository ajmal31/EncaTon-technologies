"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";


const sortingOptions = [
  { value: "price-asc", label: "Sort by price(asc)" },
  { value: "price-desc", label: "Sort by price(desc)" },
  { value: "created_at-asc", label: "Sort by created at(asc)" },
  { value: "created_at-desc", label: "Sort by created at(desc)" },
  { value: "rating-asc", label: "Sort by rating (asc)" },
  { value: "rating-desc", label: "Sort by rating (desc)" },
];

function SortBy() {
const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string>("");
  const params = useSearchParams();
  const searchParams = new URLSearchParams(params);

  // Update selectedOption when the query parameter changes
  useEffect(() => {
    setSelectedOption(searchParams.get("sortBy") || "");
  }, [searchParams]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setSelectedOption(selectedValue);
 
    console.log("selected value",selectedValue)
    // Update query parameter in URL
    const queryParams = new URLSearchParams(searchParams.toString());
    if (selectedValue) {
      queryParams.set("sortBy", selectedValue);
    } else {
      queryParams.delete("sortBy");
    }

    router.push(`/products?${queryParams.toString()}`);
  };


  return (
    <div className="text-black flex gap-2">
      <p className="text-white text-lg">Sort By</p>
      <select
        name="sorting"
        id="sorting"
        value={selectedOption}
        onChange={handleSortChange}
      >
        <option value="">None</option>
        {sortingOptions.map((option, i) => {
          return (
            <option key={i} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default SortBy;
