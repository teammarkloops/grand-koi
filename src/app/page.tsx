// src/app/page.tsx
"use client";

import { useState, FormEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

// Import the server action (keeps 'use server' directive server-side)
import { createProduct } from "@/lib/server-actions";

export default function CreateProductPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setStatus("Creating product...");
    setError(null);

    const formData = new FormData(e.currentTarget);

    const title = String(formData.get("title") || "");
    const descriptionHtml = String(formData.get("descriptionHtml") || "");
    const price = parseFloat(String(formData.get("price") || "0"));
    const age = String(formData.get("age") || "");
    const sex = String(formData.get("sex") || "");
    const size = String(formData.get("size") || "");
    const imageUrl = String(formData.get("imageUrl") || "");

    try {
      const result = await createProduct({
        title,
        descriptionHtml,
        price,
        age,
        sex,
        size,
        imageUrl,
      });

      setStatus(`Created product: ${result.title} (ID: ${result.id})`);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create product");
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create Shopify Product</CardTitle>
          <CardDescription>
            Create a new product using the Shopify Admin API via a server
            action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="space-y-6">
              <Field>
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input
                  id="title"
                  name="title"
                  defaultValue="Sample T-Shirt"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="descriptionHtml">
                  Description (HTML)
                </FieldLabel>
                <Textarea
                  id="descriptionHtml"
                  name="descriptionHtml"
                  defaultValue="<p>Soft cotton t-shirt, perfect for everyday wear.</p>"
                  rows={4}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="price">Price</FieldLabel>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue="19.99"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="age">Age metafield</FieldLabel>
                <Input id="age" name="age" defaultValue="Adult" />
              </Field>

              <Field>
                <FieldLabel htmlFor="sex">Sex metafield</FieldLabel>
                <Input id="sex" name="sex" defaultValue="Unisex" />
              </Field>

              <Field>
                <FieldLabel htmlFor="size">Size metafield</FieldLabel>
                <Input id="size" name="size" defaultValue="XL" />
              </Field>

              <Field>
                <FieldLabel htmlFor="imageUrl">Image URL</FieldLabel>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  defaultValue="https://your-cdn.com/images/sample-shirt-front.jpg"
                />
              </Field>

              <div className="pt-4">
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Creating..." : "Create Product"}
                </Button>
              </div>
            </FieldGroup>
          </form>

          {status && (
            <p className="mt-6 text-sm font-medium text-green-600">{status}</p>
          )}
          {error && (
            <p className="mt-6 text-sm font-medium text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
