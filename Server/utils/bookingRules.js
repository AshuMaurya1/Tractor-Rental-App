export const getRentalDayCount = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }

  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
};

export const isDateRangeOverlapping = (startA, endA, startB, endB) => {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  if ([aStart, aEnd, bStart, bEnd].some((value) => Number.isNaN(value))) {
    return false;
  }

  return aStart < bEnd && bStart < aEnd;
};

export const calculateBookingPrice = (
  tractor = {},
  rentalDayCount = 1,
  includeDriver = false,
  rentalImplements = [],
  options = {},
) => {
  const { billingModel = 'daily', acreage = 1, hours = 1, insurance = false, comboDiscountPercent = 0 } = options;
  const days = Math.max(1, Number(rentalDayCount) || 1);
  const driverCost = includeDriver ? 500 * days : 0;

  let baseRate = 0;
  if (billingModel === 'acreage') {
    const ratePerAcre = Number(tractor.ratePerAcre) || 850;
    baseRate = ratePerAcre * Math.max(1, Number(acreage) || 1);
  } else if (billingModel === 'hourly') {
    const ratePerHour = Number(tractor.ratePerHour) || 550;
    baseRate = ratePerHour * Math.max(1, Number(hours) || 1);
  } else {
    const dailyRate = Number(tractor.pricePerDay || tractor.rentalPrice || 0);
    baseRate = dailyRate * days;
  }

  let implementCost = Array.isArray(rentalImplements)
    ? rentalImplements.reduce((sum, item) => {
        if (typeof item === 'object' && item !== null) {
          return sum + (Number(item.price || item.amount || 350) || 350);
        }
        return sum + 350;
      }, 0) * (billingModel === 'daily' ? days : 1)
    : 0;

  if (comboDiscountPercent > 0) {
    implementCost = Math.round(implementCost * (1 - comboDiscountPercent / 100));
  }

  const insuranceCost = insurance ? (billingModel === 'daily' ? 99 * days : 99) : 0;

  return Math.round(baseRate + driverCost + implementCost + insuranceCost);
};

export const calculateCancellationRefund = ({ totalAmount = 0, cancelledAt, startDate }) => {
  const amount = Number(totalAmount || 0);
  if (!amount || !cancelledAt || !startDate) {
    return { refundAmount: 0, refundRate: 0, status: 'no_refund', daysRemaining: 0 };
  }

  const cancellationTime = new Date(cancelledAt).getTime();
  const bookingStart = new Date(startDate).getTime();
  const differenceInDays = Math.max(0, Math.ceil((bookingStart - cancellationTime) / (1000 * 60 * 60 * 24)));

  let refundRate = 0;
  if (differenceInDays >= 7) refundRate = 0.8;
  else if (differenceInDays >= 3) refundRate = 0.5;
  else if (differenceInDays >= 1) refundRate = 0.8;

  const refundAmount = Math.round(amount * refundRate);

  let status = 'no_refund';
  if (refundAmount > 0 && refundRate >= 0.9) status = 'full_refund';
  else if (refundAmount > 0) status = 'partial_refund';

  return {
    refundAmount,
    refundRate,
    status,
    daysRemaining: differenceInDays,
  };
};
