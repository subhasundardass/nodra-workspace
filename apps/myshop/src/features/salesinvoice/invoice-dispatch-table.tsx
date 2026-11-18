import { useMemo } from "react";
import { Check, Package } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceDispatch } from "./create-invoice";

type InvoiceDispatchTableProps = {
  dispatches: InvoiceDispatch[];
  selectedDispatches: string[];
  onSelectionChange: (dispatches: string[]) => void;
  loading?: boolean;
};

export function InvoiceDispatchTable({
  dispatches,
  selectedDispatches,
  onSelectionChange,
  loading = false,
}: InvoiceDispatchTableProps) {
  const allSelected = useMemo(
    () =>
      dispatches.length > 0 &&
      dispatches.every((item) => selectedDispatches.includes(item.name)),
    [dispatches, selectedDispatches],
  );

  const toggleDispatch = (name: string, checked: boolean) => {
    onSelectionChange(
      checked
        ? [...new Set([...selectedDispatches, name])]
        : selectedDispatches.filter((item) => item !== name),
    );
  };

  const toggleAll = (checked: boolean) => {
    onSelectionChange(
      checked
        ? [
            ...new Set([
              ...selectedDispatches,
              ...dispatches.map((item) => item.name),
            ]),
          ]
        : selectedDispatches.filter(
            (name) => !dispatches.some((item) => item.name === name),
          ),
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Loading eligible dispatches...
      </div>
    );
  }

  if (dispatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <Package className="size-8 text-muted-foreground" />
        <p className="font-medium">No Pending Dispatches</p>
        <p className="text-sm text-muted-foreground">
          There are no eligible dispatches available for this invoice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {dispatches.length} eligible dispatches
        </p>

        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          onClick={() => toggleAll(!allSelected)}
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => toggleAll(checked === true)}
                  aria-label="Select all dispatches"
                />
              </TableHead>
              <TableHead>Dispatch / Date</TableHead>
              <TableHead>Lot / Mark</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="text-right">Bags</TableHead>
              <TableHead className="text-right">Kgs</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {dispatches.map((item) => {
              const selected = selectedDispatches.includes(item.name);

              return (
                <TableRow
                  key={item.name}
                  data-state={selected ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selected}
                      onCheckedChange={(checked) =>
                        toggleDispatch(item.name, checked === true)
                      }
                      aria-label={`Select ${item.dispatch}`}
                    />
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">{item.dispatch}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.dispatch_date}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">{item.lot_no}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.mark_brand || "-"}
                    </div>
                  </TableCell>

                  <TableCell>{item.grade || "-"}</TableCell>

                  <TableCell className="text-right tabular-nums">
                    {item.bags.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {item.kgs.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 3,
                    })}
                  </TableCell>

                  <TableCell className="text-right tabular-nums">
                    {item.rate.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>

                  <TableCell className="text-right font-medium tabular-nums">
                    {item.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="size-3.5" />
        Only confirmed, uninvoiced dispatches are eligible.
      </p>
    </div>
  );
}
