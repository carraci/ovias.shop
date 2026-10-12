const DELHIVERY_MAPS_ENDPOINT = "https://gateway-maps-pub-int.delhivery.com/mcp";
const DEFAULT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InNvdXJjZSI6IldFQiIsInVjaWQiOiIyYTFkYjlhMS01YTRkLTI0MzctNzUwMy1hODVkODdhMmI3N2MifSwiZXhwIjoxNzkwOTU2MDUyLCJpYXQiOjE3OTA4Njk2NTIsImp0aSI6ImVmMTA1OWQ4LTBiM2YtNDI5Yi1iZDM5LWVlZjY2MTQwYTc5MiJ9.3KMu37HT5o7i0H7l4e425CED3eUG-jD9TGarQOGPFNw";

export function getDelhiveryMapsToken(): string {
  return (process.env.DELHIVERY_MAPS_TOKEN || DEFAULT_TOKEN).trim();
}

async function callDelhiveryMapsTool<T>(toolName: string, args: Record<string, unknown>): Promise<T> {
  const token = getDelhiveryMapsToken();
  const res = await fetch(DELHIVERY_MAPS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    }),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Delhivery Maps MCP error (${res.status}): ${errorText}`);
  }

  const rawText = await res.text();
  const lines = rawText.split("\n");
  for (const line of lines) {
    if (line.startsWith("data:")) {
      const parsed = JSON.parse(line.replace("data:", "").trim());
      if (parsed.error) {
        throw new Error(parsed.error.message || "Delhivery Maps tool error");
      }
      const content = parsed.result?.content?.[0]?.text;
      if (content) {
        return JSON.parse(content) as T;
      }
    }
  }

  throw new Error(`No data returned from Delhivery Maps tool: ${toolName}`);
}

export type StandardizedAddressResult = {
  formatted_address: string;
  address_components: {
    sub_unit?: string | null;
    building_name?: string | null;
    building_type?: string | null;
    street_address?: string | null;
    locality?: string | null;
    sub_locality?: string | null;
    city: string;
    state: string;
    postal_code: string;
    landmark?: string | null;
    is_rooftop_level?: boolean;
    property_type?: string | null;
  };
  corrections: string[];
  request_id?: string;
};

export type ValidatedAddressResult = {
  quality: "ok" | "not_ok";
  granularity_level: "PREMISE" | "STREET" | "LOCALITY" | "PINCODE" | "CITY";
  reason: string;
  formatted_address: string;
  corrections: string;
  request_id: string;
};

export type GeocodedAddressResult = {
  lat: number | null;
  lng: number | null;
  error_radius: number;
  req_id?: string;
};

export type RouteResult = {
  status: boolean;
  recommended_route: {
    distance: number; // in kilometers
    duration: number; // in seconds
    geometry: string; // encoded polyline
    legs: Array<{
      summary: {
        length: number;
        time: number;
        has_toll?: boolean;
        has_highway?: boolean;
      };
      shape?: string;
    }>;
    waypoints: Array<{
      lat: number;
      lng: number;
      snap_distance_m: number;
    }>;
  };
};

export type SearchEntity = {
  display_text: string;
  entity_id: string;
  entity_name: string;
  entity_type: string;
  full_address: string;
  lat: number;
  long: number;
  score: number;
};

export type StopsSequenceResult = {
  summary: {
    total_meters: number;
    total_seconds: number;
  };
  sequence: Array<{
    seq_no: number;
    stop_id: string;
    stop_lat: number;
    stop_lng: number;
    order_id?: string[];
    step_dist_meters: number;
  }>;
};

/**
 * Clean, correct, and standardize a raw Indian address string.
 */
export async function standardizeAddress(address: string): Promise<StandardizedAddressResult> {
  return callDelhiveryMapsTool<StandardizedAddressResult>("standardize-address", {
    address: address.trim(),
  });
}

/**
 * Validate deliverability and granularity of an Indian address.
 */
export async function validateAddress(address: string): Promise<ValidatedAddressResult> {
  return callDelhiveryMapsTool<ValidatedAddressResult>("validate-address", {
    address: address.trim(),
  });
}

/**
 * Geocode an address into precise latitude and longitude.
 */
export async function geocodeAddress(address: string): Promise<GeocodedAddressResult> {
  return callDelhiveryMapsTool<GeocodedAddressResult>("geocode-address", {
    address: address.trim(),
  });
}

/**
 * Calculate optimal driving/truck routing between waypoints.
 */
export async function computeRoute(
  origin: [number, number],
  destination: [number, number],
  travelMode: "auto" | "motorcycle" | "truck" | "pedestrian" = "truck",
): Promise<RouteResult> {
  return callDelhiveryMapsTool<RouteResult>("route", {
    geo_coords: [origin, destination],
    travel_mode: travelMode,
  });
}

/**
 * Search entities and location auto-suggest.
 */
export async function searchLocation(
  query: string,
  lat?: number,
  lng?: number,
): Promise<{ data: SearchEntity[] }> {
  return callDelhiveryMapsTool<{ data: SearchEntity[] }>("search-maps-entities", {
    query: query.trim(),
    lat,
    lng,
  });
}

/**
 * TSP delivery route planning for dispatch personnel.
 */
export async function optimizeDeliveryStops(
  startLocation: { lat: number; lng: number },
  stops: Array<{
    stop_id: string;
    stop_lat: number;
    stop_lng: number;
    assigned_orders?: string[];
  }>,
  travelMode: "motorcycle" | "truck" | "auto" = "motorcycle",
): Promise<StopsSequenceResult> {
  return callDelhiveryMapsTool<StopsSequenceResult>("generate-stops-sequence", {
    start_location: startLocation,
    stops,
    travel_mode: travelMode,
    return_to_start: true,
  });
}
