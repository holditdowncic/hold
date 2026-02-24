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
              <span>Booking Deadline: <strong>12th June 2026</strong></span>
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
                Special Requirements
              </label>
              <textarea
                id="requirements"
                name="requirements"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Power supply, table size, or any other needs..."
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
