import Image from "next/image";
import type { Product } from "@/types/product";

type ProductTableProps = {
  products: Product[];
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  const color =
    stock > 50
      ? "bg-green-100 text-green-700"
      : stock > 10
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${color}`}>
      {stock} in stock
    </span>
  );
}

function PriceDisplay({
  price,
  discount,
}: {
  price: number;
  discount: number;
}) {
  const discounted = price * (1 - discount / 100);
  return (
    <div>
      <span className="text-sm font-semibold text-gray-900">
        ${discounted.toFixed(2)}
      </span>
      {discount > 0 && (
        <span className="text-xs text-gray-400 line-through ml-1.5">
          ${price.toFixed(2)}
        </span>
      )}
    </div>
  );
}

export function ProductTable({ products }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No products found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr
                key={product.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Image
                      src={product.thumbnail}
                      alt={product.title}
                      width={40}
                      height={40}
                      className="rounded-lg object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.title}
                      </p>
                      <p className="text-xs text-gray-500">{product.brand}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md capitalize">
                    {product.category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <PriceDisplay
                    price={product.price}
                    discount={product.discountPercentage}
                  />
                </td>
                <td className="px-4 py-3">
                  <RatingStars rating={product.rating} />
                </td>
                <td className="px-4 py-3">
                  <StockBadge stock={product.stock} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-500">
          Showing {products.length} products
        </p>
      </div>
    </div>
  );
}
