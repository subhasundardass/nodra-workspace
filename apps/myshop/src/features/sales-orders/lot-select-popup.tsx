// apps/myshop/src/features/sales-orders/lot-select-popup.tsx

import {
  Check,
  LoaderCircle,
  PackageSearch,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type LotOption = {
  name: string;
  lot_no?: string;
  factory?: string;
  original_brand?: string;
  grade?: string;
  bags?: number | string;
  net_kg_per_bag?: number | string;
  availableBags: number | string;
  valuation: {
    final_grade?: string;
    final_rate?: number | string;
  };
};

type LotSelectPopupProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseTitle?: string;
  search: string;
  setSearch: (value: string) => void;
  filteredLots: LotOption[];
  loadingLots: boolean;
  lotError?: string | null;
  selectedLots: string[];
  toggleLot: (lotName: string, checked: boolean) => void;
  addSelectedLots: () => void;
};

function asNumber(value: number | string | undefined): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function money(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function LotSelectPopup({
  open,
  onOpenChange,
  warehouseTitle,
  search,
  setSearch,
  filteredLots,
  loadingLots,
  lotError,
  selectedLots,
  toggleLot,
  addSelectedLots,
}: LotSelectPopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!flex !h-[85vh] !w-[calc(100vw-2rem)] !max-w-none flex-col gap-0 overflow-hidden p-0 sm:!max-w-[1400px]">
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12 text-left">
          <DialogTitle>Select Tea Lots</DialogTitle>
          <DialogDescription>
            Select available lots from{" "}
            {warehouseTitle || "the selected warehouse"}.
          </DialogDescription>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search lot ID, lot number, brand, factory, or grade..."
              className="h-9 pl-9"
            />

            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{filteredLots.length} eligible lots</span>
            <span>{selectedLots.length} selected</span>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto">
          {loadingLots ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading lots...
            </div>
          ) : lotError ? (
            <div className="p-5 text-sm text-destructive">{lotError}</div>
          ) : filteredLots.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <PackageSearch className="size-8 text-muted-foreground" />
              <p className="font-medium">No matching lots</p>
              <p className="text-sm text-muted-foreground">
                Try another search or check the available stock and valuations.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[850px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 border-b bg-muted">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="w-12 px-3 py-2.5 font-medium">Select</th>
                  <th className="px-3 py-2.5 font-medium">Lot ID / No.</th>
                  <th className="px-3 py-2.5 font-medium">Brand / Grade</th>
                  <th className="px-3 py-2.5 text-right font-medium">Bags</th>
                  <th className="px-3 py-2.5 text-right font-medium">Kg/Bag</th>
                  <th className="px-3 py-2.5 text-right font-medium">
                    Base Rate
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium">
                    Available
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredLots.map((lot) => {
                  const checked = selectedLots.includes(lot.name);
                  const bags = asNumber(lot.bags);
                  const kgPerBag = asNumber(lot.net_kg_per_bag);
                  const availableBags = asNumber(lot.availableBags);

                  return (
                    <tr
                      key={lot.name}
                      onClick={() => toggleLot(lot.name, !checked)}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        checked ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            toggleLot(lot.name, value === true)
                          }
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Select lot ${lot.name}`}
                        />
                      </td>

                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="font-medium">{lot.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {lot.lot_no || "—"}
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        <div className="font-medium">
                          {lot.original_brand || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {lot.valuation?.final_grade || lot.grade || "—"}
                        </div>
                      </td>

                      <td className="px-3 py-2 text-right tabular-nums">
                        {bags.toLocaleString("en-IN")}
                      </td>

                      <td className="px-3 py-2 text-right tabular-nums">
                        {kgPerBag.toLocaleString("en-IN")}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                        {money(asNumber(lot.valuation?.final_rate))}
                      </td>

                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        {availableBags.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t bg-background px-5 py-3 sm:justify-between">
          <div className="flex items-center text-sm text-muted-foreground">
            {selectedLots.length
              ? `${selectedLots.length} lot${selectedLots.length === 1 ? "" : "s"} selected`
              : "Select one or more lots"}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={addSelectedLots}
              disabled={selectedLots.length === 0}
            >
              <Plus className="size-4" />
              Add {selectedLots.length} Lot
              {selectedLots.length === 1 ? "" : "s"} to Order
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
