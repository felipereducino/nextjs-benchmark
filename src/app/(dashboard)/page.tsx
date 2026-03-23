"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product, ProductsResponse } from "@/types/product";
import { SummaryCards } from "./_components/summary-cards";
import { Filters } from "./_components/filters";
import { ProductTable } from "./_components/product-table";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("title-asc");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("https://dummyjson.com/products?limit=0");
        if (!response.ok) throw new Error("Failed to fetch products");
        const data: ProductsResponse = await response.json();
        setProducts(data.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))];
    return cats.sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;

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
  }, [products, search, category, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SummaryCards products={filteredProducts} />
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
    </div>
  );
}
