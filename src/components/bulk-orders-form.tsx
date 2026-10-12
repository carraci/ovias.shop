"use client";

import React, { useState } from "react";
import styles from "./bulk-orders-form.module.css";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Mail,
  Phone,
  Building2,
  MapPin,
  Package,
  Layers,
  Sparkles,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Clock,
} from "lucide-react";

const INDIAN_STATES_AND_UTS = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const QUANTITY_OPTIONS = ["10–25 units", "26–50 units", "51–100 units", "101–250 units", "250+ units"];

const PRODUCT_CATEGORIES = [
  "Executive Laptop Bags & Office Briefcases",
  "Cabin & Check-In Hard-shell Luggage",
  "Luxury Weekender Duffel Bags",
  "Urban & Travel Backpacks",
  "Premium Wallets & Monogrammed Cardholders",
  "Curated Corporate Gift Hampers (Custom Set)",
  "Custom Atelier Manufacturing / Specific Requirement",
];

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "USA / Canada (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+65", label: "Singapore (+65)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+49", label: "Germany (+49)" },
];

export function BulkOrdersForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    countryCode: "+91",
    contactNumber: "",
    altCountryCode: "+91",
    alternateNumber: "",
    companyName: "",
    deliveryLocation: "",
    pincode: "",
    product: "",
    quantity: "",
    additionalDetails: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const validateField = (field: string, value: string): string => {
    switch (field) {
      case "firstName":
        if (!value.trim()) return "First name is required.";
        if (value.trim().length < 2) return "First name must be at least 2 characters.";
        if (!/^[a-zA-Z\s.'-]+$/.test(value)) return "First name can only contain letters.";
        return "";
      case "lastName":
        if (!value.trim()) return "Last name is required.";
        if (!/^[a-zA-Z\s.'-]+$/.test(value)) return "Last name can only contain letters.";
        return "";
      case "email":
        if (!value.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Please enter a valid email address.";
        return "";
      case "contactNumber":
        if (!value.trim()) return "Contact number is required.";
        const digits = value.replace(/\D/g, "");
        if (digits.length < 10 || digits.length > 12)
          return "Please enter a valid 10-digit mobile number.";
        return "";
      case "alternateNumber":
        if (value.trim()) {
          const altDigits = value.replace(/\D/g, "");
          if (altDigits.length < 10 || altDigits.length > 12)
            return "Alternate number must be a valid 10-digit number.";
        }
        return "";
      case "deliveryLocation":
        if (!value) return "Please select a delivery state or UT.";
        return "";
      case "pincode":
        if (!value.trim()) return "Pincode is required.";
        if (!/^\d{6}$/.test(value.trim()))
          return "Please enter a valid 6-digit postal pincode.";
        return "";
      case "product":
        if (!value.trim()) return "Please select or specify the product.";
        return "";
      case "quantity":
        if (!value) return "Please select the required quantity.";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    Object.keys(formData).forEach((key) => {
      newTouched[key] = true;
      const error = validateField(key, (formData as any)[key]);
      if (error) newErrors[key] = error;
    });

    setTouched(newTouched);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const isValid = validateAll();
    if (!isValid) {
      setServerError("Please resolve highlighted errors before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/v1/bulk-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to submit request.");
      }

      setSubmittedData(json.data);
      setSubmitSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      countryCode: "+91",
      contactNumber: "",
      altCountryCode: "+91",
      alternateNumber: "",
      companyName: "",
      deliveryLocation: "",
      pincode: "",
      product: "",
      quantity: "",
      additionalDetails: "",
    });
    setErrors({});
    setTouched({});
    setSubmitSuccess(false);
    setSubmittedData(null);
    setServerError(null);
  };

  const field = (name: keyof typeof formData, label: string, type = "text") => <label className={styles.field} htmlFor={`bulk-${name}`}>{label}<input id={`bulk-${name}`} name={name} type={type} value={formData[name]} onChange={handleChange} onBlur={handleBlur} required={["firstName","lastName","email","pincode","product"].includes(name)} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `error-${name}` : undefined} /><span id={`error-${name}`} className={styles.error}>{errors[name]}</span></label>;
  const phone = (alternate = false) => {
    const code = alternate ? "altCountryCode" : "countryCode";
    const number = alternate ? "alternateNumber" : "contactNumber";
    return <div className={styles.field}><label htmlFor={`bulk-${number}`}>{alternate ? "Alternate Number" : "Contact Number*"}</label><div className={styles.row}><select aria-label={alternate ? "Alternate phone country code" : "Phone country code"} name={code} value={formData[code]} onChange={handleChange}>{COUNTRY_CODES.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select><input id={`bulk-${number}`} name={number} type="tel" value={formData[number]} onChange={handleChange} onBlur={handleBlur} required={!alternate} aria-invalid={!!errors[number]} /></div><span className={styles.error}>{errors[number]}</span></div>;
  };
  return <section className={styles.wrapper}>
    <h1>Bulk Offers</h1><p className={styles.intro}>Fill in the details to enquire about your OVIA bulk order.</p>
    {submitSuccess ? <div className={styles.success} role="status"><h2>Thank you for your enquiry</h2><p>Your bulk-order request has been received.</p>{submittedData?.orderId && <p>Reference: {submittedData.orderId}</p>}<button type="button" onClick={handleReset}>Submit another enquiry</button></div> : <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>{field("firstName","First Name*")}{field("lastName","Last Name*")}</div>
      {field("email","Email*","email")}
      {phone()}{phone(true)}
      {field("companyName","Company Name")}
      <div className={styles.row}><label className={styles.field} htmlFor="bulk-deliveryLocation">Delivery location (State or UT)*<select id="bulk-deliveryLocation" name="deliveryLocation" value={formData.deliveryLocation} onChange={handleChange} onBlur={handleBlur} required><option value="">Please Select</option>{INDIAN_STATES_AND_UTS.map(state => <option key={state}>{state}</option>)}</select><span className={styles.error}>{errors.deliveryLocation}</span></label>{field("pincode","Pincode*", "text")}</div>
      {field("product","OVIA product you are looking for*")}
      <label className={styles.field} htmlFor="bulk-quantity">Quantity*<select id="bulk-quantity" name="quantity" value={formData.quantity} onChange={handleChange} onBlur={handleBlur} required><option value="">Please Select</option>{QUANTITY_OPTIONS.map(option => <option key={option}>{option}</option>)}</select><span className={styles.error}>{errors.quantity}</span></label>
      <label className={styles.field} htmlFor="bulk-additionalDetails">Additional Details<textarea id="bulk-additionalDetails" name="additionalDetails" value={formData.additionalDetails} onChange={handleChange} maxLength={2000} rows={3} /></label>
      {serverError && <p className={styles.error} role="alert">{serverError}</p>}
      <button className={styles.submit} type="submit" disabled={isSubmitting}>{isSubmitting ? "Submitting…" : "Submit"}</button>
    </form>}
  </section>;
}
