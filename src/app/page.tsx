// src/app/page.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { createProduct } from "@/lib/server-actions";
import { SubmitButton } from "./submit-button";
import {
  MAIN_CATEGORIES,
  SUB_CATEGORIES,
  SEX_OPTIONS,
  BREEDER_OPTIONS,
  type MainCategory,
} from "@/lib/config";

export default function CreateProductPage() {
  const [mainCategory, setMainCategory] = useState<MainCategory | "">("");

  const handleMainCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setMainCategory(e.target.value as MainCategory | "");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create Shopify Product</CardTitle>
          <CardDescription>
            Create a new product using the Shopify Admin API via a server action
            with file upload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProduct}>
            <FieldGroup className="space-y-6">
              <Field>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input id="title" name="title" defaultValue="Sanke" required />
              </Field>

              <Field>
                <FieldLabel htmlFor="descriptionHtml">Description</FieldLabel>
                <Textarea
                  id="descriptionHtml"
                  name="descriptionHtml"
                  defaultValue=""
                  rows={3}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="price">Price</FieldLabel>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue="11999.00"
                  required
                />
              </Field>

              {/* Category Selection */}
              <Field>
                <FieldLabel htmlFor="mainCategory">Main Category</FieldLabel>
                <NativeSelect
                  id="mainCategory"
                  name="mainCategory"
                  value={mainCategory}
                  onChange={handleMainCategoryChange}
                  required
                >
                  <NativeSelectOption value="" disabled>
                    Select main category
                  </NativeSelectOption>
                  {MAIN_CATEGORIES.map((category) => (
                    <NativeSelectOption key={category} value={category}>
                      {category}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel htmlFor="subCategory">Sub Category</FieldLabel>
                <NativeSelect
                  id="subCategory"
                  name="subCategory"
                  disabled={!mainCategory}
                  required
                  defaultValue=""
                >
                  <NativeSelectOption value="" disabled>
                    {mainCategory
                      ? "Select sub category"
                      : "Select main category first"}
                  </NativeSelectOption>
                  {mainCategory &&
                    SUB_CATEGORIES[mainCategory].map((subCat) => (
                      <NativeSelectOption key={subCat} value={subCat}>
                        {subCat}
                      </NativeSelectOption>
                    ))}
                </NativeSelect>
              </Field>

              {/* Metafields */}
              <Field>
                <FieldLabel htmlFor="breeder">Breeder</FieldLabel>
                <NativeSelect
                  id="breeder"
                  name="breeder"
                  defaultValue="Momotaro"
                >
                  <NativeSelectOption value="" disabled>
                    Select breeder
                  </NativeSelectOption>
                  {BREEDER_OPTIONS.map((breeder) => (
                    <NativeSelectOption key={breeder} value={breeder}>
                      {breeder}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel htmlFor="sex">Sex</FieldLabel>
                <NativeSelect id="sex" name="sex" defaultValue="Female">
                  <NativeSelectOption value="" disabled>
                    Select sex
                  </NativeSelectOption>
                  {SEX_OPTIONS.map((sex) => (
                    <NativeSelectOption key={sex} value={sex}>
                      {sex}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel htmlFor="size">Size (cm)</FieldLabel>
                <Input
                  id="size"
                  name="size"
                  type="number"
                  step="0.01"
                  defaultValue="74.93"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="size_in">Size (inches)</FieldLabel>
                <Input
                  id="size_in"
                  name="size_in"
                  type="number"
                  step="0.01"
                  defaultValue="29.5"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="age">Age (years)</FieldLabel>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  step="1"
                  min="0"
                  defaultValue="10"
                />
              </Field>

              {/* Image upload */}
              <Field>
                <FieldLabel htmlFor="imageFile">Image file</FieldLabel>
                <Input
                  id="imageFile"
                  name="imageFile"
                  type="file"
                  accept="image/*"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose an image file from your device. It will be uploaded to
                  Shopify and attached as product media.
                </p>
              </Field>

              <div className="pt-4">
                <SubmitButton />
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
