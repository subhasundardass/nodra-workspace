import { useThemeConfig } from "@/components/themes/active-theme";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Icons } from "../icons";
import { Kbd } from "@/components/ui/kbd";
import { THEMES } from "./theme.config";

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig();

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="theme-selector" className="sr-only">
        Theme
      </Label>

      <Select
        value={activeTheme}
        onValueChange={(value) => setActiveTheme(value)}
      >
        <SelectTrigger id="theme-selector" className="h-8 justify-start px-3">
          <span className="text-muted-foreground hidden sm:block">
            <Icons.palette className="size-4" />
          </span>

          <span className="text-muted-foreground block sm:hidden">Theme</span>

          <SelectValue placeholder="Select a theme" />

          <Kbd>T T</Kbd>
        </SelectTrigger>

        <SelectContent align="end">
          {THEMES.length > 0 && (
            <SelectGroup>
              <SelectLabel>Themes</SelectLabel>

              {THEMES.map((theme) => (
                <SelectItem key={theme.name} value={theme.value}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
