"use client";

import React, { useState } from "react";
import Link from "next/link";

const ACTIVITIES = [
  "Thorpe Park",
  "Family Fun Day",
  "Beach Trip",
  "Trampolining",
  "Paintballing"
];

export default function BiggzConsentForm() {
  const [formData, setFormData] = useState({
    childName: "",
    childAge: "",
    parentName: "",
    phone: "",
    email: "",
    address: "",
    attendance: "Parent attending with child",
    activities: [],
    emergencyName: "",
    emergencyRelationship: "",
    emergencyPhone: "",
    emergencyAck: false,
    medicalInfo: "",
    dietary: "",
    gpName: "",
    gpPhone: "",
    nhsNumber: "",
    safeguardingConsent: false,
    photoConsent: "No",
    declarationName: "",
    declarationDate: new Date().toISOString().split("T")[0]
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleActivityChange = (activity) => {
    setFormData((prev) => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter((a) => a !== activity)
        : [...prev.activities, activity]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/biggz-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (resp.ok) {
        setSubmitted(true);
      } else {
        const errorData = await resp.json();
        setError(errorData.error || "Failed to submit form. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 border border-neutral-800 rounded-2xl bg-neutral-900/50">
          <h2 className="text-3xl font-bold mb-4 text-emerald-500">Form Submitted!</h2>
          <p className="text-neutral-400 mb-8">
            Thank you for registering. We have received your consent form and will be in touch with further details.
          </p>
          <Link href="/" className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12 border-b border-neutral-800 pb-8">
          <h1 className="text-4xl font-extrabold mb-4">Summer Fun Programme 2026</h1>
          <p className="text-neutral-400 text-lg">
            Biggz Community Kitchen CIC Consent Form
            <br />
            Supported by Hold It Down CIC
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10 pb-20">
          {/* Participant Details */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-white border-l-4 border-emerald-500 pl-4">Participant Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Child Name</label>
                <input required name="childName" value={formData.childName} onChange={handleInputChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white transition outline-none" placeholder="Child full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Age</label>
                <input required type="number" name="childAge" value={formData.childAge} onChange={handleInputChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white transition outline-none" placeholder="Child age" />
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Parent/Guardian Name</label>
                <input required name="parentName" value={formData.parentName} onChange={handleInputChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white transition outline-none" placeholder="Full name" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Phone</label>
                  <input required name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white transition outline-none" placeholder="Mobile number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Email</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white transition outline-none" placeholder="Email address" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Full Address</label>
                <textarea required name="address" value={formData.address} onChange={handleInputChange} rows={3} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white transition outline-none resize-none" placeholder="Home address" />
              </div>
            </div>
          </section>

          {/* Attendance & Activities */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-white border-l-4 border-emerald-500 pl-4">Attendance & Activities</h2>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-4">Attendance Status</label>
              <div className="space-y-3">
                {["Parent attending with child", "Child attending independently (Aged 11-17 only)"].map((opt) => (
                  <label key={opt} className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition">
                    <input type="radio" name="attendance" value={opt} checked={formData.attendance === opt} onChange={handleInputChange} className="w-5 h-5 accent-emerald-500" />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-4">Activities Selection</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ACTIVITIES.map((act) => (
                  <label key={act} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition">
                    <input type="checkbox" checked={formData.activities.includes(act)} onChange={() => handleActivityChange(act)} className="w-5 h-5 rounded accent-emerald-500" />
                    <span>{act}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Emergency Contact */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-white border-l-4 border-emerald-500 pl-4">Emergency Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Contact Name</label>
                <input required name="emergencyName" value={formData.emergencyName} onChange={handleInputChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white transition outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Relationship to Child</label>
                <input required name="emergencyRelationship" value={formData.emergencyRelationship} onChange={handleInputChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white transition outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Phone Number</label>
              <input required name="emergencyPhone" value={formData.emergencyPhone} onChange={handleInputChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white transition outline-none" />
            </div>
            <label className="flex items-start space-x-3 cursor-pointer group">
              <input required type="checkbox" name="emergencyAck" checked={formData.emergencyAck} onChange={handleInputChange} className="w-5 h-5 mt-1 rounded accent-emerald-500" />
              <span className="text-sm text-neutral-400 leading-relaxed group-hover:text-neutral-300">
                I confirm this person is aware they may be contacted and can act on my behalf in an emergency.
              </span>
            </label>
          </section>

          {/* Medical and Dietary */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-white border-l-4 border-emerald-500 pl-4">Medical & Dietary</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Medical Conditions / Allergies / Additional Needs</label>
                <textarea name="medicalInfo" value={formData.medicalInfo} onChange={handleInputChange} rows={3} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Dietary Requirements</label>
                <textarea name="dietary" value={formData.dietary} onChange={handleInputChange} rows={2} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">GP Name</label>
                  <input required name="gpName" value={formData.gpName} onChange={handleInputChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">GP Phone</label>
                  <input required name="gpPhone" value={formData.gpPhone} onChange={handleInputChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">NHS Number (if known)</label>
                <input name="nhsNumber" value={formData.nhsNumber} onChange={handleInputChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white" />
              </div>
            </div>
          </section>

          {/* Consent and Agreement */}
          <section className="space-y-6 bg-neutral-800/30 p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-xl font-bold text-white">Consent and Agreement</h2>
            <div className="text-sm text-neutral-400 space-y-4 leading-relaxed h-48 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-neutral-700">
              <p>I give permission for my child to take part in the Biggz Community Kitchen Summer Fun Programme 2026. I confirm that the information provided is accurate and that my child is medically fit to participate.</p>
              <p>I understand that activities may involve physical activity and there is a risk of injury. I consent to basic first aid being administered and emergency medical treatment being sought if required. In the event of a serious incident, emergency services will be contacted.</p>
              <p>I understand that some activities may involve travel. Full details will be provided in advance and appropriate supervision will be in place at all times.</p>
              <p>I accept that behaviour expectations must be followed. Participants are expected to follow instructions at all times to ensure their safety and the safety of others. If behaviour is deemed unsafe or inappropriate, I understand that I may be contacted and asked to collect my child.</p>
              <p>I confirm that I am responsible for my child’s safe arrival and collection where they are attending independently.</p>
              <p>While all reasonable care and supervision will be provided, participation in activities is at the parent or guardian’s risk.</p>
            </div>
            
            <label className="flex items-start space-x-3 cursor-pointer group pt-4">
              <input required type="checkbox" name="safeguardingConsent" checked={formData.safeguardingConsent} onChange={handleInputChange} className="w-5 h-5 mt-1 rounded accent-emerald-500" />
              <span className="text-sm text-neutral-200 group-hover:text-white">
                I have read and agree to the Safeguarding and Consent terms.
              </span>
            </label>
          </section>

          {/* Photos and Declaration */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-white border-l-4 border-emerald-500 pl-4">Media & Declaration</h2>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-4">Photo and Media Consent</label>
              <div className="grid grid-cols-2 gap-4">
                {["Yes", "No"].map((v) => (
                  <button key={v} type="button" onClick={() => handleInputChange({ target: { name: "photoConsent", value: v } })} className={`p-4 rounded-xl border text-sm font-bold transition ${formData.photoConsent === v ? 'bg-white text-black border-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-500'}`}>
                    {v}, I {v === 'No' ? 'do not ' : ''}give permission
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-neutral-800">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Digital Signature (Print Full Name)</label>
                <input required name="declarationName" value={formData.declarationName} onChange={handleInputChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-white focus:border-white font-serif italic text-lg shadow-inner" placeholder="Type your full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Date</label>
                <input disabled name="declarationDate" value={formData.declarationDate} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-neutral-500 cursor-not-allowed" />
              </div>
            </div>
          </section>

          {error && (
            <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <button disabled={loading} type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 text-white font-bold text-lg rounded-xl transition shadow-xl hover:shadow-emerald-900/40">
            {loading ? "Submitting..." : "Submit Consent Form"}
          </button>
        </form>
      </div>
    </div>
  );
}
