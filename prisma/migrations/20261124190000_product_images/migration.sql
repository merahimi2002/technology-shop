CREATE TABLE "ProductImage" (
    "path" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("path"),
    CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductImage_productId_position_key" UNIQUE ("productId", "position")
);

ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "ProductImage" FROM anon, authenticated;
