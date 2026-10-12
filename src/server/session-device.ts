export type ParsedDeviceInfo = {
  device: string;
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet";
  location: string;
  ip: string;
};

export function parseDeviceFromUserAgent(ua?: string, rawIp?: string): ParsedDeviceInfo {
  const userAgent = ua || "";
  let os = "Windows 11";
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  let device = "Windows PC / Laptop";

  if (/iPhone/i.test(userAgent)) {
    deviceType = "mobile";
    device = "Apple iPhone";
    const iosMatch = userAgent.match(/OS (\d+[_.]\d+)/i);
    os = iosMatch ? `iOS ${iosMatch[1].replace("_", ".")}` : "iOS";
  } else if (/iPad/i.test(userAgent)) {
    deviceType = "tablet";
    device = "Apple iPad";
    const ipadMatch = userAgent.match(/OS (\d+[_.]\d+)/i);
    os = ipadMatch ? `iPadOS ${ipadMatch[1].replace("_", ".")}` : "iPadOS";
  } else if (/Android/i.test(userAgent)) {
    deviceType = /Tablet|Tab/i.test(userAgent) ? "tablet" : "mobile";
    const androidMatch = userAgent.match(/Android\s+([\d.]+)/i);
    os = androidMatch ? `Android ${androidMatch[1]}` : "Android";
    const modelMatch = userAgent.match(/;\s*([^;)]+)\s+Build/i);
    device = modelMatch
      ? modelMatch[1].trim()
      : deviceType === "tablet"
        ? "Android Tablet"
        : "Android Smartphone";
  } else if (/Macintosh|Mac OS X/i.test(userAgent)) {
    deviceType = "desktop";
    device = "Apple Mac / MacBook";
    const macMatch = userAgent.match(/Mac OS X (\d+[_.]\d+)/i);
    os = macMatch ? `macOS ${macMatch[1].replace("_", ".")}` : "macOS";
  } else if (/Windows/i.test(userAgent)) {
    deviceType = "desktop";
    device = "Windows PC / Laptop";
    if (/Windows NT 10.0/i.test(userAgent)) {
      os = "Windows 11 / 10";
    } else if (/Windows NT 6.3/i.test(userAgent)) {
      os = "Windows 8.1";
    } else if (/Windows NT 6.1/i.test(userAgent)) {
      os = "Windows 7";
    } else {
      os = "Windows";
    }
  } else if (/Linux/i.test(userAgent)) {
    deviceType = "desktop";
    device = "Linux Workstation";
    os = "Linux";
  }

  let browser = "Web Browser";
  const edgeMatch = userAgent.match(/Edg\/([\d.]+)/i);
  const chromeMatch = userAgent.match(/Chrome\/([\d.]+)/i);
  const firefoxMatch = userAgent.match(/Firefox\/([\d.]+)/i);
  const safariMatch = userAgent.match(/Version\/([\d.]+).*Safari/i);
  const operaMatch = userAgent.match(/(?:OPR|Opera)\/([\d.]+)/i);

  if (edgeMatch) {
    browser = `Microsoft Edge ${edgeMatch[1].split(".")[0]}`;
  } else if (operaMatch) {
    browser = `Opera ${operaMatch[1].split(".")[0]}`;
  } else if (chromeMatch) {
    browser = `Google Chrome ${chromeMatch[1].split(".")[0]}`;
  } else if (safariMatch) {
    browser = `Apple Safari ${safariMatch[1].split(".")[0]}`;
  } else if (firefoxMatch) {
    browser = `Mozilla Firefox ${firefoxMatch[1].split(".")[0]}`;
  }

  const cleanIp = (rawIp || "").replace(/^::ffff:/, "") || "Local Network";
  const location =
    cleanIp === "127.0.0.1" || cleanIp === "::1" || cleanIp.startsWith("192.168.") || cleanIp.startsWith("10.") || cleanIp === "Local Network"
      ? "Mumbai, India (Current Network)"
      : "India";

  return {
    device,
    browser,
    os,
    deviceType,
    location,
    ip: cleanIp,
  };
}
