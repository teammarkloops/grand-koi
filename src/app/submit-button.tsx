"use client";
import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full h-10">
      {pending ? "Creating..." : "Create Product"}
    </Button>
  );
}
