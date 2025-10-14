import { useEffect, useCallback } from "react";
import { DatabaseService } from "../services/databaseService";
import { TABLES } from "../lib/supabase";
import { useApp } from "../contexts/AppContext";

export function useRealtimeSubscriptions() {
  const { dispatch } = useApp();

  // This function will now ONLY update the local UI state.
  const handleRealtimeUpdate = useCallback(
    (payload: any) => {
      console.log("🟢 REALTIME: Event received:", payload);
      const timestamp = payload.commit_timestamp;
      const eventType = payload.eventType;
      const table = payload.table;

      if (timestamp) {
        const updateTime = new Date(timestamp);

        if (!isNaN(updateTime.getTime())) {
          // Update the local app state in React
          dispatch({
            type: "SET_LAST_DB_UPDATE_TIME",
            payload: updateTime,
          });

          // Dispatch a custom event for other components like UpdateStatus
          window.dispatchEvent(
            new CustomEvent("supabase-data-changed", {
              detail: {
                table,
                eventType,
                timestamp,
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

    console.log("🟢 REALTIME: Setting up subscriptions...");
    const subscriptions: any[] = [];

    // Subscribe to all tables EXCEPT app_status to avoid loops
    const tablesToSubscribe = Object.values(TABLES).filter(
      (tableName) => tableName !== "app_status"
    );

    tablesToSubscribe.forEach((tableName) => {
      try {
        const subscription = DatabaseService.subscribeToTable(
          tableName,
          handleRealtimeUpdate
        );
        subscriptions.push(subscription);
      } catch (error) {
        console.error(`Error subscribing to table ${tableName}:`, error);
      }
    });

    // Cleanup on unmount
    return () => {
      console.log("🔴 REALTIME: Unsubscribing...");
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

  return { isSubscribed: true };
}
