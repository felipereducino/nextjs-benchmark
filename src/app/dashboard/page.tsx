import type { ProductsResponse } from "@/types/product";
import { SummaryCards } from "./_components/summary-cards";
import { DashboardPageClient } from "./dashboard-page-client";

async function getProducts(): Promise<ProductsResponse> {
  const response = await fetch("https://dummyjson.com/products?limit=0");

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}

export default async function DashboardPage() {
  const data = await getProducts();

  const categories = [...new Set(data.products.map((p) => p.category))].sort();

  return (
    <div className="space-y-6">
      <SummaryCards products={data.products} />
      <DashboardPageClient
        initialProducts={data.products}
        categories={categories}
      />
    </div>
  );
}
