"use client";

import { useState, useRef } from "react";
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
import { createProduct } from "@/lib/server-actions";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "sonner";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import {
  MAIN_CATEGORIES,
  SUB_CATEGORIES,
  SEX_OPTIONS,
  BREEDER_OPTIONS,
  type MainCategory,
} from "@/lib/config";

export default function CreateProductPage() {
  const formRef = useRef<HTMLFormElement>(null);

  // State is required for Comboboxes
  const [mainCategory, setMainCategory] = useState<MainCategory | null>(null);
  const [subCategory, setSubCategory] = useState<string | null>(null);
  const [breeder, setBreeder] = useState<string | null>(null);
  const [sex, setSex] = useState<string | null>(null);

  const handleMainCategoryChange = (val: string | null) => {
    setMainCategory(val as MainCategory);
    setSubCategory(null); // Reset sub category when main changes
  };

  async function handleAction(formData: FormData) {
    const result = await createProduct(formData);

    if (result.success) {
      toast.success("Product Created", {
        description: "The product has been successfully added to Shopify.",
      });
      // Reset form and state
      formRef.current?.reset();
      setMainCategory(null);
      setSubCategory(null);
      setBreeder(null);
      setSex(null);
    } else {
      toast.error("Creation Failed", {
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  return (
    <div className="flex items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-3xl shadow-lg border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="text-2xl">Single Product Upload</CardTitle>
          <CardDescription>
            Create a detailed individual product. Images are uploaded to Shopify staged targets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleAction} ref={formRef}>
            <FieldGroup className="space-y-6">
              
              {/* Row 1: Title & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field>
                  <FieldLabel htmlFor="title">Title *</FieldLabel>
                  <Input id="title" name="title" placeholder="e.g. Tancho Showa" required className="h-10" />
                </Field>

                <Field>
                  <FieldLabel htmlFor="price">Price *</FieldLabel>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue=""
                    required
                    className="h-10"
                  />
                </Field>
              </div>

              {/* Description */}
              <Field>
                <FieldLabel htmlFor="descriptionHtml">Description</FieldLabel>
                <Textarea
                  id="descriptionHtml"
                  name="descriptionHtml"
                  placeholder="Product details..."
                  rows={4}
                />
              </Field>

              {/* Row 2: Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Main Category */}
                <Field>
                  <FieldLabel>Main Category *</FieldLabel>
                  {/* Hidden input for Server Action */}
                  <input type="hidden" name="mainCategory" value={mainCategory || ""} />
                  
                  <Combobox items={MAIN_CATEGORIES} value={mainCategory} onValueChange={handleMainCategoryChange}>
                    <ComboboxInput placeholder="Select Category" required className="h-10" />
                    <ComboboxContent>
                      <ComboboxEmpty>No results found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem key={item} value={item}>
                            {item}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </Field>

                {/* Sub Category */}
                <Field>
                  <FieldLabel>Sub Category *</FieldLabel>
                  <input type="hidden" name="subCategory" value={subCategory || ""} />
                  
                  <Combobox 
                    items={mainCategory ? SUB_CATEGORIES[mainCategory] : []} 
                    value={subCategory} 
                    onValueChange={(val) => setSubCategory(val)}
                  >
                    <ComboboxInput placeholder="Select Sub Category" disabled={!mainCategory} required className="h-10" />
                    <ComboboxContent>
                      <ComboboxEmpty>No results found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem key={item} value={item}>
                            {item}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </Field>
              </div>

              {/* Row 3: Breeder, Sex, Age */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Breeder */}
                <Field>
                    <FieldLabel>Breeder</FieldLabel>
                    <input type="hidden" name="breeder" value={breeder || ""} />
                    
                    <Combobox items={BREEDER_OPTIONS} value={breeder} onValueChange={(val) => setBreeder(val)}>
                      <ComboboxInput placeholder="Breeder" className="h-10" />
                      <ComboboxContent>
                        <ComboboxEmpty>No results found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem key={item} value={item}>
                              {item}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                </Field>

                {/* Sex */}
                <Field>
                    <FieldLabel>Sex</FieldLabel>
                    <input type="hidden" name="sex" value={sex || ""} />

                    <Combobox items={SEX_OPTIONS} value={sex} onValueChange={(val) => setSex(val)}>
                      <ComboboxInput placeholder="Sex" className="h-10" />
                      <ComboboxContent>
                        <ComboboxEmpty>No results found.</ComboboxEmpty>
                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem key={item} value={item}>
                              {item}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                </Field>

                <Field>
                    <FieldLabel htmlFor="age">Age (years)</FieldLabel>
                    <Input id="age" name="age" type="number" step="1" min="0" className="h-10" />
                </Field>
              </div>

              {/* Row 4: Size */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Field>
                    <FieldLabel htmlFor="size">Size (cm)</FieldLabel>
                    <Input id="size" name="size" type="number" step="0.01" className="h-10" />
                </Field>

                 <Field>
                    <FieldLabel htmlFor="size_in">Size (inches)</FieldLabel>
                    <Input id="size_in" name="size_in" type="number" step="0.01" className="h-10" />
                </Field>
              </div>

              {/* Row 5: Image upload */}
              <Field>
                  <FieldLabel htmlFor="imageFile">Image File</FieldLabel>
                  <Input
                  id="imageFile"
                  name="imageFile"
                  type="file"
                  accept="image/*"
                  className="h-10 file:h-8 file:mr-2 file:text-sm file:font-semibold cursor-pointer"
                  />
              </Field>

              <div className="pt-6">
                <SubmitButton />
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}