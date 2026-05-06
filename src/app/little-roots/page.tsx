"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function LittleRootsForm() {
  const [formData, setFormData] = useState({
    childName: "",
    childAge: "",
    parentName: "",
    phone: "",
    email: "",
    medicalInfo: "",
    photoConsent: false,
    agreeTerms: false
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await fetch("/api/little-roots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (resp.ok) setSubmitted(true);
    } catch (err) {
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 border border-neutral-800 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4 text-emerald-500">Registered!</h2>
          <p className="text-neutral-400 mb-8">See you at Good Food Matters at 3:30 PM today.</p>
          <Link href="/" className="px-6 py-3 bg-white text-black font-semibold rounded-lg">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white py-12 px-6">
      <div className="max-w-xl mx-auto font-sans">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-emerald-500 mb-2">Little Roots: One Plot, One Story</h1>
          <p className="text-neutral-400">4-Week Pilot Programme Registration</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-neutral-800/50 p-6 rounded-xl border border-neutral-800 space-y-4">
            <h2 className="text-lg font-semibold border-b border-neutral-700 pb-2">Participant Details</h2>
            <input required placeholder="Child's Full Name" className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-lg" onChange={e => setFormData({...formData, childName: e.target.value})} />
            <input required type="number" placeholder="Child's Age" className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-lg" onChange={e => setFormData({...formData, childAge: e.target.value})} />
          </div>

          <div className="bg-neutral-800/50 p-6 rounded-xl border border-neutral-800 space-y-4">
            <h2 className="text-lg font-semibold border-b border-neutral-700 pb-2">Parent / Carer Info</h2>
            <input required placeholder="Your Full Name" className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-lg" onChange={e => setFormData({...formData, parentName: e.target.value})} />
            <input required type="tel" placeholder="Phone Number" className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-lg" onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input required type="email" placeholder="Email Address" className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-lg" onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>

          <div className="bg-neutral-800/50 p-6 rounded-xl border border-neutral-800 space-y-4">
            <h2 className="text-lg font-semibold border-b border-neutral-700 pb-2">Medical & Consent</h2>
            <textarea placeholder="Allergies or medical conditions" className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-lg h-24" onChange={e => setFormData({...formData, medicalInfo: e.target.value})} />
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 accent-emerald-500" onChange={e => setFormData({...formData, photoConsent: e.target.checked})} />
              <span className="text-sm text-neutral-300">I consent to photos/videos for promotional purposes</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input required type="checkbox" className="w-5 h-5 accent-emerald-500" onChange={e => setFormData({...formData, agreeTerms: e.target.checked})} />
              <span className="text-sm text-neutral-300 italic">I agree to attend and stay with my child throughout the programme</span>
            </label>
          </div>

          <button disabled={loading} type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition">
            {loading ? "Registering..." : "Complete Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}
