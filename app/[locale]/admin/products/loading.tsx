'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminProducts } from '@/components/admin/admin-products';
import { parseProductFilters } from '@/lib/admin/product-input';

function ProductListSkeleton({
  filters,
}: {
  filters: ReturnType<typeof parseProductFilters>;
}) {
  return (
    <AdminProducts
      loading
      filters={filters}
      categories={[]}
      products={[]}
      page={1}
      pages={1}
    />
  );
}

function FilteredProductListSkeleton() {
  const params = useSearchParams();
  return (
    <ProductListSkeleton
      filters={parseProductFilters(Object.fromEntries(params))}
    />
  );
}

export default function Loading() {
  return (
    <Suspense
      fallback={<ProductListSkeleton filters={parseProductFilters({})} />}
    >
      <FilteredProductListSkeleton />
    </Suspense>
  );
}
