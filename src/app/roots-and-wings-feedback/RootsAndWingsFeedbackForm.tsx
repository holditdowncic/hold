"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "success" | "error";

type FeedbackState = {
  overallSatisfaction: string;
  activitiesSatisfaction: string;
  favoritePart: string;
  takingAway: string;
  connectedImpact: string;
  futureSuggestions: string;
  attendAgain: string;
  recommend: string;
  hearFutureEvents: string;
  email: string;
  ageGroup: string;
  gender: string;
};

const initialFeedback: FeedbackState = {
  overallSatisfaction: "",
  activitiesSatisfaction: "",
  favoritePart: "",
  takingAway: "",
  connectedImpact: "",
  futureSuggestions: "",
  attendAgain: "",
  recommend: "",
  hearFutureEvents: "",
  email: "",
  ageGroup: "",
  gender: "",
};

const connectedImpactOptions = ["Yes, significantly", "Yes, somewhat", "No change", "Not sure"];
const attendAgainOptions = ["Yes", "No", "Maybe"];
const recommendOptions = ["Definitely", "Probably", "Not sure", "Probably not", "Definitely not"];
const yesNoOptions = ["Yes", "No"];
const ageGroupOptions = ["Under 16", "16-24", "25-34", "35-44", "45-54", "55-64", "65+"];
const genderOptions = ["Male", "Female", "Non-binary", "Prefer to self-describe", "Prefer not to say"];

function RatingScale({
  name,
  value,
  onChange,
}: {
  name: keyof FeedbackState;
  value: string;
  onChange: (name: keyof FeedbackState, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {["1", "2", "3", "4", "5"].map((rating) => (
        <label
          key={rating}
          className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-bold transition ${
            value === rating
              ? "border-[#5f9b16] bg-[#5f9b16] text-white"
              : "border-[#d7c8b6] bg-white text-[#21180f]"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={rating}
            checked={value === rating}
            onChange={(event) => onChange(name, event.target.value)}
            required
            className="sr-only"
          />
          {rating}
        </label>
      ))}
    </div>
  );
}

function ChoiceGroup({
  name,
  value,
  options,
  onChange,
}: {
  name: keyof FeedbackState;
  value: string;
  options: string[];
  onChange: (name: keyof FeedbackState, value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <label
          key={option}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
            value === option
              ? "border-[#5f9b16] bg-[#eef8df] text-[#21180f]"
              : "border-[#d7c8b6] bg-white text-[#5f5548]"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={(event) => onChange(name, event.target.value)}
            className="h-4 w-4 accent-[#5f9b16]"
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

export default function RootsAndWingsFeedbackForm() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackState>(initialFeedback);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  function updateField(name: keyof FeedbackState, value: string) {
    setFeedback((current) => ({
      ...current,
      [name]: value,
      ...(name === "hearFutureEvents" && value !== "Yes" ? { email: "" } : {}),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/roots-and-wings-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedback),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus("error");
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      window.setTimeout(() => router.push(data.redirectTo || "/roots-and-wings"), 2500);
    } catch {
      setStatus("error");
      setError("Network error. Please try again.");
    }
  }

  const inputClasses =
    "w-full rounded-2xl border border-[#d7c8b6] bg-white px-4 py-3 text-base text-[#21180f] outline-none transition focus:border-[#5f9b16] focus:ring-4 focus:ring-[#5f9b16]/15";

  return (
    <main className="min-h-screen bg-[#f7f1e5] px-4 py-6 text-[#21180f] sm:px-8 sm:py-10">
      <section
        className="mx-auto w-full max-w-2xl"
        style={{ maxWidth: "42rem" }}
      >
        <div className="rounded-[1.5rem] border border-[#dfd0bb] bg-[#fffaf1] p-5 shadow-[0_20px_70px_rgba(42,31,20,0.14)] sm:p-8">
          <div className="mb-7 flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#d8c5aa] bg-white">
              <Image
                src="/logos/holditdown-cic-tree-logo.jpg"
                alt="Hold It Down CIC"
                fill
                priority
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5f9b16]">
                Hold It Down CIC
              </p>
              <h1 className="mt-1 font-[family-name:var(--font-heading)] text-2xl font-bold leading-tight sm:text-3xl">
                ROOTS & WINGS FEEDBACK FORM
              </h1>
            </div>
          </div>

          {status === "success" ? (
            <div className="rounded-2xl border border-[#5f9b16]/30 bg-[#eef8df] p-5 text-center">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold">
                Thank you
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[#4f4437]">
                Your feedback has been received. We are taking you back to Roots & Wings.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-7 space-y-4 text-base leading-relaxed text-[#5f5548]">
                <p>Thank you for being part of Roots & Wings.</p>
                <p>
                  Your feedback helps us understand the impact of the day and improve future events
                  for children, young people, families, and our wider community.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-7">
                <fieldset>
                  <legend className="mb-3 text-base font-bold">
                    1. How satisfied were you with the event overall? *
                  </legend>
                  <p className="mb-3 text-sm font-semibold text-[#6b5e4d]">Rating Scale (1-5)</p>
                  <RatingScale
                    name="overallSatisfaction"
                    value={feedback.overallSatisfaction}
                    onChange={updateField}
                  />
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-base font-bold">
                    2. How satisfied were you with the activities provided for children and young people? *
                  </legend>
                  <p className="mb-3 text-sm font-semibold text-[#6b5e4d]">Rating Scale (1-5)</p>
                  <RatingScale
                    name="activitiesSatisfaction"
                    value={feedback.activitiesSatisfaction}
                    onChange={updateField}
                  />
                </fieldset>

                <div>
                  <label htmlFor="favoritePart" className="mb-3 block text-base font-bold">
                    3. What was your favourite part of the day?
                  </label>
                  <p className="mb-3 text-sm font-semibold text-[#6b5e4d]">Long Answer</p>
                  <textarea
                    id="favoritePart"
                    value={feedback.favoritePart}
                    maxLength={1500}
                    onChange={(event) => updateField("favoritePart", event.target.value)}
                    className={`${inputClasses} min-h-[130px] resize-none`}
                  />
                </div>

                <div>
                  <label htmlFor="takingAway" className="mb-3 block text-base font-bold">
                    4. What is one thing you are taking away from today?
                  </label>
                  <p className="mb-3 text-sm font-semibold text-[#6b5e4d]">Long Answer</p>
                  <textarea
                    id="takingAway"
                    value={feedback.takingAway}
                    maxLength={1500}
                    onChange={(event) => updateField("takingAway", event.target.value)}
                    className={`${inputClasses} min-h-[130px] resize-none`}
                  />
                </div>

                <fieldset>
                  <legend className="mb-3 text-base font-bold">
                    5. Did today&apos;s event help you feel more connected to your family, community, or wellbeing?
                  </legend>
                  <ChoiceGroup
                    name="connectedImpact"
                    value={feedback.connectedImpact}
                    options={connectedImpactOptions}
                    onChange={updateField}
                  />
                </fieldset>

                <div>
                  <label htmlFor="futureSuggestions" className="mb-3 block text-base font-bold">
                    6. Do you have any workshop topics, comments, or suggestions that would help us improve future Roots & Wings events?
                  </label>
                  <p className="mb-3 text-sm font-semibold text-[#6b5e4d]">Long Answer</p>
                  <textarea
                    id="futureSuggestions"
                    value={feedback.futureSuggestions}
                    maxLength={1500}
                    onChange={(event) => updateField("futureSuggestions", event.target.value)}
                    className={`${inputClasses} min-h-[130px] resize-none`}
                  />
                </div>

                <fieldset>
                  <legend className="mb-3 text-base font-bold">
                    7. Would you attend Roots & Wings again?
                  </legend>
                  <ChoiceGroup
                    name="attendAgain"
                    value={feedback.attendAgain}
                    options={attendAgainOptions}
                    onChange={updateField}
                  />
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-base font-bold">
                    8. Would you recommend Roots & Wings to a friend or family member?
                  </legend>
                  <ChoiceGroup
                    name="recommend"
                    value={feedback.recommend}
                    options={recommendOptions}
                    onChange={updateField}
                  />
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-base font-bold">
                    9. Would you like to hear about future Hold It Down CIC events and opportunities?
                  </legend>
                  <ChoiceGroup
                    name="hearFutureEvents"
                    value={feedback.hearFutureEvents}
                    options={yesNoOptions}
                    onChange={updateField}
                  />
                </fieldset>

                {feedback.hearFutureEvents === "Yes" && (
                  <div>
                    <label htmlFor="email" className="mb-3 block text-base font-bold">
                      Email Address (Optional)
                    </label>
                    <p className="mb-3 text-sm font-semibold text-[#6b5e4d]">Short Answer</p>
                    <input
                      id="email"
                      type="email"
                      value={feedback.email}
                      maxLength={160}
                      onChange={(event) => updateField("email", event.target.value)}
                      className={inputClasses}
                    />
                  </div>
                )}

                <fieldset>
                  <legend className="mb-3 text-base font-bold">
                    10. What age group do you fit into?
                  </legend>
                  <ChoiceGroup
                    name="ageGroup"
                    value={feedback.ageGroup}
                    options={ageGroupOptions}
                    onChange={updateField}
                  />
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-base font-bold">11. Gender</legend>
                  <ChoiceGroup
                    name="gender"
                    value={feedback.gender}
                    options={genderOptions}
                    onChange={updateField}
                  />
                </fieldset>

                {status === "error" && (
                  <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#21180f] px-6 text-base font-bold text-white transition hover:bg-[#5f9b16] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "sending" ? "Sending..." : "Submit feedback"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
