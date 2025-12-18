"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const PASSWORD = "Admin123";
const COOKIE_NAME = "auth_session";

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string;

  if (password === PASSWORD) {
    // Set a secure, HTTP-only cookie that lasts 7 days
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    redirect("/");
  } else {
    return { error: "Incorrect password" };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}