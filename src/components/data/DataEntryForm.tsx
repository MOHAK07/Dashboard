import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Save, X, Plus, AlertCircle, CheckCircle } from "lucide-react";
import { FlexibleDataRow } from "../../types";
import { TABLES, TableName } from "../../lib/supabase";
import { DatabaseService } from "../../services/databaseService";

interface DataEntryFormProps {
  tableName: TableName;
  initialData?: FlexibleDataRow;
  onSave: (data: FlexibleDataRow) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

// Dynamic schema based on table structure
const createValidationSchema = (tableName: TableName) => {
  const baseSchema: any = {};

  switch (tableName) {
    case TABLES.FOM:
    case TABLES.LFOM:
      baseSchema.Date = yup.string().required("Date is required");
      baseSchema.Name = yup.string().required("Name is required");
      baseSchema.Quantity = yup
        .number()
        .positive("Quantity must be positive")
        .required("Quantity is required");
      baseSchema.Price = yup
        .number()
        .positive("Price must be positive")
        .required("Price is required");
      break;
    case TABLES.POS_FOM:
    case TABLES.POS_LFOM:
      baseSchema.Date = yup.string().required("Date is required");
      baseSchema.Name = yup.string().required("Name is required");
      baseSchema.Quantity = yup
        .number()
        .positive("Quantity must be positive")
        .required("Quantity is required");
      baseSchema.Price = yup
        .number()
        .positive("Price must be positive")
        .required("Price is required");
      break;
    case TABLES.STOCK:
      baseSchema.Date = yup.string().required("Date is required");
      break;
    case TABLES.MDA_CLAIM:
      baseSchema.Year = yup.number().required("Year is required");
      baseSchema.Month = yup.string().required("Month is required");
      break;
    case TABLES.CBG:
      baseSchema["Bill.Doc.Date"] = yup.string().required("Date is required");
      baseSchema["Ship to party name"] = yup
        .string()
        .required("Customer name is required");
      baseSchema.Quantity = yup.string().required("Quantity is required");
      baseSchema["Total Invoice value"] = yup
        .string()
        .required("Total Invoice value is required");
      break;
    case TABLES.REVENUE:
      baseSchema.Month = yup.string().required("Month is required");
      break;
  }

  return yup.object(baseSchema);
};

export function DataEntryForm({
  tableName,
  initialData,
  onSave,
  onCancel,
  isEdit = false,
}: DataEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const schema = createValidationSchema(tableName);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FlexibleDataRow>({
    resolver: yupResolver(schema),
    defaultValues: initialData || {},
  });

  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        setValue(key, value);
      });
    }
  }, [initialData, setValue]);

  const onSubmit = async (data: FlexibleDataRow) => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      let result;

      if (isEdit && initialData) {
        const idColumn = "id";
        const recordId = initialData[idColumn];

        // Check if recordId exists and is valid
        if (recordId === null || recordId === undefined) {
          setSubmitResult({
            success: false,
            message: "Record ID is missing. Cannot update record.",
          });
          setIsSubmitting(false);
          return;
        }

        result = await DatabaseService.updateRecord(
          tableName,
          recordId,
          data,
          idColumn
        );
      } else {
        // Insert new record
        result = await DatabaseService.insertRecord(tableName, data);
      }

      if (result.error) {
        setSubmitResult({
          success: false,
          message: result.error.message,
        });
      } else {
        setSubmitResult({
          success: true,
          message: isEdit
            ? "Record updated successfully"
            : "Record created successfully",
        });

        onSave(data);

        // Auto-close after success
        setTimeout(() => {
          onCancel();
        }, 1500);
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: error instanceof Error ? error.message : "Operation failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldsForTable = (tableName: TableName) => {
    switch (tableName) {
      case TABLES.FOM:
      case TABLES.LFOM:
        return [
          { name: "Date", type: "date", label: "Date", required: true },
          { name: "Week", type: "text", label: "Week" },
          { name: "Month", type: "text", label: "Month" },
          { name: "Year", type: "number", label: "Year" },
          {
            name: "Name",
            type: "text",
            label: "Customer Name",
            required: true,
          },
          { name: "Adress", type: "text", label: "Address" },
          { name: "Pin code", type: "number", label: "Pin Code" },
          { name: "Taluka", type: "text", label: "Taluka" },
          { name: "District", type: "text", label: "District" },
          { name: "State", type: "text", label: "State" },
          {
            name: "Quantity",
            type: "number",
            label: "Quantity (MT)",
            required: true,
          },
          { name: "Price", type: "number", label: "Price (₹)", required: true },
          {
            name: "Buyer Type",
            type: "select",
            label: "Buyer Type",
            options: ["B2B", "B2C"],
          },
        ];
      case TABLES.POS_FOM:
      case TABLES.POS_LFOM:
        return [
          { name: "Date", type: "date", label: "Date", required: true },
          { name: "Week", type: "text", label: "Week" },
          { name: "Month", type: "text", label: "Month" },
          { name: "Year", type: "number", label: "Year" },
          {
            name: "Name",
            type: "text",
            label: "Customer Name",
            required: true,
          },
          { name: "Adress", type: "text", label: "Address" },
          { name: "State", type: "text", label: "State" },
          {
            name: "Quantity",
            type: "number",
            label: "Quantity (MT)",
            required: true,
          },
          { name: "Price", type: "number", label: "Price (₹)", required: true },
          { name: "Revenue", type: "number", label: "Revenue (₹)" },
          {
            name: "Type",
            type: "select",
            label: "Type",
            options: ["B2B", "B2C"],
          },
        ];
      case TABLES.STOCK:
        return [
          { name: "Date", type: "date", label: "Date", required: true },
          {
            name: "RCF Production",
            type: "number",
            label: "RCF Production (MT)",
          },
          {
            name: "Boomi Samrudhi Production",
            type: "text",
            label: "Boomi Samrudhi Production",
          },
          { name: "RCF Sales", type: "number", label: "RCF Sales (MT)" },
          {
            name: "Boomi Samrudhi Sales",
            type: "text",
            label: "Boomi Samrudhi Sales",
          },
          {
            name: "RCF Stock Left",
            type: "number",
            label: "RCF Stock Left (MT)",
          },
          {
            name: "Boomi Samrudhi Stock Left",
            type: "number",
            label: "Boomi Samrudhi Stock Left (MT)",
          },
          {
            name: "Total Stock Left",
            type: "number",
            label: "Total Stock Left (MT)",
          },
        ];
      case TABLES.MDA_CLAIM:
        return [
          { name: "Year", type: "number", label: "Year", required: true },
          {
            name: "Month",
            type: "select",
            label: "Month",
            required: true,
            options: [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ],
          },
          { name: "Week", type: "number", label: "Week" },
          {
            name: "Quantity Applied for MDA Claim/Sold",
            type: "text",
            label: "Quantity Applied",
          },
          { name: "Claim Accepted", type: "text", label: "Claim Accepted" },
          {
            name: "Eligible Amount",
            type: "text",
            label: "Eligible Amount (₹)",
          },
          {
            name: "Amount Received",
            type: "text",
            label: "Amount Received (₹)",
          },
          {
            name: "Amount not Received",
            type: "text",
            label: "Amount not Received (₹)",
          },
          { name: "Date of Receipt", type: "text", label: "Date of Receipt" },
        ];

      case TABLES.CBG:
        return [
          {
            name: "Bill.Doc",
            type: "number",
            label: "Bill.Doc",
            required: false,
          },
          {
            name: "Bill.Doc.Date",
            type: "date",
            label: "Bill.Doc.Date",
            required: true,
          },
          { name: "Month", type: "text", label: "Month", required: false },
          { name: "Year", type: "number", label: "Year", required: false },
          {
            name: "Bill to party",
            type: "number",
            label: "Bill to party",
            required: false,
          },
          {
            name: "Revenue GL",
            type: "number",
            label: "Revenue GL",
            required: false,
          },
          {
            name: "Sales Doc Type",
            type: "text",
            label: "Sales Doc Type",
            required: false,
          },
          {
            name: "Bill to party name",
            type: "text",
            label: "Bill to party name",
            required: true,
          },
          { name: "City", type: "text", label: "City", required: false },
          {
            name: "Ship to party name",
            type: "text",
            label: "Ship to party name",
            required: false,
          },
          {
            name: "State Discription",
            type: "text",
            label: "State Discription",
            required: false,
          },
          {
            name: "Matrl Description",
            type: "text",
            label: "Matrl Description",
            required: false,
          },
          { name: "Unit", type: "text", label: "Unit", required: false },
          {
            name: "Quantity",
            type: "text",
            label: "Quantity",
            required: true,
          },
          { name: "Rate", type: "text", label: "Rate", required: false },
          {
            name: "Basic Value",
            type: "text",
            label: "Basic Value",
            required: false,
          },
          {
            name: "CGST Amount",
            type: "text",
            label: "CGST Amount",
            required: false,
          },
          {
            name: "SGST Amount",
            type: "text",
            label: "SGST Amount",
            required: false,
          },
          {
            name: "IGST Amount",
            type: "text",
            label: "IGST Amount",
            required: false,
          },
          {
            name: "Transportation amount",
            type: "text",
            label: "Transportation amount",
            required: false,
          },
          {
            name: "Total Invoice value",
            type: "text",
            label: "Total Invoice value",
            required: true,
          },
          { name: "Plant", type: "number", label: "Plant", required: false },
          {
            name: "Material Code",
            type: "text",
            label: "Material Code",
            required: false,
          },
          {
            name: "Truck Number",
            type: "text",
            label: "Truck Number",
            required: false,
          },
          {
            name: "Transpoter Name",
            type: "text",
            label: "Transpoter Name",
            required: false,
          },
          {
            name: "R.O Number&Date",
            type: "text",
            label: "R.O Number&Date",
            required: false,
          },
          {
            name: "BPGSTIN Number",
            type: "text",
            label: "BPGSTIN Number",
            required: false,
          },
          {
            name: "Sales Order No",
            type: "number",
            label: "Sales Order No",
            required: false,
          },
          {
            name: "Sales Order Date",
            type: "text",
            label: "Sales Order Date",
            required: false,
          },
          {
            name: "Purchase Order",
            type: "text",
            label: "Purchase Order",
            required: false,
          },
          {
            name: "Billing Type",
            type: "text",
            label: "Billing Type",
            required: false,
          },
          {
            name: "Permit Number and Date",
            type: "text",
            label: "Permit Number and Date",
            required: false,
          },
          {
            name: "Billing ACCT Doc No.(RV)",
            type: "number",
            label: "Billing ACCT Doc No.(RV)",
            required: false,
          },
          {
            name: "Excise ACCT Doc No.(SA)",
            type: "number",
            label: "Excise ACCT Doc No.(SA)",
            required: false,
          },
          {
            name: "OFS Number and Date",
            type: "text",
            label: "OFS Number and Date",
            required: false,
          },
          {
            name: "NOC Number and Date",
            type: "text",
            label: "NOC Number and Date",
            required: false,
          },
          {
            name: "Delivery number",
            type: "number",
            label: "Delivery number",
            required: false,
          },
          {
            name: "HSN/SAC",
            type: "number",
            label: "HSN/SAC",
            required: false,
          },
          {
            name: "Compression filling Amount",
            type: "text",
            label: "Compression filling Amount",
            required: false,
          },
        ];
      case TABLES.REVENUE:
        return [
          {
            name: "Month",
            type: "select",
            label: "Month",
            required: true,
            options: [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ],
          },
          {
            name: "Direct sales FOM",
            type: "text",
            label: "Direct Sales FOM (₹)",
          },
          {
            name: "Direct Sales LFOM",
            type: "text",
            label: "Direct Sales LFOM (₹)",
          },
          {
            name: "MDA claim received",
            type: "text",
            label: "MDA Claim Received (₹)",
          },
          { name: "Total Revenue", type: "text", label: "Total Revenue (₹)" },
          {
            name: "FOM B2B",
            type: "text",
            label: "FOM B2B (₹)",
          },
          {
            name: "FOM B2C",
            type: "text",
            label: "FOM B2C (₹)",
          },
          {
            name: "LFOM B2C",
            type: "text",
            label: "LFOM B2C (₹)",
          },
        ];
      default:
        return [];
    }
  };

  const fields = getFieldsForTable(tableName);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 !m-0">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isEdit ? "Edit" : "Add New"} {tableName} Record
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className={field.name === "Adress" ? "md:col-span-2" : ""}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {field.label}
                    {field.required && (
                      <span className="text-error-500 ml-1">*</span>
                    )}
                  </label>

                  {field.type === "select" ? (
                    <select
                      {...register(field.name)}
                      className="input-field w-full"
                      disabled={isSubmitting}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      {...register(field.name)}
                      type={field.type}
                      className="input-field w-full"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      disabled={isSubmitting}
                    />
                  )}

                  {errors[field.name] && (
                    <p className="mt-1 text-sm text-error-600 dark:text-error-400">
                      {errors[field.name]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Submit Result */}
            {submitResult && (
              <div
                className={`p-4 rounded-lg flex items-center space-x-3 ${
                  submitResult.success
                    ? "bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700"
                    : "bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-700"
                }`}
              >
                {submitResult.success ? (
                  <CheckCircle className="h-5 w-5 text-success-600 dark:text-success-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-error-600 dark:text-error-400" />
                )}
                <p
                  className={`text-sm font-medium ${
                    submitResult.success
                      ? "text-success-700 dark:text-success-300"
                      : "text-error-700 dark:text-error-300"
                  }`}
                >
                  {submitResult.message}
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isEdit ? "Update" : "Save"} Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
