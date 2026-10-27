import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-dvh">
      <Sidebar />
      <div className="md:pl-[88px]">
        <Topbar />
        <main className="px-4 pt-2 pb-28 sm:px-6 md:px-8 md:pb-12">{children}</main>
      </div>
    </div>
  );
}