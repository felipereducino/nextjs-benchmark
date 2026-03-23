"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/types/product";
import { Filters } from "./_components/filters";
import { ProductTable } from "./_components/product-table";

type DashboardPageClientProps = {
  initialProducts: Product[];
  categories: string[];
};

export function DashboardPageClient({
  initialProducts,
  categories,
}: DashboardPageClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("title-asc");

  const filteredProducts = useMemo(() => {
    let result = initialProducts;

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    if (category) {
      result = result.filter((p) => p.category === category);
    }

    const [field, direction] = sortBy.split("-");
    result = [...result].sort((a, b) => {
      const aVal = a[field as keyof Product];
      const bVal = b[field as keyof Product];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [initialProducts, search, category, sortBy]);

  return (
    <>
      <Filters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        categories={categories}
      />
      <ProductTable products={filteredProducts} />
    </>
  );
}
