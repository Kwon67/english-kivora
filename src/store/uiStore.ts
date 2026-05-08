import { create } from 'zustand'

interface UIState {
  isZenMode: boolean
  setZenMode: (val: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  isZenMode: false,
  setZenMode: (val) => set({ isZenMode: val }),
}))
