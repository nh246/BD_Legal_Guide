import { create } from 'zustand';

const useAuthStore = create((set) => ({
  role: localStorage.getItem('selected_role') || 'client',
  isOnboarded: false,
  setRole: (role) => {
    localStorage.setItem('selected_role', role);
    set({ role });
  },
  completeOnboarding: () => set({ isOnboarded: true }),
}));

export default useAuthStore;
