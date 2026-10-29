import test from "node:test";
import assert from "node:assert/strict";
import { parseProductInput } from "../src/lib/catalog/validation";

test("product parser preserves ImageKit media metadata", () => {
  const product = parseProductInput({
    title: "Rose Gift Box",
    sku: "ROSE-001",
    status: "draft",
    images: [
      {
        url: "https://ik.imagekit.io/gift4u/products/rose.jpg",
        alt: "Rose gift box",
        fileId: "image-file-1",
        filePath: "/gift4u/products/rose.jpg",
        thumbnailUrl: "https://ik.imagekit.io/gift4u/tr:w-240/rose.jpg",
        width: 1200,
        height: 1200,
      },
    ],
  });

  assert.deepEqual(product.images, [
    {
      url: "https://ik.imagekit.io/gift4u/products/rose.jpg",
      alt: "Rose gift box",
      fileId: "image-file-1",
      filePath: "/gift4u/products/rose.jpg",
      thumbnailUrl: "https://ik.imagekit.io/gift4u/tr:w-240/rose.jpg",
      width: 1200,
      height: 1200,
    },
  ]);
});

test("product parser remains compatible with existing URL-only images", () => {
  const product = parseProductInput({
    title: "Legacy Gift",
    sku: "LEGACY-001",
    status: "draft",
    images: [
      {
        url: "https://ik.imagekit.io/gift4u/legacy.jpg",
        alt: "Legacy image",
      },
    ],
  });

  assert.deepEqual(product.images, [
    {
      url: "https://ik.imagekit.io/gift4u/legacy.jpg",
      alt: "Legacy image",
    },
  ]);
});
