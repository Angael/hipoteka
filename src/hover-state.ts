import { create } from "zustand";
import type { AmortizationRow } from "./loanCalculations";

const initState: AmortizationRow = {
  id: "null",
  month: 0,
  payment: 0,
  interest: 0,
  principal: 0,
  overpayment: 0,
  remainingBalance: 0
};

export const useHoverState = create<{
  hoveredRow: AmortizationRow;
  setHoverState: (row: AmortizationRow) => void;
  resetHoverState: () => void;
}>((set) => ({
  hoveredRow: initState,

  setHoverState: (hoveredRow: AmortizationRow) => set(() => ({ hoveredRow })),
  resetHoverState: () =>
    set(() => ({
      hoveredRow: initState
    }))
}));
