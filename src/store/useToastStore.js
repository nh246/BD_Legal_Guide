import { create } from 'zustand';

let nextId = 1;

export const useToastStore = create((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = nextId++;
    const message = toast.message || (toast.title ? (toast.description ? `${toast.title}: ${toast.description}` : toast.title) : '');
    const variant = toast.variant === 'destructive' ? 'error' : (toast.variant || 'info');
    set((s) => ({
      toasts: [...s.toasts, { id, title: toast.title, description: toast.description, message, variant }]
    }));
    setTimeout(() => get().dismiss(id), 4000);
  },
  show: (message, variant = 'info') => {
    if (get().toasts.some((t) => t.message === message)) return;
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => get().dismiss(id), 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (message, variant) => useToastStore.getState().show(message, variant);
toast.success = (msg) => useToastStore.getState().show(msg, 'success');
toast.error = (msg) => useToastStore.getState().show(msg, 'error');
toast.info = (msg) => useToastStore.getState().show(msg, 'info');
toast.warning = (msg) => useToastStore.getState().show(msg, 'warning');

export default useToastStore;
