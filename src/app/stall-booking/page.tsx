export default function StallBookingPage() {
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
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Stall Information</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-yellow-400">✓</span>
              <span>Stall Fee: <strong>£50</strong> (payable online)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-400">✓</span>
              <span>Booking Deadline: <strong>16th May 2026</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-yellow-400">✓</span>
              <span>Location: Outdoor community event</span>
            </li>
            <li className="flex items-center gap-2 text-red-300">
              <span>✗</span>
              <span><strong>No food stalls permitted</strong></span>
            </li>
          </ul>
        </div>

        {/* Booking Form */}
        <form 
          action="https://formspree.io/f/YOUR_FORM_ID" 
          method="POST"
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
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select stall type</option>
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
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any other needs or special requests..."
              />
            </div>

            {/* Payment Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Payment Details</h4>
              <p className="text-sm text-blue-800 mb-2">
                After submitting this form, you will receive an email with payment instructions.
              </p>
              <p className="text-sm text-blue-800">
                <strong>Amount: £50</strong> — Payment required to confirm your booking.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Submit Booking Request
            </button>
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
          <p className="text-white/60 text-xs mt-3">Scan to open: holditdown.uk/stall-booking</p>
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
