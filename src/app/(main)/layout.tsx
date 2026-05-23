import { NavBar } from "@/components/nav-bar";
import { MobileNav } from "@/components/mobile-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <NavBar />
      <div className="flex flex-1 flex-col">
        <MobileNav />
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
