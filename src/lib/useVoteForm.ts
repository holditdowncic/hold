"use client";

import { useState, useEffect } from "react";
import { categories, VOTING_DEADLINE } from "@/data/categories";

export type VoteStatus = "idle" | "submitting" | "success" | "error";

export interface VoteFormState {
    votes: Record<string, string>;
    companies: Record<string, string>;
    categoryReasons: Record<string, string>;
    email: string;
    reason: string;
    status: VoteStatus;
    message: string;
    isDeadlinePassed: boolean;
    alreadyVoted: boolean;
}

export interface VoteFormActions {
    handleVoteChange: (categoryKey: string, value: string) => void;
    handleCompanyChange: (categoryKey: string, value: string) => void;
    handleCategoryReasonChange: (categoryKey: string, value: string) => void;
    setEmail: (value: string) => void;
    setReason: (value: string) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export type UseVoteFormReturn = VoteFormState & VoteFormActions;

export function useVoteForm(): UseVoteFormReturn {
    const [votes, setVotes] = useState<Record<string, string>>({});
    const [companies, setCompanies] = useState<Record<string, string>>({});
    const [categoryReasons, setCategoryReasons] = useState<Record<string, string>>({});
    const [email, setEmail] = useState("");
    const [reason, setReason] = useState("");
    const [status, setStatus] = useState<VoteStatus>("idle");
    const [message, setMessage] = useState("");
    const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
    const [alreadyVoted, setAlreadyVoted] = useState(false);

    useEffect(() => {
        const now = new Date();
        setIsDeadlinePassed(now > VOTING_DEADLINE);
        const voted = localStorage.getItem("rootswings_voted");
        if (voted) setAlreadyVoted(true);
    }, []);

    const handleVoteChange = (categoryKey: string, value: string) => {
        setVotes((prev) => ({ ...prev, [categoryKey]: value }));
    };

    const handleCompanyChange = (categoryKey: string, value: string) => {
        setCompanies((prev) => ({ ...prev, [categoryKey]: value }));
    };

    const handleCategoryReasonChange = (categoryKey: string, value: string) => {
        setCategoryReasons((prev) => ({ ...prev, [categoryKey]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isDeadlinePassed) {
            setMessage("Voting has closed. The deadline was May 16th, 2026.");
            setStatus("error");
            return;
        }

        if (alreadyVoted) {
            setMessage("You have already submitted your votes.");
            setStatus("error");
            return;
        }

        const missingCategories = categories.filter((cat) => !votes[cat.key]?.trim());
        if (missingCategories.length > 0) {
            setMessage(
                `Please enter a nominee for: ${missingCategories.map((c) => c.title).join(", ")}`
            );
            setStatus("error");
            return;
        }

        if (!email.trim() || !email.includes("@")) {
            setMessage("Please enter a valid email address.");
            setStatus("error");
            return;
        }

        setStatus("submitting");

        try {
            const response = await fetch("/api/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ votes, companies, categoryReasons, email, reason }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setMessage("Thank you! Your votes have been submitted.");
                localStorage.setItem("rootswings_voted", "true");
                setAlreadyVoted(true);
            } else {
                setStatus("error");
                setMessage(data.error || "Failed to submit votes. Please try again.");
            }
        } catch {
            setStatus("error");
            setMessage("Network error. Please try again.");
        }
    };

    return {
        votes,
        companies,
        categoryReasons,
        email,
        reason,
        status,
        message,
        isDeadlinePassed,
        alreadyVoted,
        handleVoteChange,
        handleCompanyChange,
        handleCategoryReasonChange,
        setEmail,
        setReason,
        handleSubmit,
    };
}
