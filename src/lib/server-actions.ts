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

export type ActionResponse = {
  success: boolean;
  productId?: string;
  error?: string;
};

/**
 * Upload an image File to Shopify using stagedUploadsCreate
 * and return the resourceUrl we can use as originalSource in media.
 */
async function uploadImageToShopify(file: File): Promise<string> {
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

  const uploadForm = new FormData();
  for (const param of target.parameters) {
    uploadForm.append(param.name, param.value);
  }
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

  return target.resourceUrl;
}

/**
 * Main server action: reads form data, uploads image (if any),
 * then creates product + variant in Shopify.
 */
export async function createProduct(formData: FormData): Promise<ActionResponse> {
  try {
    const title = String(formData.get("title") ?? "");
    const descriptionHtml = String(formData.get("descriptionHtml") ?? "");
    const price = parseFloat(String(formData.get("price") ?? "0"));

    // Get category selections for tags
    const mainCategory = String(formData.get("mainCategory") ?? "");
    const subCategory = String(formData.get("subCategory") ?? "");

    const breeder = String(formData.get("breeder") ?? "");
    const sex = String(formData.get("sex") ?? "");
    const size = String(formData.get("size") ?? "");
    const sizeIn = String(formData.get("size_in") ?? "");
    const age = String(formData.get("age") ?? "");

    const imageFile = formData.get("imageFile") as unknown as File | null;

    if (!title) {
      return { success: false, error: "Title is required." };
    }
    if (!price || Number.isNaN(price)) {
      return { success: false, error: "Valid price is required." };
    }
    if (!mainCategory) {
      return { success: false, error: "Main category is required." };
    }

    // 1) Upload image file if provided
    let originalSource: string | null = null;
    if (imageFile && imageFile.size > 0) {
      originalSource = await uploadImageToShopify(imageFile);
      console.log("Image uploaded to Shopify...");
    }

    // 2) Prepare metafields
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
      age && {
        namespace: "custom",
        key: "age",
        type: "single_line_text_field",
        value: age,
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

    // 4) Build tags array from main and sub categories
    const tags: string[] = [];
    if (mainCategory) tags.push(mainCategory);
    if (subCategory) tags.push(subCategory);

    // 5) Create the product
    const CREATE_PRODUCT_MUTATION = `
      mutation CreateProductWithMetafieldsAndImage(
        $title: String!
        $descriptionHtml: String!
        $tags: [String!]
        $metafields: [MetafieldInput!]
        $media: [CreateMediaInput!]
      ) {
        productCreate(
          product: {
            title: $title
            descriptionHtml: $descriptionHtml
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
        tags,
        metafields,
        media,
      }
    );
    console.log("Product created..."); 

    const { productCreate } = productData;

    if (productCreate.userErrors.length > 0 || !productCreate.product) {
      return { 
        success: false, 
        error: productCreate.userErrors.map((e) => e.message).join(", ") 
      };
    }

    const productId = productCreate.product.id;

    // 6) Create a single variant with the price
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
      console.log("Product variants created...");

      if (productVariantsBulkCreate.userErrors.length > 0) {
         return {
            success: true,
            productId,
            error: "Product created but price failed: " + productVariantsBulkCreate.userErrors.map((e) => e.message).join(", ")
         };
      }
    }

    return { success: true, productId };

  } catch (err: any) {
    console.error("Server Action Error:", err);
    return { success: false, error: err.message || "Unknown server error" };
  }
}