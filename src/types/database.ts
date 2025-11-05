// Database types based on existing schema
export interface FOMRecord {
  id: number;
  Date?: string;
  Week?: string;
  Month?: string;
  Year?: number;
  Name?: string;
  Adress?: string;
  "Pin code"?: number;
  Taluka?: string;
  District?: string;
  State?: string;
  Quantity?: number;
  Price?: number;
  "Buyer Type"?: string;
  "Unit Price"?: number;
}

export interface LFOMRecord {
  id: number;
  Date?: string;
  Week?: string;
  Month?: string;
  Year?: number;
  Name?: string;
  Adress?: string;
  "Pin code"?: number;
  Taluka?: string;
  District?: string;
  State?: string;
  Quantity?: number;
  Price?: string;
  "Buyer Type"?: string;
}

export interface MDAClaimRecord {
  id: number;
  Year?: number;
  Month?: string;
  Week?: number;
  "Quantity Applied for MDA Claim/Sold"?: string;
  "Claim Accepted"?: string;
  "Eligible Amount"?: string;
  "Amount Received"?: string;
  "Amount not Received"?: string;
  "EQ QTY"?: string;
  "Date of Receipt"?: string;
}

export interface POSLFOMRecord {
  id: number;
  Date?: string;
  Week?: string;
  Month?: string;
  Year?: number;
  Name?: string;
  Adress?: string;
  State?: string;
  Quantity?: number;
  Price?: number;
  Type?: string;
}

export interface POSFOMRecord {
  id: number;
  Date?: string;
  Week?: string;
  Month?: string;
  Year?: number;
  Name?: string;
  Adress?: string;
  State?: string;
  Quantity?: number;
  Price?: number;
  Revenue?: number;
  Type?: string;
}

export interface StockRecord {
  id: number;
  Date?: string;
  "RCF Production"?: number;
  "Boomi Samrudhi Production"?: number;
  "RCF Sales"?: number;
  "Boomi Samrudhi Sales"?: number;
  "RCF Stock Left"?: number;
  "Boomi Samrudhi Stock Left"?: number;
  "Total Stock Left"?: number;
  "RCF Price"?: number;
  "RCF Revenue"?: number;
  "Boomi Samrudhi Price"?: number;
  "Boomi Samrudhi Revenue"?: number;
}

export interface RevenueRecord {
  id: number;
  Month?: string;
  "Direct sales FOM"?: string;
  "FOM B2B"?: string;
  "FOM B2C"?: string;
  "Direct Sales LFOM"?: string;
  "LFOM B2C"?: string;
  "MDA claim received"?: string;
  "Total Revenue"?: string;
}

export interface CBGRecord {
  id: number;
  "Bill.Doc"?: number;
  "Bill.Doc.Date"?: string;
  Month?: string;
  Year?: number;
  "Bill to party"?: number;
  "Revenue GL"?: number;
  "Sales Doc Type"?: string;
  "Bill to party name"?: string;
  City?: string;
  "Ship to party name"?: string;
  "State Discription"?: string;
  "Matrl Description"?: string;
  Unit?: string;
  Quantity?: string;
  Rate?: string;
  "Basic Value"?: string;
  "CGST Amount"?: string;
  "SGST Amount"?: string;
  "IGST Amount"?: string;
  "Transportation amount"?: string;
  "Total Invoice value"?: string;
  Plant?: number;
  "Material Code"?: string;
  "Truck Number"?: string;
  "Transpoter Name"?: string;
  "R.O Number&Date"?: string;
  "BPGSTIN Number"?: string;
  "Sales Order No"?: number;
  "Sales Order Date"?: string;
  "Purchase Order"?: string;
  "Billing Type"?: string;
  "Permit Number and Date"?: string;
  "Billing ACCT Doc No.(RV)"?: number;
  "Excise ACCT Doc No.(SA)"?: number;
  "OFS Number and Date"?: string;
  "NOC Number and Date"?: string;
  "Delivery number"?: number;
  "HSN/SAC"?: number;
  "Compression filling Amount"?: string;
  "Unit Price"?: number;
  "Actual Production in MT"?: number;
}

export type DatabaseRecord =
  | FOMRecord
  | LFOMRecord
  | MDAClaimRecord
  | POSLFOMRecord
  | POSFOMRecord
  | StockRecord
  | RevenueRecord
  | CBGRecord;

export interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
}

export interface DatabaseResponse<T> {
  data: T[] | null;
  error: DatabaseError | null;
  count?: number;
}
