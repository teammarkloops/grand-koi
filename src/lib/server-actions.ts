// src/lib/server-actions.ts
"use server";

import { shopifyAdminFetch } from "@/lib/shopify";

type ProductCreateResponse = {
  productCreate: {
    product: {
      id: string;
      title: string;
      status: string;
    } | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

type ProductVariantsCreateResponse = {
  productVariantsBulkCreate: {
    productVariants: {
      id: string;
      title: string;
      price: string;
    }[];
    userErrors: { field: string[] | null; message: string }[];
  };
};

type StagedUploadsCreateResponse = {
  stagedUploadsCreate: {
    stagedTargets: {
      url: string;
      resourceUrl: string;
      parameters: { name: string; value: string }[];
    }[];
    userErrors: { field: string[] | null; message: string }[];
  };
};

/**
 * Upload an image File to Shopify using stagedUploadsCreate
 * and return the resourceUrl we can use as originalSource in media.
 */
async function uploadImageToShopify(file: File): Promise<string> {
  // 1) Ask Shopify for a staged upload target
  const STAGED_UPLOADS_MUTATION = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const mimeType = file.type || "image/jpeg";

  const stagedData = await shopifyAdminFetch<StagedUploadsCreateResponse>(
    STAGED_UPLOADS_MUTATION,
    {
      input: [
        {
          filename: file.name || "upload.jpg",
          mimeType,
          resource: "IMAGE",
          httpMethod: "POST",
        },
      ],
    }
  );

  const { stagedUploadsCreate } = stagedData;

  if (stagedUploadsCreate.userErrors.length > 0) {
    console.error(
      "stagedUploadsCreate errors:",
      stagedUploadsCreate.userErrors
    );
    throw new Error(
      stagedUploadsCreate.userErrors.map((e) => e.message).join(", ")
    );
  }

  const target = stagedUploadsCreate.stagedTargets[0];
  if (!target) {
    throw new Error("No staged upload target returned from Shopify");
  }

  // 2) POST the actual file to the staged upload URL
  const uploadForm = new FormData();
  for (const param of target.parameters) {
    uploadForm.append(param.name, param.value);
  }
  // Shopify expects the binary as the last form field, usually named "file"
  uploadForm.append("file", file);

  const uploadRes = await fetch(target.url, {
    method: "POST",
    body: uploadForm,
  });

  if (!uploadRes.ok) {
    console.error(
      "Error uploading image to staged URL",
      await uploadRes.text()
    );
    throw new Error("Failed to upload image to Shopify staged upload URL");
  }

  // 3) Return the resourceUrl, which Shopify will treat as the originalSource
  return target.resourceUrl;
}

/**
 * Main server action: reads form data, uploads image (if any),
 * then creates product + variant in Shopify.
 */
export async function createProduct(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const descriptionHtml = String(formData.get("descriptionHtml") ?? "");
  const vendor = String(formData.get("vendor") ?? "");
  const price = parseFloat(String(formData.get("price") ?? "0"));
  const tags = String(formData.get("tags") ?? "");

  const breeder = String(formData.get("breeder") ?? "");
  const sex = String(formData.get("sex") ?? "");
  const size = String(formData.get("size") ?? "");
  const sizeIn = String(formData.get("size_in") ?? "");

  const imageFile = formData.get("imageFile") as unknown as File | null;

  if (!title || !price || Number.isNaN(price)) {
    throw new Error("Title and valid price are required.");
  }

  // 1) Upload image file if provided
  let originalSource: string | null = null;
  if (imageFile && typeof imageFile === "object") {
    originalSource = await uploadImageToShopify(imageFile);
  }

  // 2) Prepare metafields matching your manual product
  const metafields = [
    breeder && {
      namespace: "custom",
      key: "breeder",
      type: "single_line_text_field",
      value: breeder,
    },
    sex && {
      namespace: "custom",
      key: "sex",
      type: "single_line_text_field",
      value: sex,
    },
    size && {
      namespace: "custom",
      key: "size",
      type: "single_line_text_field",
      value: size,
    },
    sizeIn && {
      namespace: "custom",
      key: "size_in",
      type: "single_line_text_field",
      value: sizeIn,
    },
  ].filter(Boolean) as {
    namespace: string;
    key: string;
    type: string;
    value: string;
  }[];

  // 3) Prepare media (if we uploaded an image)
  const media = originalSource
    ? [
        {
          alt: title,
          mediaContentType: "IMAGE",
          originalSource,
        },
      ]
    : [];

  // 4) Create the product (title, description, vendor, tags, metafields, media)
  const CREATE_PRODUCT_MUTATION = `
    mutation CreateProductWithMetafieldsAndImage(
      $title: String!
      $descriptionHtml: String!
      $vendor: String
      $tags: [String!]
      $metafields: [MetafieldInput!]
      $media: [CreateMediaInput!]
    ) {
      productCreate(
        product: {
          title: $title
          descriptionHtml: $descriptionHtml
          vendor: $vendor
          tags: $tags
          metafields: $metafields
        }
        media: $media
      ) {
        product {
          id
          title
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const productData = await shopifyAdminFetch<ProductCreateResponse>(
    CREATE_PRODUCT_MUTATION,
    {
      title,
      descriptionHtml,
      vendor: vendor || null,
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      metafields,
      media,
    }
  );

  const { productCreate } = productData;

  if (productCreate.userErrors.length > 0 || !productCreate.product) {
    console.error("productCreate errors:", productCreate.userErrors);
    throw new Error(productCreate.userErrors.map((e) => e.message).join(", "));
  }

  const productId = productCreate.product.id;

  // 5) Create a single variant with the price, replacing the standalone variant.
  if (price && price > 0) {
    const CREATE_VARIANTS_MUTATION = `
      mutation ProductVariantsCreate(
        $productId: ID!
        $variants: [ProductVariantsBulkInput!]!
      ) {
        productVariantsBulkCreate(
          productId: $productId
          strategy: REMOVE_STANDALONE_VARIANT
          variants: $variants
        ) {
          productVariants {
            id
            title
            price
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variantsInput = [
      {
        price,
        optionValues: [
          {
            name: "Default Title",
            optionName: "Title",
          },
        ],
      },
    ];

    const variantsData = await shopifyAdminFetch<ProductVariantsCreateResponse>(
      CREATE_VARIANTS_MUTATION,
      {
        productId,
        variants: variantsInput,
      }
    );

    const { productVariantsBulkCreate } = variantsData;

    if (productVariantsBulkCreate.userErrors.length > 0) {
      console.error(
        "productVariantsBulkCreate errors:",
        productVariantsBulkCreate.userErrors
      );
      throw new Error(
        productVariantsBulkCreate.userErrors.map((e) => e.message).join(", ")
      );
    }
  }

  // Optionally you can redirect or return something specific
  console.log("Created product:", productCreate.product);

  // In a server action, returning a value is allowed but not used by the form directly.
  return {
    id: productId,
    title: productCreate.product.title,
    status: productCreate.product.status,
  };
}
