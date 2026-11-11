import { Document } from "nodra/core/document/document";

type PartyType = "Company" | "Individual";
type AccountType = "Current" | "Savings" | "Other";
type WorkflowState = "Draft" | "Confirmed" | "Cancelled";

export class Party extends Document {
  title!: string;
  party_type!: PartyType;
  phone!: string;
  email?: string | null;
  gstin!: string;
  pan!: string;
  address?: string | null;
  state!: string;
  city!: string;
  pincode?: string | null;
  country?: string | null;
  notes?: string | null;

  bank_name?: string | null;
  account_holder_name?: string | null;
  account_number?: string | null;
  ifsc?: string | null;
  branch?: string | null;
  account_type?: AccountType | null;

  is_active!: boolean;
  workflow_state!: WorkflowState;

  private clean(value: unknown): string | null {
    if (value === null || value === undefined) return null;

    const result = String(value).trim();
    return result === "" ? null : result;
  }

  private required(value: unknown, label: string): string {
    const result = this.clean(value);

    if (!result) {
      throw new Error(`${label} is required.`);
    }

    return result;
  }

  private maxLength(value: string | null, label: string, max: number): void {
    if (value && value.length > max) {
      throw new Error(`${label} cannot exceed ${max} characters.`);
    }
  }

  async beforeValidate(): Promise<void> {
    const doc = this as unknown as Record<string, unknown>;
    console.log("PARTY CONTROLLER TITLE:", this.title);
    // Normalize text fields.
    const textFields = [
      "title",
      "phone",
      "email",
      "gstin",
      "pan",
      "address",
      "state",
      "city",
      "pincode",
      "country",
      "notes",
      "bank_name",
      "account_holder_name",
      "account_number",
      "ifsc",
      "branch",
      "account_type",
    ];

    for (const field of textFields) {
      doc[field] = this.clean(doc[field]);
    }

    // Empty optional values become null.
    const optionalFields = [
      "email",
      "address",
      "pincode",
      "notes",
      "bank_name",
      "account_holder_name",
      "account_number",
      "ifsc",
      "branch",
      "account_type",
    ];

    for (const field of optionalFields) {
      if (doc[field] === undefined) {
        doc[field] = null;
      }
    }
    console.log("Party data before required validation:", {
      title: doc.title,
      party_type: doc.party_type,
      phone: doc.phone,
      gstin: doc.gstin,
      pan: doc.pan,
      state: doc.state,
      city: doc.city,
    });
    // Required fields.
    doc.title = this.required(doc.title, "Buyer Name");
    doc.party_type = this.required(doc.party_type, "Buyer Type");
    doc.phone = this.required(doc.phone, "Phone");
    doc.gstin = this.required(doc.gstin, "GSTIN");
    doc.pan = this.required(doc.pan, "PAN");
    doc.state = this.required(doc.state, "State");
    doc.city = this.required(doc.city, "City");

    // Maximum lengths.
    this.maxLength(doc.title as string, "Buyer Name", 140);
    this.maxLength(doc.city as string, "City", 100);
    this.maxLength(doc.state as string, "State", 100);
    this.maxLength(doc.address as string | null, "Address", 500);
    this.maxLength(doc.email as string | null, "Email", 254);
    this.maxLength(doc.bank_name as string | null, "Bank Name", 140);
    this.maxLength(
      doc.account_holder_name as string | null,
      "Account Holder Name",
      140,
    );
    this.maxLength(doc.account_number as string | null, "Account Number", 34);
    this.maxLength(doc.branch as string | null, "Branch", 140);
    this.maxLength(doc.notes as string | null, "Notes", 2000);

    // Party Type.
    if (!["Company", "Individual"].includes(String(doc.party_type))) {
      throw new Error("Buyer Type must be Company or Individual.");
    }

    // Phone: Indian mobile number.
    const phone = String(doc.phone).replace(/[\s()-]/g, "");
    const normalizedPhone = phone
      .replace(/^\+91/, "")
      .replace(/^91(?=\d{10}$)/, "");

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      throw new Error("Enter a valid 10-digit Indian mobile number.");
    }

    doc.phone = normalizedPhone;

    // Email.
    if (doc.email) {
      const email = String(doc.email).toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Enter a valid email address.");
      }

      doc.email = email;
    }

    // PAN.
    const pan = String(doc.pan).toUpperCase();

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      throw new Error("Enter a valid PAN number.");
    }

    doc.pan = pan;

    // GSTIN.
    const gstin = String(doc.gstin).toUpperCase();

    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
      throw new Error("Enter a valid 15-character GSTIN.");
    }

    if (gstin.substring(2, 12) !== pan) {
      throw new Error("GSTIN does not match the entered PAN.");
    }

    doc.gstin = gstin;

    // PIN Code.
    if (doc.pincode && !/^[1-9][0-9]{5}$/.test(String(doc.pincode))) {
      throw new Error("Enter a valid 6-digit PIN code.");
    }

    // Country.
    if (!doc.country) {
      doc.country = "India";
    }

    // Account Type.
    const accountTypes: AccountType[] = ["Current", "Savings", "Other"];

    if (
      doc.account_type !== null &&
      !accountTypes.includes(doc.account_type as AccountType)
    ) {
      throw new Error("Invalid Account Type.");
    }

    // Bank Account Number.
    if (
      doc.account_number &&
      !/^[A-Za-z0-9/-]{5,34}$/.test(String(doc.account_number))
    ) {
      throw new Error("Enter a valid bank account number.");
    }

    // IFSC.
    if (doc.ifsc) {
      const ifsc = String(doc.ifsc).toUpperCase();

      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        throw new Error("Enter a valid 11-character IFSC code.");
      }

      doc.ifsc = ifsc;
    }

    // Account Type requires Account Number.
    if (doc.account_type && !doc.account_number) {
      throw new Error(
        "Account Number is required when Account Type is selected.",
      );
    }

    // Active checkbox normalization.
    if (
      doc.is_active === "1" ||
      doc.is_active === 1 ||
      doc.is_active === true
    ) {
      doc.is_active = true;
    } else if (
      doc.is_active === "0" ||
      doc.is_active === 0 ||
      doc.is_active === false
    ) {
      doc.is_active = false;
    }

    // Workflow State.
    const workflowStates: WorkflowState[] = ["Draft", "Confirmed", "Cancelled"];

    if (
      doc.workflow_state &&
      !workflowStates.includes(doc.workflow_state as WorkflowState)
    ) {
      throw new Error("Invalid Party Workflow State.");
    }
  }
}
