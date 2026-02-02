import { ReactNode } from "react";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import CustomerChatWidget from "@/components/public/CustomerChatWidget";

interface PublicLayoutProps {
  children: ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen bg-cream-warm flex flex-col">
      <PublicHeader />
      <main className="flex-1 brick-overlay">{children}</main>
      <PublicFooter />
      <CustomerChatWidget />
    </div>
  );
};

export default PublicLayout;
