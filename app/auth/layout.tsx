import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="container flex min-h-[70vh] items-center justify-center py-16">{children}</div>;
}
