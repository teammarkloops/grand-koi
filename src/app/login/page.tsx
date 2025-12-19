"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/auth-actions";
import { Lock } from "lucide-react";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

function LoginButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Verifying..." : "Sign In"}
    </Button>
  );
}


export default function LoginPage() {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    const result = await loginAction(formData);
    
    // If we get here, it means there was an error (success redirects automatically)
    if (result?.error) {
      toast.error("Access Denied", { description: result.error });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your password to access the dashboard
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit} ref={formRef} >
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                name="password"
                type="password"
                placeholder="Enter Password"
                required
                className="text-center tracking-widest"
                defaultValue={"Admin123"} //for testing...
              />
            </div>
            <LoginButton />
          </CardContent>
        </form>
      </Card>
    </div>
  );
}