// src/services/timestampService.ts (updated version)
export class TimestampService {
  private static readonly STORAGE_KEY = "dashboard_last_update_timestamp";
  private static readonly BACKUP_KEY = "dashboard_last_update_backup";
  private static readonly USER_KEY = "dashboard_user_timestamp";

  /**
   * Save timestamp with multiple persistence layers
   */
  static saveTimestamp(timestamp: Date | string, userId?: string): void {
    const timestampString =
      timestamp instanceof Date ? timestamp.toISOString() : timestamp;

    try {
      // Primary storage - localStorage
      localStorage.setItem(this.STORAGE_KEY, timestampString);

      // Backup storage - for additional persistence
      localStorage.setItem(this.BACKUP_KEY, timestampString);

      // User-specific storage (optional)
      if (userId) {
        localStorage.setItem(`${this.USER_KEY}_${userId}`, timestampString);
      }

      // Session storage as fallback
      sessionStorage.setItem(this.STORAGE_KEY, timestampString);

      console.log("🟢 TIMESTAMP_SERVICE: Saved timestamp:", timestampString);
    } catch (error) {
      console.error("🔴 TIMESTAMP_SERVICE: Error saving timestamp:", error);
    }
  }

  /**
   * Load timestamp with fallback mechanism
   */
  static loadTimestamp(userId?: string): Date | null {
    try {
      let timestampString = null;

      // Try user-specific storage first if userId provided
      if (userId) {
        timestampString = localStorage.getItem(`${this.USER_KEY}_${userId}`);
      }

      // Try primary storage
      if (!timestampString) {
        timestampString = localStorage.getItem(this.STORAGE_KEY);
      }

      // Fallback to backup storage
      if (!timestampString) {
        timestampString = localStorage.getItem(this.BACKUP_KEY);
        console.log("🟡 TIMESTAMP_SERVICE: Using backup timestamp");
      }

      // Fallback to session storage
      if (!timestampString) {
        timestampString = sessionStorage.getItem(this.STORAGE_KEY);
        console.log("🟡 TIMESTAMP_SERVICE: Using session timestamp");
      }

      if (timestampString) {
        const timestamp = new Date(timestampString);
        if (!isNaN(timestamp.getTime())) {
          console.log("🟢 TIMESTAMP_SERVICE: Loaded timestamp:", timestamp);
          return timestamp;
        }
      }

      console.log("🟡 TIMESTAMP_SERVICE: No valid timestamp found");
      return null;
    } catch (error) {
      console.error("🔴 TIMESTAMP_SERVICE: Error loading timestamp:", error);
      return null;
    }
  }

  /**
   * Clear all timestamp data (for sign-out)
   */
  static clearAllTimestamps(): void {
    try {
      // Clear session-specific data
      sessionStorage.removeItem(this.STORAGE_KEY);

      // Note: We keep localStorage data persistent across sign-out
      // Only clear if you want to reset on every sign-out
      console.log("🟡 TIMESTAMP_SERVICE: Session timestamps cleared");
    } catch (error) {
      console.error("🔴 TIMESTAMP_SERVICE: Error clearing timestamps:", error);
    }
  }

  /**
   * Update timestamp and ensure persistence
   */
  static updateTimestamp(userId?: string): Date {
    const now = new Date();
    this.saveTimestamp(now, userId);
    return now;
  }

  /**
   * Check if stored timestamp is recent (within last 30 days)
   */
  static isTimestampRecent(maxDaysOld: number = 30): boolean {
    const timestamp = this.loadTimestamp();
    if (!timestamp) return false;

    const daysDiff =
      (new Date().getTime() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= maxDaysOld;
  }
}
