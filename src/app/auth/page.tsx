import { AuthForm } from "./auth-form";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const defaultTab: "login" | "signup" =
    params.tab === "signup" ? "signup" : "login";
  return <AuthForm defaultTab={defaultTab} />;
}
