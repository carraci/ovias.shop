export type InternalShippingStatus =
  | "ORDER_CONFIRMED"
  | "PROCESSING"
  | "FAILED"
  | "READY_TO_SHIP"
  | "PICKUP_SCHEDULED"
  | "NDR"
  | "PACKED"
  | "SHIPMENT_CREATED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "DELIVERY_FAILED"
  | "CANCELLED"
  | "RTO"
  | "RETURNED";

export type TrackingEvent = {
  status: InternalShippingStatus;
  description: string;
  location?: string;
  timestamp: string;
  isSimulated?: boolean;
};

export type OrderShipping = {
  provider: "delhivery" | "shiprocket" | "simulator";
  environment: "staging" | "production" | "sandbox";
  verified?: boolean;
  shipmentId?: string;
  awb?: string;
  courier?: string;
  status: InternalShippingStatus;
  statusCode?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
  lastUpdatedAt?: string;
  labelUrl?: string;
  pickup?: {
    pickupId?: number | string;
    status?: string;
    date?: string;
    time?: string;
    location?: string;
    expectedCount?: number;
    message?: string;
  };
  logistics?: {
    standardizedAddress?: string;
    addressCorrections?: string[];
    granularity?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    route?: {
      distanceKm: number;
      durationMinutes: number;
      hasToll?: boolean;
    };
  };
  events: TrackingEvent[];
};

export type ServiceabilityQuery = {
  pincode: string;
};

export type ServiceabilityResult = {
  uncertain?: boolean;
  serviceable: boolean;
  pincode: string;
  city?: string;
  state?: string;
  codAvailable?: boolean;
  prepaidAvailable?: boolean;
  estimatedDays?: number;
  raw?: unknown;
};

export type CreateShipmentRequest = {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  customer: {
    name: string;
    email: string;
    phone?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
  weightGrams?: number;
  dimensionsCm?: {
    length: number;
    width: number;
    height: number;
  };
};

export type CreateShipmentResult = {
  success: boolean;
  uncertain?: boolean;
  shipmentId?: string;
  awb?: string;
  courier: string;
  status: InternalShippingStatus;
  statusCode?: string;
  labelUrl?: string;
  raw?: unknown;
  error?: string;
};

export type TrackingResult = {
  success: boolean;
  uncertain?: boolean;
  awb?: string;
  courier?: string;
  status: InternalShippingStatus;
  statusCode?: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
  error?: string;
  raw?: unknown;
};

export type CancelShipmentResult = {
  success: boolean;
  uncertain?: boolean;
  message?: string;
  error?: string;
  raw?: unknown;
};

export type PickupRequest = {
  pickupDate: string; // YYYY-MM-DD
  pickupTime?: string; // HH:MM:SS
  pickupLocation?: string;
  expectedPackageCount?: number;
};

export type PickupResult = {
  success: boolean;
  uncertain?: boolean;
  pickupId?: number | string;
  pickupLocation?: string;
  incomingCenterName?: string;
  message?: string;
  error?: string;
  raw?: unknown;
};

export type LabelResult = {
  success: boolean;
  uncertain?: boolean;
  awb: string;
  labelUrl?: string;
  pdfDownloadLink?: string;
  html?: string;
  error?: string;
  raw?: unknown;
};

export interface ShippingProvider {
  name: string;
  checkServiceability(
    query: ServiceabilityQuery,
  ): Promise<ServiceabilityResult>;
  createShipment(request: CreateShipmentRequest): Promise<CreateShipmentResult>;
  trackShipment(awbOrOrderId: string): Promise<TrackingResult>;
  cancelShipment(awb: string): Promise<CancelShipmentResult>;
  requestPickup(request: PickupRequest): Promise<PickupResult>;
  getShippingLabel(awb: string): Promise<LabelResult>;
  parseWebhookPayload(payload: unknown): {
    awb?: string;
    orderId?: string;
    status: InternalShippingStatus;
    event: TrackingEvent;
  } | null;
}
