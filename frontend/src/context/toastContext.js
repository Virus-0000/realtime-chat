import { createContext, useContext } from "react";

export const ToastContext = createContext(null);

// toast.success(msg) / toast.error(msg) / toast.info(msg) / toast.dismiss(id)
export const useToast = () => useContext(ToastContext);
