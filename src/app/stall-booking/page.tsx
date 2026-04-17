"use client";

import { useState } from "react";

const PAYMENT_LINKS: Record<string, { label: string; price: string; url: string }> = {
  community: {
    label: "Community Stall",
    price: "£25",
    url: "https://pay.sumup.com/b2c/QF47LUXV",
  },
  own_table: {
    label: "Standard Stall (own table)",
    price: "£40",
    url: "https://pay.sumup.com/b2c/QYJ2CJK2",
  },
  table_provided: {
    label: "Standard Stall (table provided)",
    price: "£60",
    url: "https://pay.sumup.com/b2c/Q8M282TJ",
  },
};

function getPaymentLink(stallType: string, table: string) {
  if (stallType === "community") return PAYMENT_LINKS.community;
  if (table === "yes") return PAYMENT_LINKS.own_table;
  if (table === "no") return PAYMENT_LINKS.table_provided;
  return null;
}

export default function StallBookingPage() {
  const [formData, setFormData] = useState({
    name: "",
    business: "",
    website: "",
    products: "",
    stallType: "",
    electricity: "",
    table: "",
    email: "",
    phone: "",
    requirements: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [paymentLink, setPaymentLink] = useState<{ label: string; price: string; url: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const response = await fetch("/api/stall-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Your stall booking request has been submitted! Please complete your payment below to confirm your spot.");
        const link = getPaymentLink(formData.stallType, formData.table);
        setPaymentLink(link);
        setFormData({
          name: "",
          business: "",
          website: "",
          products: "",
          stallType: "",
          electricity: "",
          table: "",
          email: "",
          phone: "",
          requirements: "",
        });
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to submit booking. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">
            Book a Stall
          </h1>
          <h2 className="text-2xl text-white mb-4">
            Roots & Wings Fun Day 2026
          </h2>
          <div className="bg-yellow-400 text-blue-900 inline-block px-6 py-2 rounded-full font-bold">
            Saturday 20th June 2026
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8 text-white">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Stall Pricing</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">✓</span>
              <span><strong className="text-yellow-300">£25</strong> — Community stall</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">✓</span>
              <span><strong className="text-yellow-300">£40</strong> — Standard stall (you bring your own table)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">✓</span>
              <span><strong className="text-yellow-300">£60</strong> — Standard stall (table provided by us)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">✓</span>
              <span>Booking Deadline: <strong>16th May 2026</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">✓</span>
              <span>Location: Heavers Farm School, SE25 6LT</span>
            </li>
            <li className="flex items-start gap-2 text-red-300">
              <span className="mt-0.5">✗</span>
              <span><strong>No food stalls permitted</strong></span>
            </li>
          </ul>
        </div>

        {/* Booking Form */}
        <form 
          onSubmit={handleSubmit}
          className="bg-white rounded-lg p-6 md:p-8 shadow-xl"
        >
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            {/* Business/Org */}
            <div>
              <label htmlFor="business" className="block text-sm font-medium text-gray-700 mb-1">
                Business / Organisation Name *
              </label>
              <input
                type="text"
                id="business"
                name="business"
                value={formData.business}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your business or organisation"
              />
            </div>

            {/* Website/Social Media */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website or Social Media
              </label>
              <input
                type="text"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Instagram, Facebook, or website URL"
              />
              <p className="text-xs text-gray-500 mt-1">Optional - helps us vet your application</p>
            </div>

            {/* Product/Service Description */}
            <div>
              <label htmlFor="products" className="block text-sm font-medium text-gray-700 mb-1">
                What will you be selling/displaying? *
              </label>
              <textarea
                id="products"
                name="products"
                value={formData.products}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your products, services, or what you'll be showcasing at your stall..."
              />
            </div>

            {/* Stall Type */}
            <div>
              <label htmlFor="stallType" className="block text-sm font-medium text-gray-700 mb-1">
                Type of Stall *
              </label>
              <select
                id="stallType"
                name="stallType"
                value={formData.stallType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select stall type</option>
                <option value="community">Community Stall (£25)</option>
                <option value="crafts">Arts & Crafts</option>
                <option value="clothing">Clothing / Fashion</option>
                <option value="books">Books / Stationery</option>
                <option value="toys">Toys / Games</option>
                <option value="health">Health & Wellness</option>
                <option value="info">Information / Services</option>
                <option value="other">Other (specify in requirements)</option>
              </select>
              <p className="text-sm text-red-500 mt-1">Food stalls are not permitted</p>
            </div>

            {/* Electricity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Do you need electricity? *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="electricity"
                    value="yes"
                    checked={formData.electricity === "yes"}
                    onChange={handleChange}
                    required
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="electricity"
                    value="no"
                    checked={formData.electricity === "no"}
                    onChange={handleChange}
                    required
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">No</span>
                </label>
              </div>
            </div>

            {/* Table */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Will you bring your own table? *
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="table"
                    value="yes"
                    checked={formData.table === "yes"}
                    onChange={handleChange}
                    required
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">Yes, I have my own</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="table"
                    value="no"
                    checked={formData.table === "no"}
                    onChange={handleChange}
                    required
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">No, I need one provided</span>
                </label>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="07943 126859"
              />
            </div>

            {/* Special Requirements */}
            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Requirements
              </label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any other needs or special requests..."
              />
            </div>

            {/* Dynamic Price Preview */}
            {(formData.stallType || formData.table) && (() => {
              const preview = getPaymentLink(formData.stallType, formData.table);
              return preview ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-1">Your stall fee</h4>
                  <p className="text-2xl font-bold text-blue-900">{preview.price}</p>
                  <p className="text-sm text-blue-700 mt-1">{preview.label} — payment link provided after submission</p>
                </div>
              ) : null;
            })()}

            {/* Status Messages */}
            {status === "error" && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {message}
              </div>
            )}

            {status === "success" ? (
              <div className="text-center space-y-4">
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                  <h4 className="font-semibold mb-1">✅ Request Submitted!</h4>
                  <p>{message}</p>
                </div>
                {paymentLink && (
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-5">
                    <p className="text-sm text-gray-600 mb-1">Amount due</p>
                    <p className="text-3xl font-bold text-blue-900 mb-1">{paymentLink.price}</p>
                    <p className="text-sm text-gray-500 mb-4">{paymentLink.label}</p>
                    <a
                      href={paymentLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-3 px-6 rounded-lg transition-colors text-center"
                    >
                      💳 Pay Now with SumUp
                    </a>
                    <p className="text-xs text-gray-400 mt-3">You will be taken to a secure SumUp payment page. Your booking is only confirmed once payment is received.</p>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "submitting" ? "Submitting..." : "Submit Booking Request"}
              </button>
            )}
          </div>
        </form>

        {/* QR Code - Share This Page */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
          <h3 className="text-lg font-bold text-yellow-400 mb-2">Share This Booking Page</h3>
          <p className="text-white/80 text-sm mb-4">Know someone who might want a stall? Scan to share</p>
          <div className="inline-block bg-white p-4 rounded-lg">
            <img
              src="/stall-booking-qr.png"
              alt="QR code for stall booking"
              className="w-40 h-40"
            />
          </div>
          <p className="text-white/60 text-xs mt-3">Scan to open: www.holditdown.uk/stall-booking</p>
        </div>

        {/* Contact */}
        <div className="text-center mt-8 text-white">
          <p className="mb-2">Questions? Contact us:</p>
          <p className="font-semibold">Marcus: 07403 314972</p>
          <p className="font-semibold">Laverne: 07943 126859</p>
        </div>
      </div>
    </div>
  );
}
