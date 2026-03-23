"use client";

import { useMemo } from "react";
import type { Product } from "@/types/product";

type SummaryCardsProps = {
  products: Product[];
};

export function SummaryCards({ products }: SummaryCardsProps) {
  const stats = useMemo(() => {
    if (products.length === 0) {
      return { total: 0, avgPrice: 0, avgRating: 0, totalStock: 0 };
    }

    const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
    const totalRating = products.reduce((sum, p) => sum + p.rating, 0);
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

    return {
      total: products.length,
      avgPrice: totalPrice / products.length,
      avgRating: totalRating / products.length,
      totalStock,
    };
  }, [products]);

  const cards = [
    {
      label: "Total Products",
      value: stats.total.toString(),
      color: "bg-blue-500",
    },
    {
      label: "Avg. Price",
      value: `$${stats.avgPrice.toFixed(2)}`,
      color: "bg-green-500",
    },
    {
      label: "Avg. Rating",
      value: `${stats.avgRating.toFixed(1)} / 5`,
      color: "bg-yellow-500",
    },
    {
      label: "Total Stock",
      value: stats.totalStock.toLocaleString(),
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {card.value}
              </p>
            </div>
            <div className={`w-10 h-10 ${card.color} rounded-lg opacity-20`} />
          </div>
        </div>
      ))}
    </div>
  );
}
