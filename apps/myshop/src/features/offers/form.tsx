import { useState, type ReactNode } from "react";

import DateField from "@/components/doctype/fields/date-field";
import type { NodraForm } from "@/components/doctype/templates/doctype-form-template";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface LotOption {
  name: string;
  lot_no?: string;
  factory?: string;
  grade?: string;
  original_brand?: string;
  warehouse?: string;
  bags?: number;
  bag_from_serial_no?: number;
  bag_to_serial_no?: number;
  net_kg_per_bag?: number;
  total_kg?: number;
}

interface OfferLotRow {
  lot: string;
  factory?: string;
  lot_no?: string;
  grade?: string;
  original_brand?: string;
  warehouse?: string;
  bags?: number;
  bag_from_serial_no?: number;
  bag_to_serial_no?: number;
  net_kg_per_bag?: number;
  total_kg?: number;
  asking_rate?: number;
  remarks?: string;
}

interface OfferFormProps {
  form: NodraForm;
  lots?: LotOption[];
}

function FieldRow({
  label,
  htmlFor,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)] items-start gap-3">
      <label
        htmlFor={htmlFor}
        className="pt-2 text-sm font-medium text-muted-foreground"
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>

      <div className="min-w-0 *:w-full">{children}</div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function getLotTotalKg(lot: LotOption | OfferLotRow): number {
  const totalKg = Number(lot.total_kg);

  if (
    lot.total_kg !== undefined &&
    lot.total_kg !== null &&
    Number.isFinite(totalKg)
  ) {
    return totalKg;
  }

  return Number(lot.bags ?? 0) * Number(lot.net_kg_per_bag ?? 0);
}

export function OfferForm({ form, lots = [] }: OfferFormProps) {
  const [lotModalOpen, setLotModalOpen] = useState(false);
  const [selectedLotNames, setSelectedLotNames] = useState<string[]>([]);
  const [lotSearch, setLotSearch] = useState("");

  const closeLotModal = () => {
    setLotModalOpen(false);
    setSelectedLotNames([]);
    setLotSearch("");
  };

  return (
    <div className="space-y-5 text-sm">
      {/* Offer Information */}
      <FormSection
        title="Offer Information"
        description="Set the offer date and broker category for this offer sheet."
      >
        <form.Field name="offer_date">
          {(field) => (
            <FieldRow label="Offer Date" htmlFor={field.name} required>
              <DateField
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "")}
                onChange={field.handleChange}
                required
              />
            </FieldRow>
          )}
        </form.Field>

        <form.Field name="broker_type">
          {(field) => (
            <FieldRow label="Broker Type" htmlFor={field.name} required>
              <select
                id={field.name}
                name={field.name}
                value={String(field.state.value ?? "PRIVATE")}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="PRIVATE">Private</option>
                <option value="TATA">TATA</option>
                <option value="HUL">HUL</option>
              </select>
            </FieldRow>
          )}
        </form.Field>
      </FormSection>

      {/* Offer Lots */}
      <section className="space-y-4 rounded-lg border bg-card p-4 md:p-5">
        <form.Field name="offer_lots">
          {(field) => {
            const rows: OfferLotRow[] = Array.isArray(field.state.value)
              ? (field.state.value as OfferLotRow[])
              : [];

            const updateRows = (nextRows: OfferLotRow[]) => {
              field.handleChange(nextRows);
            };

            const existingLotNames = new Set(rows.map((row) => row.lot));

            const availableLots = lots.filter(
              (lot) => !existingLotNames.has(lot.name),
            );

            const filteredLots = availableLots.filter((lot) => {
              const search = lotSearch.trim().toLowerCase();

              if (!search) return true;

              return [
                lot.name,
                lot.lot_no,
                lot.factory,
                lot.grade,
                lot.original_brand,
                lot.warehouse,
              ].some((value) =>
                String(value ?? "")
                  .toLowerCase()
                  .includes(search),
              );
            });

            const totalBags = rows.reduce(
              (total, row) => total + Number(row.bags ?? 0),
              0,
            );

            const totalKg = rows.reduce(
              (total, row) => total + getLotTotalKg(row),
              0,
            );

            const addSelectedLots = () => {
              const newRows: OfferLotRow[] = [];

              for (const name of selectedLotNames) {
                if (existingLotNames.has(name)) continue;

                const lot = lots.find((item) => item.name === name);
                if (!lot) continue;

                newRows.push({
                  lot: lot.name,
                  factory: lot.factory ?? "",
                  lot_no: lot.lot_no ?? "",
                  grade: lot.grade ?? "",
                  original_brand: lot.original_brand ?? "",
                  warehouse: lot.warehouse ?? "",
                  bags: lot.bags ?? 0,
                  bag_from_serial_no: lot.bag_from_serial_no,
                  bag_to_serial_no: lot.bag_to_serial_no,
                  net_kg_per_bag: lot.net_kg_per_bag ?? 0,
                  total_kg: getLotTotalKg(lot),
                  asking_rate: undefined,
                  remarks: "",
                });
              }

              if (newRows.length > 0) {
                updateRows([...rows, ...newRows]);
              }

              closeLotModal();
            };

            return (
              <div className="space-y-3">
                {/* Selected Lots Header */}
                <div className="flex items-center justify-between pb-2">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold">Selected Lots</h3>
                    <p className="text-xs text-muted-foreground">
                      {rows.length} lot(s) selected
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLotNames([]);
                      setLotSearch("");
                      setLotModalOpen(true);
                    }}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    + Add Lots
                  </button>
                </div>

                {/* Selected Lots Table */}
                {rows.length > 0 ? (
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full min-w-[850px] text-sm">
                      <thead className="bg-muted/50 text-xs text-muted-foreground">
                        <tr className="text-left">
                          <th className="px-2 py-2 font-medium">Lot No</th>
                          <th className="px-2 py-2 font-medium">Factory</th>
                          <th className="px-2 py-2 font-medium">Grade</th>
                          <th className="px-2 py-2 font-medium">Bags</th>
                          <th className="px-2 py-2 font-medium">Total KG</th>
                          <th className="px-2 py-2 font-medium">Asking Rate</th>
                          <th className="px-2 py-2 font-medium">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y">
                        {rows.map((row, index) => (
                          <tr key={row.lot}>
                            <td className="px-2 py-2 font-medium">
                              {row.lot_no || row.lot}
                            </td>
                            <td className="px-2 py-2">{row.factory || "-"}</td>
                            <td className="px-2 py-2">{row.grade || "-"}</td>
                            <td className="px-2 py-2 tabular-nums">
                              {Number(row.bags ?? 0).toLocaleString("en-IN")}
                            </td>
                            <td className="px-2 py-2 tabular-nums">
                              {getLotTotalKg(row).toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-2 py-2">
                              <form.Field
                                name={`offer_lots[${index}].asking_rate`}
                              >
                                {(rateField) => (
                                  <input
                                    id={rateField.name}
                                    name={rateField.name}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={String(rateField.state.value ?? "")}
                                    onBlur={rateField.handleBlur}
                                    onChange={(event) => {
                                      const value = event.target.value;
                                      rateField.handleChange(
                                        value === ""
                                          ? undefined
                                          : Number(value),
                                      );
                                    }}
                                    placeholder="Rate"
                                    className="h-8 w-28 rounded-md border border-input bg-background px-2 text-sm"
                                  />
                                )}
                              </form.Field>
                            </td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateRows(rows.filter((_, i) => i !== index))
                                }
                                className="text-sm font-medium text-destructive hover:underline"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                    No lots added yet. Click Add Lots to select lots.
                  </div>
                )}

                {/* Totals */}
                <div className="grid grid-cols-2 gap-3 rounded-md bg-muted/40 p-3">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Total Bags</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {totalBags.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Total KG</p>
                    <p className="text-sm font-semibold tabular-nums">
                      {totalKg.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                {/* Lot Selection Modal */}
                {lotModalOpen && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
                    onMouseDown={(event) => {
                      if (event.target === event.currentTarget) closeLotModal();
                    }}
                  >
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="lot-modal-title"
                      className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-lg border bg-background text-sm shadow-xl"
                    >
                      {/* Modal Header */}
                      <div className="flex items-center justify-between border-b px-4 py-3">
                        <div className="space-y-0.5">
                          <h3
                            id="lot-modal-title"
                            className="text-sm font-semibold"
                          >
                            Select Lots
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Select one or more lots for this offer.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={closeLotModal}
                          className="rounded-md px-2 text-lg text-muted-foreground hover:bg-muted"
                          aria-label="Close"
                        >
                          ×
                        </button>
                      </div>

                      {/* Search and Lot List */}
                      <div className="space-y-2 overflow-auto p-3">
                        <input
                          type="search"
                          value={lotSearch}
                          onChange={(event) => setLotSearch(event.target.value)}
                          placeholder="Search Lot No, Factory, Grade, Warehouse..."
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />

                        {availableLots.length === 0 ? (
                          <p className="py-6 text-center text-xs text-muted-foreground">
                            {lots.length === 0
                              ? "No lots received from the server."
                              : "All available lots have already been added."}
                          </p>
                        ) : filteredLots.length === 0 ? (
                          <p className="py-6 text-center text-xs text-muted-foreground">
                            No matching lots found.
                          </p>
                        ) : (
                          <div className="overflow-x-auto rounded-md border">
                            <table className="w-full min-w-[650px] text-xs">
                              <thead className="bg-muted/50 text-muted-foreground">
                                <tr className="text-left">
                                  <th className="w-10 px-2 py-2 font-medium">
                                    Select
                                  </th>
                                  <th className="px-2 py-2 font-medium">
                                    Lot No
                                  </th>
                                  <th className="px-2 py-2 font-medium">
                                    Factory
                                  </th>
                                  <th className="px-2 py-2 font-medium">
                                    Grade
                                  </th>
                                  <th className="px-2 py-2 font-medium">
                                    Warehouse
                                  </th>
                                  <th className="px-2 py-2 font-medium">
                                    Bags
                                  </th>
                                  <th className="px-2 py-2 font-medium">
                                    Total KG
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {filteredLots.map((lot) => {
                                  const checked = selectedLotNames.includes(
                                    lot.name,
                                  );

                                  return (
                                    <tr
                                      key={lot.name}
                                      className={checked ? "bg-muted/40" : ""}
                                    >
                                      <td className="px-2 py-2">
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(value) => {
                                            setSelectedLotNames((current) =>
                                              value === true
                                                ? current.includes(lot.name)
                                                  ? current
                                                  : [...current, lot.name]
                                                : current.filter(
                                                    (name) => name !== lot.name,
                                                  ),
                                            );
                                          }}
                                        />
                                      </td>
                                      <td className="px-2 py-2 font-medium">
                                        {lot.lot_no || lot.name}
                                      </td>
                                      <td className="px-2 py-2">
                                        {lot.factory || "-"}
                                      </td>
                                      <td className="px-2 py-2">
                                        {lot.grade || "-"}
                                      </td>
                                      <td className="px-2 py-2">
                                        {lot.warehouse || "-"}
                                      </td>
                                      <td className="px-2 py-2 tabular-nums">
                                        {Number(lot.bags ?? 0).toLocaleString(
                                          "en-IN",
                                        )}
                                      </td>
                                      <td className="px-2 py-2 tabular-nums">
                                        {getLotTotalKg(lot).toLocaleString(
                                          "en-IN",
                                          {
                                            maximumFractionDigits: 2,
                                          },
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Modal Footer */}
                      <div className="flex items-center justify-between gap-3 border-t px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {selectedLotNames.length} lot(s) selected
                        </span>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={closeLotModal}
                            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={addSelectedLots}
                            disabled={selectedLotNames.length === 0}
                            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Add Selected Lots
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }}
        </form.Field>
      </section>

      {/* Additional Remarks */}
    </div>
  );
}
