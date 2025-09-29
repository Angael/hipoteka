export interface LoanParameters {
  principal: number;
  annualInterestRate: number; // expressed as percentage, e.g. 6.5 for 6.5%
  years: number; // loan duration in years
  monthlyOverpayment?: number; // optional extra payment added on top of the regular instalment
}

export interface AmortizationRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  overpayment: number;
  remainingBalance: number;
}

export interface LoanComputationResult {
  monthlyPayment: number;
  actualFirstPayment: number;
  firstPaymentBreakdown: {
    interest: number;
    capital: number;
    overpayment: number;
  } | null;
  totalInterestPaid: number;
  totalPaid: number;
  payoffMonths: number;
  schedule: AmortizationRow[];
}

const TWO_DECIMALS = 100;
const DEFAULT_TOLERANCE = 0.01;

const toCents = (value: number) =>
  Math.round(value * TWO_DECIMALS) / TWO_DECIMALS;

export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  totalMonths: number
): number {
  if (!(principal > 0) || !(totalMonths > 0)) {
    return 0;
  }

  const monthlyRate = annualInterestRate / 12 / 100;

  if (monthlyRate === 0) {
    return principal / totalMonths;
  }

  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const payment = (principal * monthlyRate * factor) / (factor - 1);
  return payment;
}

export function generateAmortizationSchedule({
  principal,
  annualInterestRate,
  years,
  monthlyOverpayment = 0
}: LoanParameters): LoanComputationResult {
  if (!(principal > 0) || !(years > 0)) {
    return {
      monthlyPayment: 0,
      actualFirstPayment: 0,
      firstPaymentBreakdown: null,
      totalInterestPaid: 0,
      totalPaid: 0,
      payoffMonths: 0,
      schedule: []
    };
  }

  const totalMonths = Math.max(Math.round(years * 12), 1);
  const monthlyRate = annualInterestRate / 12 / 100;
  const baseMonthlyPayment = calculateMonthlyPayment(
    principal,
    annualInterestRate,
    totalMonths
  );
  const minPayment = toCents(baseMonthlyPayment);
  const extraPayment = Math.max(monthlyOverpayment, 0);

  let balance = principal;
  let month = 0;
  let totalInterestPaid = 0;
  let totalPaid = 0;
  const schedule: AmortizationRow[] = [];

  const safetyCap = totalMonths * 2 + 24; // avoid infinite loops for pathological inputs

  while (balance > DEFAULT_TOLERANCE && month < safetyCap) {
    month += 1;

    const interestPayment = monthlyRate === 0 ? 0 : balance * monthlyRate;
    let principalPayment = minPayment - interestPayment;
    if (principalPayment < 0) {
      principalPayment = 0;
    }

    let appliedOverpayment = extraPayment;
    let totalPrincipalThisMonth = principalPayment + appliedOverpayment;

    if (monthlyRate === 0) {
      // For zero-interest loans, whole payment goes to principal
      principalPayment = minPayment;
      totalPrincipalThisMonth = principalPayment + appliedOverpayment;
    }

    if (totalPrincipalThisMonth > balance) {
      // Adjust overpayment so we don't overpay past the remaining balance
      const excess = totalPrincipalThisMonth - balance;
      appliedOverpayment = Math.max(appliedOverpayment - excess, 0);
      totalPrincipalThisMonth = balance;
      principalPayment = totalPrincipalThisMonth - appliedOverpayment;
    }

    const totalPayment = interestPayment + totalPrincipalThisMonth;
    balance = Math.max(balance - totalPrincipalThisMonth, 0);

    totalInterestPaid += interestPayment;
    totalPaid += totalPayment;

    schedule.push({
      month,
      payment: toCents(totalPayment),
      interest: toCents(interestPayment),
      principal: toCents(totalPrincipalThisMonth - appliedOverpayment),
      overpayment: toCents(appliedOverpayment),
      remainingBalance: toCents(balance)
    });

    if (balance <= DEFAULT_TOLERANCE) {
      balance = 0;
      break;
    }
  }

  const firstPayment = schedule[0] ?? null;

  return {
    monthlyPayment: toCents(minPayment),
    actualFirstPayment: toCents(firstPayment?.payment ?? 0),
    firstPaymentBreakdown: firstPayment
      ? {
          interest: toCents(firstPayment.interest),
          capital: toCents(firstPayment.principal + firstPayment.overpayment),
          overpayment: toCents(firstPayment.overpayment)
        }
      : null,
    totalInterestPaid: toCents(totalInterestPaid),
    totalPaid: toCents(totalPaid),
    payoffMonths: schedule.length,
    schedule
  };
}
