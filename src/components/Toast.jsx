import { useEffect, useState } from "react";

let toastId = 0;
let showToastFn = null;

export function showToast(message, type = "info") {
  if (showToastFn) {
    showToastFn(message, type);
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    showToastFn = (message, type) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      
      // Auto-remove after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    return () => {
      showToastFn = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "400px",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast"
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            background:
              toast.type === "error"
                ? "rgba(255, 100, 100, 0.95)"
                : toast.type === "success"
                ? "rgba(100, 255, 150, 0.95)"
                : "rgba(100, 150, 255, 0.95)",
            color: toast.type === "error" ? "#fff" : "#0a0c10",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(10px)",
            animation: "slideIn 0.3s ease",
            fontWeight: 500,
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
