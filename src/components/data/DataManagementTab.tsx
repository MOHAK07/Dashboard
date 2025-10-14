import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Search,
  RefreshCw,
  Database,
  FileText,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Check,
} from "lucide-react";
import { TABLES, TableName } from "../../lib/supabase";
import { FlexibleDataRow } from "../../types";
import { DatabaseService } from "../../services/databaseService";
import { DataEntryForm } from "./DataEntryForm";
import { BulkUploadModal } from "./BulkUploadModal";
import { DataTable } from "../DataTable";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useApp } from "../../contexts/AppContext";

export function DataManagementTab() {
  const { dispatch } = useApp();
  const [selectedTable, setSelectedTable] = useState<TableName>(TABLES.FOM);
  const [tableData, setTableData] = useState<FlexibleDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<FlexibleDataRow | null>(
    null
  );
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for the new dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // All tables now use 'id' as the primary key
  const idColumn = "id";

  // Load data for selected table
  const loadTableData = async (tableName: TableName) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await DatabaseService.fetchAll(tableName);
      if (result.error) {
        setError(result.error.message);
        setTableData([]);
      } else {
        setTableData(result.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    loadTableData(selectedTable);

    const handleRealtimeUpdate = (
      payload: RealtimePostgresChangesPayload<FlexibleDataRow>
    ) => {
      console.log("Real-time change received:", payload);
      const { eventType, new: newRecord, old: oldRecord } = payload;

      if (payload.commit_timestamp) {
        const updateTime = new Date(payload.commit_timestamp);
        console.log(
          "DATA_TAB: Updating global state with timestamp:",
          updateTime
        );
        // Update global app state
        dispatch({
          type: "SET_LAST_DB_UPDATE_TIME",
          payload: updateTime,
        });

        // Store in localStorage for persistence
        localStorage.setItem(
          "lastDatabaseUpdateTime",
          updateTime.toISOString()
        );

        // Dispatch event for UpdateStatus component
        window.dispatchEvent(
          new CustomEvent("supabase-data-changed", {
            detail: {
              table: payload.table,
              eventType: payload.eventType,
              timestamp: payload.commit_timestamp,
              formattedTime: updateTime.toISOString(),
            },
          })
        );

        console.log("DATA_TAB: Global state updated successfully");
      }

      setTableData((currentData) => {
        if (eventType === "INSERT") {
          return [newRecord, ...currentData];
        }
        if (eventType === "UPDATE") {
          return currentData.map((row) =>
            row[idColumn] === newRecord[idColumn] ? newRecord : row
          );
        }
        if (eventType === "DELETE") {
          const recordId = (oldRecord as FlexibleDataRow)[idColumn];
          return currentData.filter((row) => row[idColumn] !== recordId);
        }
        return currentData;
      });
    };

    const subscription = DatabaseService.subscribeToTable(
      selectedTable,
      handleRealtimeUpdate
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedTable, dispatch]);

  // Load saved timestamp when component mounts or user changes
  useEffect(() => {
    const savedTimestamp = localStorage.getItem("lastDatabaseUpdateTime");
    if (savedTimestamp) {
      const savedDate = new Date(savedTimestamp);
      if (!isNaN(savedDate.getTime())) {
        console.log("DATA_TAB: Loading saved timestamp:", savedDate);
        dispatch({
          type: "SET_LAST_DB_UPDATE_TIME",
          payload: savedDate,
        });
      }
    }
  }, [dispatch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleTableChange = (tableName: TableName) => {
    setSelectedTable(tableName);
    setSelectedRecords([]);
    setSearchTerm("");
  };

  const handleAddRecord = () => {
    setShowAddForm(true);
  };

  const handleEditRecord = (record: FlexibleDataRow) => {
    setShowEditForm(record);
  };

  const handleDeleteRecord = async (record: FlexibleDataRow) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    const recordId = record[idColumn];
    const result = await DatabaseService.deleteRecord(
      selectedTable,
      recordId,
      idColumn
    );
    if (result.error) {
      setError(result.error.message);
    } else {
      // SUCCESS: Update the app_status table
      await DatabaseService.updateAppStatus(
        `Deleted record from ${selectedTable}`
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedRecords.length} records?`
      )
    )
      return;

    let success = true;
    for (const recordId of selectedRecords) {
      const result = await DatabaseService.deleteRecord(
        selectedTable,
        recordId,
        idColumn
      );
      if (result.error) {
        setError(
          `Failed to delete record ${recordId}: ${result.error.message}`
        );
        success = false;
        break;
      }
    }
    if (success) {
      setSelectedRecords([]);
      // SUCCESS: Update the app_status table after all deletions
      await DatabaseService.updateAppStatus(
        `Bulk deleted ${selectedRecords.length} records from ${selectedTable}`
      );
    }
    setSelectedRecords([]);
  };

  const filteredData = tableData.filter((record) =>
    Object.values(record).some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Data Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your database records with full CRUD operations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadTableData(selectedTable)}
            disabled={isLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowBulkUpload(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Bulk Upload</span>
          </button>
          <button
            onClick={handleAddRecord}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Table Selection & Search */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative w-full lg:w-64" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Table
            </label>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="input-field w-full flex items-center justify-between text-left"
            >
              <span>{selectedTable}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 py-1">
                {Object.values(TABLES).map((tableName, index) => (
                  <React.Fragment key={tableName}>
                    <button
                      onClick={() => {
                        handleTableChange(tableName);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                    >
                      <span>{tableName}</span>
                      {selectedTable === tableName && (
                        <Check className="h-4 w-4 text-primary-500" />
                      )}
                    </button>
                    {/* Add divider line between options (except after the last one) */}
                    {index < Object.values(TABLES).length - 1 && (
                      <div className="border-t border-gray-100 dark:border-gray-700 mx-2" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-64"
              />
            </div>
            {selectedRecords.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="btn-secondary text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete ({selectedRecords.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
              <Database className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Records
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {tableData.length.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/50 rounded-lg">
              <FileText className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Selected Table
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {selectedTable}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent-100 dark:bg-accent-900/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Selected Rows
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedRecords.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-error-600 dark:text-error-400" />
            <p className="text-sm text-error-700 dark:text-error-300">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading {selectedTable} data...
              </p>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No records found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm
                ? "No records match your search criteria"
                : `No data in ${selectedTable} table`}
            </p>
            <button
              onClick={handleAddRecord}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Record</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedTable} Records
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredData.length} of {tableData.length} records
              </div>
            </div>

            <DataTable
              data={filteredData}
              onEdit={handleEditRecord}
              onDelete={handleDeleteRecord}
              selectedRecords={selectedRecords}
              onSelectionChange={setSelectedRecords}
              showActions={true}
              tableId={idColumn}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddForm && (
        <DataEntryForm
          tableName={selectedTable}
          onSave={async () => {
            setShowAddForm(false);
            // SUCCESS: Update the app_status table
            await DatabaseService.updateAppStatus(
              `Added record to ${selectedTable}`
            );
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {showEditForm && (
        <DataEntryForm
          tableName={selectedTable}
          initialData={showEditForm}
          onSave={async () => {
            setShowEditForm(null);
            // SUCCESS: Update the app_status table
            await DatabaseService.updateAppStatus(
              `Updated record in ${selectedTable}`
            );
          }}
          onCancel={() => setShowEditForm(null)}
          isEdit={true}
        />
      )}

      {showBulkUpload && (
        <BulkUploadModal
          tableName={selectedTable}
          onClose={() => setShowBulkUpload(false)}
          onSuccess={async () => {
            setShowBulkUpload(false);
            // SUCCESS: Update the app_status table
            await DatabaseService.updateAppStatus(
              `Bulk uploaded to ${selectedTable}`
            );
          }}
        />
      )}
    </div>
  );
}
