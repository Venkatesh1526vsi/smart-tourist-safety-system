import { toast } from "react-hot-toast";

/**
 * Success notification
 */
export const notifySuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    style: {
      background: "#16a34a",
      color: "#fff",
    },
  });
};

/**
 * Error notification
 */
export const notifyError = (message: string) => {
  toast.error(message, {
    duration: 4000,
    style: {
      background: "#dc2626",
      color: "#fff",
    },
  });
};

/**
 * Warning notification
 */
export const notifyWarning = (message: string) => {
  toast(message, {
    icon: "⚠️",
    duration: 3500,
    style: {
      background: "#f59e0b",
      color: "#000",
    },
  });
};

/**
 * Info notification
 */
export const notifyInfo = (message: string) => {
  toast(message, {
    icon: "ℹ️",
    duration: 3000,
    style: {
      background: "#3b82f6",
      color: "#fff",
    },
  });
};