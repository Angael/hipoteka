import { useDeferredValue, useState } from "react";

const currencyFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN"
});

export const formatCurrency = (value: number) =>
  currencyFormatter.format(Number.isFinite(value) ? value : 0);

export const useDefferedInputState = <T>(value: T) => {
  const [state, setState] = useState<T>(value);

  const inputProps = {
    value: state,
    onChange: setState
  };

  const deferredState = useDeferredValue(state);

  return [deferredState, inputProps] as const;
};
