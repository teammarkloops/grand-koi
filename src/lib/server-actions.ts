// src/lib/server-actions.ts
"use server";

import { shopifyAdminFetch } from "@/lib/shopify";

type CreateProductInput = {
  title: string;
  descriptionHtml: string;
  price: number;
  age: string;
  sex: string;
  size: string;
  imageUrl: string;
};

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

export async function createProduct(input: CreateProductInput) {
  const { title, descriptionHtml, price, age, sex, size, imageUrl } = input;

  // 1) Prepare metafields
  const metafields = [
    {
      namespace: "my_fields",
      key: "age",
      type: "single_line_text_field",
      value: age,
    },
    {
      namespace: "my_fields",
      key: "sex",
      type: "single_line_text_field",
      value: sex,
    },
    {
      namespace: "my_fields",
      key: "size",
      type: "single_line_text_field",
      value: size,
    },
  ];

  // 2) Prepare media array if imageUrl is provided
  const media = imageUrl
    ? [
        {
          alt: `${title} main image`,
          mediaContentType: "IMAGE",
          originalSource: imageUrl,
        },
      ]
    : [];

  // 3) GraphQL mutation to create the product
  const CREATE_PRODUCT_MUTATION = `
    mutation CreateProductWithMetafieldsAndImage(
      $title: String!
      $descriptionHtml: String!
      $metafields: [MetafieldInput!]
      $media: [CreateMediaInput!]
    ) {
      productCreate(
        product: {
          title: $title
          descriptionHtml: $descriptionHtml
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

  // 4) Create a simple variant with price (using ProductVariantsBulk API)
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
        // Minimal option: one "Title" option with value = product title or "Default"
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

  return {
    id: productId,
    title: productCreate.product.title,
    status: productCreate.product.status,
  };
}
