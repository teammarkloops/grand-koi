// src/app/page.tsx
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
import { SubmitButton } from "./submit-button";

export default function CreateProductPage() {
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
                <FieldLabel htmlFor="descriptionHtml">
                  Description (HTML)
                </FieldLabel>
                <Textarea
                  id="descriptionHtml"
                  name="descriptionHtml"
                  defaultValue=""
                  rows={3}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="vendor">Vendor</FieldLabel>
                <Input id="vendor" name="vendor" defaultValue="Grand Koi0" />
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

              <Field>
                <FieldLabel htmlFor="tags">Tags (comma-separated)</FieldLabel>
                <Input id="tags" name="tags" defaultValue="Other Koi, Sanke" />
              </Field>

              {/* Metafields matching your example */}
              <Field>
                <FieldLabel htmlFor="breeder">
                  Breeder (metafield custom.breeder)
                </FieldLabel>
                <Input id="breeder" name="breeder" defaultValue="Momotaro" />
              </Field>

              <Field>
                <FieldLabel htmlFor="sex">
                  Sex (metafield custom.sex)
                </FieldLabel>
                <Input id="sex" name="sex" defaultValue="Female" />
              </Field>

              <Field>
                <FieldLabel htmlFor="size">
                  Size (metafield custom.size)
                </FieldLabel>
                <Input id="size" name="size" defaultValue="74.93" />
              </Field>

              <Field>
                <FieldLabel htmlFor="size_in">
                  Size in inches (metafield custom.size_in)
                </FieldLabel>
                <Input id="size_in" name="size_in" defaultValue="29.5" />
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
