export interface LoanParameters {
  principal: number;
  annualInterestRate: number;
  termMonths: number;
  monthlyOverpayment?: number;
  oneTimeOverpayment?: number;
  monthlyAdditionalCost?: number;
  scheduledPayment?: number;
  firstInstallmentInterest?: number;
  isFallingRates: boolean;
}

export interface AmortizationRow {
  id: string;
  month: number;
  payment: number;
  interest: number;
  principal: number;
  overpayment: number;
  additionalCost: number;
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
const EXTRA_ITERATIONS_GUARD = 24;

const toCents = (value: number) =>
  Math.round(value * TWO_DECIMALS) / TWO_DECIMALS;

type ScheduleMode = "annuity" | "falling";

interface ScheduleAccumulator {
  balance: number;
  month: number;
  totalInterestPaid: number;
  totalPaid: number;
  schedule: AmortizationRow[];
}

interface BaseScheduleParams {
  principal: number;
  monthlyRate: number;
  totalMonths: number;
  extraPayment: number;
  additionalCost: number;
  oneTimeOverpayment: number;
}

interface AnnuityScheduleParams extends BaseScheduleParams {
  minPayment: number;
  firstInstallmentInterest?: number;
}

type ScheduleComputation = Pick<
  ScheduleAccumulator,
  "schedule" | "totalInterestPaid" | "totalPaid"
>;

const createAccumulator = (principal: number): ScheduleAccumulator => ({
  balance: toCents(principal),
  month: 0,
  totalInterestPaid: 0,
  totalPaid: 0,
  schedule: []
});

const safetyCapFor = (totalMonths: number) =>
  totalMonths * 2 + EXTRA_ITERATIONS_GUARD;

const recordPayment = (
  acc: ScheduleAccumulator,
  mode: ScheduleMode,
  payload: {
    payment: number;
    interest: number;
    principal: number;
    overpayment: number;
    additionalCost: number;
  }
) => {
  acc.schedule.push({
    id: `${mode}-${acc.month}`,
    month: acc.month,
    payment: toCents(payload.payment),
    interest: toCents(payload.interest),
    principal: toCents(payload.principal),
    overpayment: toCents(payload.overpayment),
    additionalCost: toCents(payload.additionalCost),
    remainingBalance: toCents(acc.balance)
  });
};

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

function generateAnnuitySchedule({
  principal,
  monthlyRate,
  totalMonths,
  extraPayment,
  oneTimeOverpayment,
  additionalCost,
  minPayment,
  firstInstallmentInterest
}: AnnuityScheduleParams): ScheduleComputation {
  const acc = createAccumulator(principal);
  const safetyCap = safetyCapFor(totalMonths);

  while (acc.balance > DEFAULT_TOLERANCE && acc.month < safetyCap) {
    acc.month += 1;

    const interestPayment = toCents(
      acc.month === 1 &&
        firstInstallmentInterest !== undefined &&
        firstInstallmentInterest > 0
        ? firstInstallmentInterest
        : monthlyRate === 0
          ? 0
          : acc.balance * monthlyRate
    );
    let principalPayment = toCents(minPayment - interestPayment);
    if (principalPayment < 0) {
      principalPayment = 0;
    }

    let appliedOverpayment = toCents(
      extraPayment + (acc.month === 1 ? oneTimeOverpayment : 0)
    );
    let totalPrincipalThisMonth = toCents(
      principalPayment + appliedOverpayment
    );

    if (monthlyRate === 0) {
      principalPayment = minPayment;
      totalPrincipalThisMonth = toCents(
        principalPayment + appliedOverpayment
      );
    }

    if (acc.month >= totalMonths && totalPrincipalThisMonth < acc.balance) {
      principalPayment = toCents(
        principalPayment + acc.balance - totalPrincipalThisMonth
      );
      totalPrincipalThisMonth = acc.balance;
    }

    if (totalPrincipalThisMonth > acc.balance) {
      const excess = totalPrincipalThisMonth - acc.balance;
      appliedOverpayment = Math.max(appliedOverpayment - excess, 0);
      totalPrincipalThisMonth = acc.balance;
      principalPayment = totalPrincipalThisMonth - appliedOverpayment;
    }

    const totalPayment =
      interestPayment + totalPrincipalThisMonth + additionalCost;

    acc.balance = toCents(
      Math.max(acc.balance - totalPrincipalThisMonth, 0)
    );
    acc.totalInterestPaid += interestPayment;
    acc.totalPaid += totalPayment;

    recordPayment(acc, "annuity", {
      payment: totalPayment,
      interest: interestPayment,
      principal: principalPayment,
      overpayment: appliedOverpayment,
      additionalCost
    });

    if (acc.balance <= DEFAULT_TOLERANCE) {
      acc.balance = 0;
      break;
    }
  }

  return {
    schedule: acc.schedule,
    totalInterestPaid: acc.totalInterestPaid,
    totalPaid: acc.totalPaid
  };
}

function generateFallingRateSchedule({
  principal,
  monthlyRate,
  totalMonths,
  extraPayment,
  oneTimeOverpayment,
  additionalCost
}: BaseScheduleParams): ScheduleComputation {
  const acc = createAccumulator(principal);
  const safetyCap = safetyCapFor(totalMonths);
  const basePrincipalPayment = toCents(principal / totalMonths);

  while (acc.balance > DEFAULT_TOLERANCE && acc.month < safetyCap) {
    acc.month += 1;

    const interestPayment = toCents(
      monthlyRate === 0 ? 0 : acc.balance * monthlyRate
    );
    let principalPayment = basePrincipalPayment;
    if (principalPayment > acc.balance) {
      principalPayment = acc.balance;
    }

    let appliedOverpayment = toCents(
      extraPayment + (acc.month === 1 ? oneTimeOverpayment : 0)
    );
    let totalPrincipalThisMonth = toCents(
      principalPayment + appliedOverpayment
    );

    if (acc.month >= totalMonths && totalPrincipalThisMonth < acc.balance) {
      principalPayment = toCents(
        principalPayment + acc.balance - totalPrincipalThisMonth
      );
      totalPrincipalThisMonth = acc.balance;
    }

    if (totalPrincipalThisMonth > acc.balance) {
      const excess = totalPrincipalThisMonth - acc.balance;
      appliedOverpayment = Math.max(appliedOverpayment - excess, 0);
      totalPrincipalThisMonth = acc.balance;
      principalPayment = totalPrincipalThisMonth - appliedOverpayment;
    }

    const totalPayment =
      interestPayment + totalPrincipalThisMonth + additionalCost;

    acc.balance = toCents(
      Math.max(acc.balance - totalPrincipalThisMonth, 0)
    );
    acc.totalInterestPaid += interestPayment;
    acc.totalPaid += totalPayment;

    recordPayment(acc, "falling", {
      payment: totalPayment,
      interest: interestPayment,
      principal: principalPayment,
      overpayment: appliedOverpayment,
      additionalCost
    });

    if (acc.balance <= DEFAULT_TOLERANCE) {
      acc.balance = 0;
      break;
    }
  }

  return {
    schedule: acc.schedule,
    totalInterestPaid: acc.totalInterestPaid,
    totalPaid: acc.totalPaid
  };
}

export function generateAmortizationSchedule({
  principal,
  annualInterestRate,
  termMonths,
  monthlyOverpayment = 0,
  oneTimeOverpayment = 0,
  monthlyAdditionalCost = 0,
  scheduledPayment,
  firstInstallmentInterest,
  isFallingRates
}: LoanParameters): LoanComputationResult {
  if (!(principal > 0) || !(termMonths > 0)) {
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

  const totalMonths = Math.max(Math.round(termMonths), 1);
  const monthlyRate = annualInterestRate / 12 / 100;
  const baseMonthlyPayment =
    scheduledPayment && scheduledPayment > 0
      ? scheduledPayment
      : calculateMonthlyPayment(principal, annualInterestRate, totalMonths);
  const minPayment = toCents(baseMonthlyPayment);
  const extraPayment = Math.max(monthlyOverpayment ?? 0, 0);
  const additionalCost = Math.max(monthlyAdditionalCost ?? 0, 0);
  const lumpSumPayment = Math.max(oneTimeOverpayment ?? 0, 0);

  const computation = isFallingRates
    ? generateFallingRateSchedule({
        principal,
        monthlyRate,
        totalMonths,
        extraPayment,
        oneTimeOverpayment: lumpSumPayment,
        additionalCost
      })
    : generateAnnuitySchedule({
        principal,
        monthlyRate,
        totalMonths,
        extraPayment,
        oneTimeOverpayment: lumpSumPayment,
        additionalCost,
        minPayment,
        firstInstallmentInterest
      });

  const { schedule, totalInterestPaid, totalPaid } = computation;
  const firstPayment = schedule[0] ?? null;
  const baseFirstPayment = firstPayment
    ? firstPayment.payment -
      firstPayment.overpayment -
      firstPayment.additionalCost
    : 0;

  return {
    monthlyPayment: toCents(baseFirstPayment),
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
