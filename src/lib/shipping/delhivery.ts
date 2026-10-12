import type {
  ShippingProvider,
  InternalShippingStatus,
  ServiceabilityQuery,
  ServiceabilityResult,
  CreateShipmentRequest,
  CreateShipmentResult,
  TrackingResult,
  CancelShipmentResult,
  PickupRequest,
  PickupResult,
  LabelResult,
  TrackingEvent,
} from "./types";

/**
 * Maps Delhivery specific status strings and scan codes to internal OVIA statuses.
 */
export function mapDelhiveryStatus(
  status?: string,
  scanType?: string,
): InternalShippingStatus {
  const norm = (status || scanType || "").trim().toUpperCase();
  if (scanType?.trim().toUpperCase() === "RT" && !norm.includes("CANCEL"))
    return norm === "DELIVERED" || norm === "DL" ? "RETURNED" : "RTO";
  if (
    norm.includes("UNDELIVER") ||
    norm.includes("NDR") ||
    norm.includes("FAIL") ||
    norm === "PENDING"
  )
    return "NDR";
  if (
    norm.includes("RTO") ||
    norm.includes("RETURN TO ORIGIN") ||
    norm === "RT"
  )
    return "RTO";
  if (norm.includes("RETURNED")) return "RETURNED";
  if (norm.includes("CANCEL") || norm === "CN") return "CANCELLED";
  if (norm === "DELIVERED" || norm === "DL") return "DELIVERED";
  if (norm.includes("OUT FOR DELIVERY") || norm === "OFD")
    return "OUT_FOR_DELIVERY";
  if (norm.includes("PICKED UP") || norm === "PICKUP COMPLETE" || norm === "PU")
    return "PICKED_UP";
  if (norm.includes("PICKUP SCHEDULE") || norm === "SCHEDULED")
    return "PICKUP_SCHEDULED";
  if (
    norm.includes("IN TRANSIT") ||
    norm.includes("DISPATCH") ||
    norm.includes("REACHED") ||
    norm === "UD"
  )
    return "IN_TRANSIT";
  if (
    norm.includes("MANIFEST") ||
    norm.includes("CREATED") ||
    norm.includes("REGISTERED")
  )
    return "READY_TO_SHIP";
  if (norm.includes("PACK")) return "PACKED";
  return "PROCESSING";
}

export class DelhiveryShippingProvider implements ShippingProvider {
  public readonly name = "delhivery";
  private readonly baseUrl: string;
  private readonly token: string;
  public readonly isStaging: boolean;
  public readonly pickupLocation: string;

  constructor() {
    this.token = (
      process.env.DELHIVERY_API_TOKEN ||
      process.env.DELHIVERY_TEST_TOKEN ||
      ""
    ).trim();
    // Default to production when DELHIVERY_API_TOKEN is set or DELHIVERY_ENV === 'production'
    this.isStaging = process.env.DELHIVERY_ENV === "staging";
    this.baseUrl = this.isStaging
      ? "https://staging-express.delhivery.com"
      : "https://track.delhivery.com";
    this.pickupLocation = (process.env.DELHIVERY_PICKUP_LOCATION || "").trim();
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Token ${this.token}`,
      Accept: "application/json",
    };
  }

  public isConfigured(): boolean {
    return Boolean(this.token);
  }

  async checkServiceability(
    query: ServiceabilityQuery,
  ): Promise<ServiceabilityResult> {
    if (!this.isConfigured()) {
      throw new Error(
        "Delivery availability cannot be confirmed: carrier connection is not configured.",
      );
    }

    try {
      const url = `${this.baseUrl}/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(query.pincode)}`;
      const res = await fetch(url, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return { serviceable: false, pincode: query.pincode };
      }

      const data = await res.json();
      const codeList = data?.delivery_codes || [];
      const match = codeList.find(
        (c: { postal_code?: { pin?: number | string } }) =>
          String(c?.postal_code?.pin) === query.pincode,
      );

      if (!match) {
        return { serviceable: false, pincode: query.pincode, raw: data };
      }

      const details = match.postal_code || {};
      const isPrepaid = details.pre_paid === "Y";
      const isCod = details.cod === "Y";

      return {
        serviceable: isPrepaid || isCod,
        pincode: query.pincode,
        city: details.city,
        state: details.state_code,
        codAvailable: isCod,
        prepaidAvailable: isPrepaid,

        raw: data,
      };
    } catch (err) {
      console.warn("[Delhivery checkServiceability]", (err as Error).message);
      return {
        serviceable: false,
        pincode: query.pincode,
        raw: { error: (err as Error).message },
      };
    }
  }

  async createShipment(
    request: CreateShipmentRequest,
  ): Promise<CreateShipmentResult> {
    if (!this.isConfigured())
      return {
        success: false,
        courier: "Delhivery",
        status: "FAILED",
        error: "Courier credentials are not configured.",
      };

    try {
      const rawPhone = (request.customer.phone || "").replace(/[^0-9]/g, "");
      const cleanPhone = rawPhone.length > 10 ? rawPhone.slice(-10) : rawPhone;
      const cleanAddress =
        `${request.customer.addressLine1} ${request.customer.addressLine2 || ""}`
          .trim()
          .slice(0, 200);

      if (
        !this.pickupLocation ||
        cleanPhone.length !== 10 ||
        !request.weightGrams ||
        !request.dimensionsCm ||
        Object.values(request.dimensionsCm).some(
          (value) => !Number.isFinite(value) || value <= 0,
        )
      )
        return {
          success: false,
          courier: "Delhivery",
          status: "FAILED",
          error:
            "Configure the registered pickup location and supply the actual package weight, dimensions and customer phone.",
        };
      // Format payload according to Delhivery CMU Create JSON specification
      const shipmentData = {
        shipments: [
          {
            name: request.customer.name,
            add: cleanAddress,
            pin: request.customer.postalCode,
            city: request.customer.city,
            state: request.customer.state,
            country: request.customer.country || "India",
            phone: cleanPhone,
            order: request.orderNumber,
            payment_mode: "Prepaid",
            products_desc: request.items
              .map((i) => `${i.name} (x${i.quantity})`)
              .join(", ")
              .slice(0, 250),
            total_amount: (request.totalAmount / 100).toFixed(2),
            cod_amount: "0.0",
            weight: String(request.weightGrams),
            shipment_width: request.dimensionsCm?.width || 20,
            shipment_height: request.dimensionsCm?.height || 10,
            shipment_length: request.dimensionsCm?.length || 30,
          },
        ],
        pickup_location: { name: this.pickupLocation },
      };

      const params = new URLSearchParams();
      params.append("format", "json");
      params.append("data", JSON.stringify(shipmentData));

      const res = await fetch(`${this.baseUrl}/api/cmu/create.json`, {
        method: "POST",
        headers: {
          ...this.getHeaders(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
        signal: AbortSignal.timeout(10000),
      });

      const data = await res.json();

      // Check package response
      const packageObj = data?.packages?.[0];
      if (
        res.ok &&
        data.success === true &&
        packageObj &&
        ["Success", "Manifested"].includes(packageObj.status) &&
        /^\d{8,30}$/.test(String(packageObj.waybill || packageObj.awb || ""))
      ) {
        const awb = String(packageObj.waybill || packageObj.awb || "");
        return {
          success: true,
          shipmentId: packageObj.refnum || undefined,
          awb,
          courier: "Delhivery Express",
          status: "READY_TO_SHIP",
          statusCode: packageObj.status || "Manifested",
          labelUrl: `/api/admin/orders/${request.orderId}/shipping-label`,
          raw: data,
        };
      }

      return {
        success: false,
        courier: "Delhivery",
        status: "READY_TO_SHIP",
        error:
          packageObj?.remarks?.[0] ||
          data?.rmk ||
          "Delhivery shipment creation failed.",
        uncertain: res.status >= 500 || (res.ok && data.success !== false),
        raw: data,
      };
    } catch (err) {
      return {
        success: false,
        courier: "Delhivery",
        status: "READY_TO_SHIP",
        uncertain: true,
        error:
          "Courier response could not be confirmed. Check the existing operation before retrying.",
      };
    }
  }

  async trackShipment(awbOrOrderId: string): Promise<TrackingResult> {
    if (!this.isConfigured())
      return {
        success: false,
        status: "PROCESSING",
        events: [],
        error: "Courier credentials are not configured.",
      };

    try {
      const isAwb = /^\d{8,30}$/.test(awbOrOrderId);
      const queryParam = isAwb
        ? `waybill=${encodeURIComponent(awbOrOrderId)}`
        : `ref_ids=${encodeURIComponent(awbOrOrderId)}`;
      const url = `${this.baseUrl}/api/v1/packages/json/?${queryParam}`;

      const res = await fetch(url, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return {
          success: false,
          status: "READY_TO_SHIP",
          error: `Delhivery tracking returned status ${res.status}`,
          events: [],
        };
      }

      const data = await res.json();
      const shipmentData = data?.ShipmentData?.[0]?.Shipment;

      if (
        !shipmentData ||
        !/^\d{8,30}$/.test(String(shipmentData.AWB || "")) ||
        (isAwb && String(shipmentData.AWB) !== awbOrOrderId) ||
        (!isAwb && shipmentData.ReferenceNo !== awbOrOrderId)
      ) {
        return {
          success: false,
          status: "READY_TO_SHIP",
          error: "No tracking details found for this shipment.",
          events: [],
          raw: data,
        };
      }

      const currentStatusStr =
        shipmentData.Status?.Status || shipmentData.Status?.StatusType;
      const internalStatus = mapDelhiveryStatus(
        currentStatusStr,
        shipmentData.Status?.StatusType,
      );

      if (internalStatus === "PROCESSING")
        return {
          success: false,
          status: "PROCESSING",
          events: [],
          error: "Courier status is not recognised.",
        };
      const rawScans = (shipmentData.Scans || []).filter(
        (item: any) =>
          item.ScanDetail?.ScanDateTime &&
          Number.isFinite(Date.parse(item.ScanDetail.ScanDateTime)),
      );
      const events: TrackingEvent[] = rawScans.map(
        (scanItem: {
          ScanDetail?: {
            Scan?: string;
            ScanType?: string;
            ScanDateTime?: string;
            ScannedLocation?: string;
            Instructions?: string;
          };
        }) => {
          const detail = scanItem.ScanDetail || {};
          return {
            status: mapDelhiveryStatus(detail.Scan, detail.ScanType),
            description:
              detail.Instructions || detail.Scan || "Package scan update",
            location: detail.ScannedLocation || undefined,
            timestamp: detail.ScanDateTime
              ? new Date(detail.ScanDateTime).toISOString()
              : new Date().toISOString(),
          };
        },
      );

      const currentTime = shipmentData.Status?.StatusDateTime;
      if (currentTime && Number.isFinite(Date.parse(currentTime)))
        events.push({
          status: internalStatus,
          description: shipmentData.Status?.Instructions || currentStatusStr,
          timestamp: new Date(currentTime).toISOString(),
          location: shipmentData.Status?.StatusLocation,
        });
      return {
        success: true,
        awb: String(shipmentData.AWB),
        courier: "Delhivery",
        status: internalStatus,
        statusCode: currentStatusStr,
        estimatedDelivery: shipmentData.ExpectedDeliveryDate || undefined,
        events,
        raw: data,
      };
    } catch (err) {
      return {
        success: false,
        status: "READY_TO_SHIP",
        uncertain: true,
        error:
          "Courier response could not be confirmed. Check the existing operation before retrying.",
        events: [],
      };
    }
  }

  async cancelShipment(awb: string): Promise<CancelShipmentResult> {
    if (!this.isConfigured())
      return {
        success: false,
        error: "Courier credentials are not configured.",
      };

    try {
      const res = await fetch(`${this.baseUrl}/api/p/edit`, {
        method: "POST",
        headers: {
          ...this.getHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          waybill: awb,
          cancellation: "true",
        }),
        signal: AbortSignal.timeout(8000),
      });

      const data = await res.json();
      return {
        success: res.ok && data.status === "Success",
        uncertain:
          res.status >= 500 ||
          (res.ok && !["Success", "Failure", "Fail"].includes(data.status)),
        message:
          data?.message ||
          (res.ok ? "Shipment cancelled." : "Failed to cancel shipment."),
        raw: data,
      };
    } catch (err) {
      return {
        success: false,
        uncertain: true,
        error:
          "Courier response could not be confirmed. Check the existing operation before retrying.",
      };
    }
  }

  async requestPickup(request: PickupRequest): Promise<PickupResult> {
    if (!this.isConfigured())
      return {
        success: false,
        error: "Courier credentials are not configured.",
      };

    try {
      const url = `${this.baseUrl}/fm/request/new/`;
      const payload = {
        pickup_time: request.pickupTime || "14:00:00",
        pickup_date: request.pickupDate,
        pickup_location: request.pickupLocation || this.pickupLocation,
        expected_package_count: request.expectedPackageCount || 1,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          ...this.getHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.pickup_id && data.success !== false) {
        return {
          success: true,
          pickupId: data.pickup_id,
          pickupLocation: payload.pickup_location,
          incomingCenterName: data.incoming_center_name,
          message:
            data.message || "Pickup scheduled successfully with Delhivery.",
          raw: data,
        };
      }

      const errorMsg =
        data.prepaid ||
        data.error ||
        data.message ||
        data.rmk ||
        `Delhivery pickup request failed with HTTP ${res.status}`;
      return {
        success: false,
        uncertain: res.status >= 500 || (res.ok && data.success !== false),
        error: errorMsg,
        raw: data,
      };
    } catch (err) {
      return {
        success: false,
        uncertain: true,
        error:
          "Courier response could not be confirmed. Check the existing operation before retrying.",
      };
    }
  }

  async getShippingLabel(awb: string): Promise<LabelResult> {
    if (!this.isConfigured())
      return {
        success: false,
        awb,
        error: "Courier credentials are not configured.",
      };

    try {
      const url = `${this.baseUrl}/api/p/packing_slip?wbns=${encodeURIComponent(awb)}&pdf=True`;
      const res = await fetch(url, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        return {
          success: false,
          awb,
          error: `Delhivery packing slip API returned HTTP ${res.status}`,
        };
      }

      const data = await res.json().catch(() => ({}));
      const pkg = data?.packages?.[0];
      return {
        success: Boolean(pkg?.pdf_download_link || pkg?.pdf_url),
        awb,
        labelUrl: pkg?.pdf_download_link || pkg?.pdf_url,
        pdfDownloadLink: pkg?.pdf_download_link,
        html: pkg?.html,
        raw: data,
      };
    } catch (err) {
      return {
        success: false,
        awb,
        uncertain: true,
        error:
          "Courier response could not be confirmed. Check the existing operation before retrying.",
      };
    }
  }

  parseWebhookPayload(payload: unknown): {
    awb?: string;
    orderId?: string;
    status: InternalShippingStatus;
    event: TrackingEvent;
  } | null {
    if (!payload || typeof payload !== "object") return null;
    const envelope = payload as Record<string, any>;
    const bodyObj = envelope.Shipment || envelope;
    const awb = bodyObj.AWB || bodyObj.waybill || bodyObj.wbn;
    const scan = typeof bodyObj.Status === "object" ? bodyObj.Status : bodyObj;
    const statusRaw =
      typeof bodyObj.Status === "string"
        ? bodyObj.Status
        : scan.Status || scan.status || bodyObj.Scan;
    const time =
      scan.StatusDateTime ||
      bodyObj.StatusDateTime ||
      bodyObj.ScanDateTime ||
      bodyObj.timestamp;
    if (
      typeof awb !== "string" ||
      !/^\d{8,30}$/.test(awb) ||
      typeof statusRaw !== "string" ||
      !time ||
      !Number.isFinite(Date.parse(time))
    )
      return null;
    const mapped = mapDelhiveryStatus(
      statusRaw,
      scan.ScanType || scan.StatusType || bodyObj.ScanType,
    );
    if (mapped === "PROCESSING") return null;
    return {
      awb,
      status: mapped,
      event: {
        status: mapped,
        description: String(
          scan.Instructions || bodyObj.Instructions || statusRaw,
        ),
        location: scan.StatusLocation || bodyObj.Location,
        timestamp: new Date(time).toISOString(),
      },
    };
  }
}
