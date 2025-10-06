import React, { useState, useEffect, useCallback } from "react";
import { Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { TimestampService } from "../services/timestampService";

interface DatabaseEvent {
  table?: string;
  eventType?: "INSERT" | "UPDATE" | "DELETE";
  timestamp?: string;
}

export function UpdateStatus() {
  const { state, dispatch } = useApp();
  const [updateStatus, setUpdateStatus] = useState(
    "Awaiting database activity..."
  );
  const [lastEvent, setLastEvent] = useState<DatabaseEvent | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Function to format status from timestamp
  const formatStatusFromTimestamp = useCallback(
    (timestamp: Date | string | null) => {
      if (!timestamp) {
        return "Awaiting database activity...";
      }

      const lastUpdateDate = new Date(timestamp);

      if (isNaN(lastUpdateDate.getTime())) {
        console.error("🔴 UPDATE_STATUS: Invalid date:", timestamp);
        return "Awaiting database activity...";
      }

      const formatDate = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = String(date.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
      };

      const dayName = lastUpdateDate.toLocaleDateString("en-US", {
        weekday: "long",
      });

      return `Data updated on ${dayName} (${formatDate(lastUpdateDate)})`;
    },
    []
  );

  // Initialize status on component mount with enhanced persistence
  useEffect(() => {
    console.log("🟦 UPDATE_STATUS: Initializing with enhanced persistence");

    // First check global state
    if (state.lastDatabaseUpdateTime) {
      console.log(
        "🟦 UPDATE_STATUS: Found timestamp in global state:",
        state.lastDatabaseUpdateTime
      );
      const statusMessage = formatStatusFromTimestamp(
        state.lastDatabaseUpdateTime
      );
      setUpdateStatus(statusMessage);
      return;
    }

    // Use TimestampService for persistent loading
    const savedTimestamp = TimestampService.loadTimestamp();
    if (savedTimestamp) {
      console.log(
        "🟦 UPDATE_STATUS: Found persistent timestamp:",
        savedTimestamp
      );
      const statusMessage = formatStatusFromTimestamp(savedTimestamp);
      setUpdateStatus(statusMessage);

      // Update global state with loaded timestamp
      dispatch({
        type: "SET_LAST_DB_UPDATE_TIME",
        payload: savedTimestamp,
      });
    } else {
      console.log("🟦 UPDATE_STATUS: No persistent timestamp found");
      setUpdateStatus("Awaiting database activity...");
    }
  }, [formatStatusFromTimestamp, dispatch]);

  // Handle database changes with enhanced persistence
  const handleDatabaseChange = useCallback(
    (event: CustomEvent) => {
      console.log("🟦 UPDATE_STATUS: Database change detected:", event.detail);

      setLastEvent(event.detail);

      // Update timestamp with enhanced persistence
      const newTimestamp = TimestampService.updateTimestamp();

      // Update global state
      dispatch({
        type: "SET_LAST_DB_UPDATE_TIME",
        payload: newTimestamp,
      });

      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    },
    [dispatch]
  );

  // Set up event listener
  useEffect(() => {
    console.log("🟦 UPDATE_STATUS: Setting up enhanced event listener");

    window.addEventListener(
      "supabase-data-changed",
      handleDatabaseChange as EventListener
    );

    return () => {
      console.log("🟦 UPDATE_STATUS: Cleaning up event listener");
      window.removeEventListener(
        "supabase-data-changed",
        handleDatabaseChange as EventListener
      );
    };
  }, [handleDatabaseChange]);

  // Update status when global state changes
  useEffect(() => {
    if (state.lastDatabaseUpdateTime) {
      console.log(
        "🟦 UPDATE_STATUS: Global state timestamp changed:",
        state.lastDatabaseUpdateTime
      );
      const statusMessage = formatStatusFromTimestamp(
        state.lastDatabaseUpdateTime
      );
      setUpdateStatus(statusMessage);

      // Ensure persistence even when state changes
      TimestampService.saveTimestamp(state.lastDatabaseUpdateTime);
    }
  }, [state.lastDatabaseUpdateTime, formatStatusFromTimestamp]);

  // In src/components/UpdateStatus.tsx - Add sign-out event handler
  useEffect(() => {
    // Handle user sign-out event
    const handleUserSignOut = () => {
      console.log("🟦 UPDATE_STATUS: User signed out, resetting status");
      setUpdateStatus("Awaiting database activity...");
      setLastEvent(null);
    };

    window.addEventListener("user-signed-out", handleUserSignOut);

    return () => {
      window.removeEventListener("user-signed-out", handleUserSignOut);
    };
  }, []);

  // Rest of your component remains the same...
  const getEventIcon = () => {
    if (!lastEvent?.eventType) {
      return <Calendar className="h-4 w-4" />;
    }

    switch (lastEvent.eventType) {
      case "INSERT":
        return <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case "UPDATE":
        return <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    const timestamp =
      state.lastDatabaseUpdateTime || TimestampService.loadTimestamp();

    if (!timestamp) {
      return "text-gray-500 dark:text-gray-400";
    }

    const now = new Date();
    const lastUpdate = new Date(timestamp);
    const minutesDiff = Math.floor(
      (now.getTime() - lastUpdate.getTime()) / (1000 * 60)
    );

    if (minutesDiff < 1) {
      return "text-green-600 dark:text-green-400 font-medium";
    } else if (minutesDiff < 5) {
      return "text-blue-600 dark:text-blue-400";
    } else if (minutesDiff < 60) {
      return "text-gray-700 dark:text-gray-300";
    } else {
      return "text-gray-500 dark:text-gray-400";
    }
  };

  return (
    <div
      className={`
        flex items-center space-x-2 text-sm transition-all duration-300
        ${getStatusColor()}
        ${isAnimating ? "scale-105" : "scale-100"}
      `}
    >
      <div
        className={`transition-transform duration-300 ${
          isAnimating ? "rotate-12" : ""
        }`}
      >
        {getEventIcon()}
      </div>
      <span className="truncate max-w-xs">{updateStatus}</span>
      {(state.lastDatabaseUpdateTime || TimestampService.loadTimestamp()) && (
        <div className="relative">
          <div
            className={`
            absolute inset-0 rounded-full bg-current opacity-20 
            ${isAnimating ? "animate-ping" : ""}
          `}
          />
        </div>
      )}
    </div>
  );
}
