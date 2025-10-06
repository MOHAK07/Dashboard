import { useEffect, useCallback } from "react";
import { DatabaseService } from "../services/databaseService";
import { TABLES } from "../lib/supabase";
import { useApp } from "../contexts/AppContext";
import { TimestampService } from "../services/timestampService";

export function useRealtimeSubscriptions() {
  const { dispatch } = useApp();

  const handleRealtimeUpdate = useCallback(
    (payload: any) => {
      const timestamp = payload.commit_timestamp;

      if (timestamp) {
        const updateTime = new Date(timestamp);

        if (!isNaN(updateTime.getTime())) {
          // Use enhanced timestamp service
          TimestampService.saveTimestamp(updateTime);

          // Update the app state
          dispatch({
            type: "SET_LAST_DB_UPDATE_TIME",
            payload: updateTime,
          });

          // Dispatch custom event for UpdateStatus component
          window.dispatchEvent(
            new CustomEvent("supabase-data-changed", {
              detail: {
                table: payload.table,
                eventType: payload.eventType,
                timestamp: timestamp,
                formattedTime: updateTime.toISOString(),
              },
            })
          );
        }
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (!dispatch) {
      console.warn("Dispatch not available for realtime subscriptions");
      return;
    }

    // Load last update time from localStorage on mount
    const savedTimestamp = TimestampService.loadTimestamp();
    if (savedTimestamp) {
      dispatch({
        type: "SET_LAST_DB_UPDATE_TIME",
        payload: savedTimestamp,
      });
    }

    console.log("🟢 REALTIME: Setting up subscriptions...");
    const subscriptions: any[] = [];

    // Subscribe to all tables
    Object.values(TABLES).forEach((tableName) => {
      try {
        const subscription = DatabaseService.subscribeToTable(
          tableName,
          handleRealtimeUpdate // This should be called when data changes
        );
        if (subscription) {
          subscriptions.push(subscription);
        } else {
          console.warn(`Failed to subscribe to table: ${tableName}`);
        }
      } catch (error) {
        console.error(`Error subscribing to table ${tableName}:`, error);
      }
    });

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach((subscription) => {
        try {
          if (subscription && typeof subscription.unsubscribe === "function") {
            subscription.unsubscribe();
          }
        } catch (error) {
          console.error("Error unsubscribing:", error);
        }
      });
    };
  }, [dispatch, handleRealtimeUpdate]);

  return {
    isSubscribed: true,
  };
}
