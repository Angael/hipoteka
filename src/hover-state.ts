import { create } from "zustand";
import type { AmortizationRow } from "./loanCalculations";

export const useHoverState = create<{
  hoveredRow: AmortizationRow;
  setHoverState: (row: AmortizationRow) => void;
}>((set) => ({
  hoveredRow: {
    month: 0,
    payment: 0,
    interest: 0,
    principal: 0,
    overpayment: 0,
    remainingBalance: 0
  },

  setHoverState: (hoveredRow: AmortizationRow) => set(() => ({ hoveredRow }))
}));
