import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateBookingPrice,
  isDateRangeOverlapping,
  calculateCancellationRefund,
} from '../utils/bookingRules.js';

test('calculateBookingPrice includes daily rate, driver, and implement cost', () => {
  const price = calculateBookingPrice({ pricePerDay: 2500 }, 3, true, ['rotavator', 'sprayer']);
  assert.equal(price, 7500 + 1500 + 2100);
});

test('isDateRangeOverlapping detects overlapping date windows', () => {
  assert.equal(
    isDateRangeOverlapping(new Date('2026-03-10'), new Date('2026-03-15'), new Date('2026-03-12'), new Date('2026-03-18')),
    true,
  );

  assert.equal(
    isDateRangeOverlapping(new Date('2026-03-10'), new Date('2026-03-15'), new Date('2026-03-16'), new Date('2026-03-18')),
    false,
  );
});

test('calculateCancellationRefund applies progressive refund rule', () => {
  const refund = calculateCancellationRefund({ totalAmount: 12000, cancelledAt: new Date('2026-03-08'), startDate: new Date('2026-03-10') });
  assert.equal(refund.refundAmount, 9600);
  assert.equal(refund.status, 'partial_refund');
});

test('calculateBookingPrice supports acreage billing with micro-insurance and combo discount', () => {
  const price = calculateBookingPrice(
    { ratePerAcre: 850 },
    1,
    false,
    [{ price: 400 }],
    { billingModel: 'acreage', acreage: 5, insurance: true, comboDiscountPercent: 15 }
  );
  // Base: 850 * 5 = 4250. Implements: 400 * 0.85 = 340. Insurance: 99. Total = 4689
  assert.equal(price, 4250 + 340 + 99);
});
