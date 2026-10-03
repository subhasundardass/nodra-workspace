import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/admin/breadcrumbs";
import SearchInput from "@/components/admin/search-input";
import { ThemeSelector } from "@/components/themes/theme-selector";
import { ThemeModeToggle } from "@/components/themes/theme-mode-toggle";
import { UserNav } from "./user-nav";

type HeaderProps = {
  currentUser: any;
};

export default function Header({ currentUser }: HeaderProps) {
  return (
    <header className="bg-background/60 sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 rounded-t-xl border-b px-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex">
          <SearchInput />
        </div>

        <ThemeModeToggle />

        <div className="hidden sm:block">
          <ThemeSelector />
        </div>

        <UserNav user={currentUser} />
      </div>
    </header>
  );
}
