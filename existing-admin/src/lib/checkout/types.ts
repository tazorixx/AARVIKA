export type CheckoutAddress = {
  id?: string;
  label?: string;
  name: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
};

export type CheckoutDeliverySelection = {
  cartKey: string;
  pincode: string;
  date: string;
  slot: string;
};

export type CheckoutLine = {
  cartKey: string;
  productId: string;
  title: string;
  image?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  variant?: string;
  personalization?: Record<string, string>;
  giftMessage?: string;
  deliveryDate: string;
  deliverySlot: string;
};

export type CheckoutTotals = {
  subtotal: number;
  delivery: number;
  discount: number;
  tax: number;
  grandTotal: number;
};

export type CouponValidation = {
  code: string;
  discount: number;
};

export type DeliveryValidationResponse = {
  valid: true;
  lines: CheckoutLine[];
  totals: CheckoutTotals;
  delivery: CheckoutDeliverySelection[];
  address: CheckoutAddress;
};

export type DeliveryValidationError = {
  valid: false;
  error: string;
  field?: "address" | "pincode" | "date" | "slot" | "cart";
  cartKey?: string;
};
