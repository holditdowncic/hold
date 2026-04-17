import sectionsJson from "@/data/sections.json";

type SectionsJson = Record<string, unknown>;

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type LegalCallout = {
  title: string;
  description: string;
  href?: string;
  cta?: string;
};

export type LegalPageContent = {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
  callouts?: LegalCallout[];
};

function getContactValue(label: string, fallback: string): string {
  const contact =
    ((sectionsJson as SectionsJson).contact as
      | { items?: Array<{ label?: string; value?: string }> }
      | undefined) || undefined;
  const items = Array.isArray(contact?.items) ? contact.items : [];
  const match = items.find(
    (item) =>
      String(item.label || "").trim().toLowerCase() ===
      label.trim().toLowerCase()
  );

  return String(match?.value || "").trim() || fallback;
}

export const siteUrl = "https://www.holditdown.uk";

export const businessDetails = {
  tradingName: "Hold It Down CIC",
  legalName: "Hold It Down Community Interest Company",
  companyNumber: "14377702",
  email: getContactValue("Email", "info@holditdown.uk"),
  publicLocation: getContactValue("Location", "102 Buller Road, Thornton Heath, England, CR7 8QY"),
  registeredOffice: "102 Buller Road, Thornton Heath, England, CR7 8QY",
  registeredIn: "England and Wales",
  organisationType:
    "Private company limited by guarantee without share capital",
  regulatoryType: "Community Interest Company (CIC)",
  incorporatedOn: "26 September 2022",
  companyStatus: "Active",
  sicCodes: [
    "85520 - Cultural education",
    "85590 - Other education not elsewhere classified",
    "85600 - Educational support services",
    "88990 - Other social work activities without accommodation not elsewhere classified",
  ],
};

export const entityStatement =
  "HOLD IT DOWN COMMUNITY INTEREST COMPANY is a Community Interest Company (CIC) and a private company limited by guarantee without share capital, established to serve community benefit.";

const paymentScope =
  "Unless a specific event page, booking flow, invoice, or checkout page states otherwise, online payments on this website relate to donations, event participation, programme activity, or approved stall and service bookings.";

export const privacyPolicyContent: LegalPageContent = {
  eyebrow: "Privacy Policy",
  title: "How Hold It Down CIC uses personal information",
  description:
    "This Privacy Policy explains what data we collect, why we collect it, and how we protect it when you browse this website or contact Hold It Down CIC.",
  lastUpdated: "17 April 2026",
  sections: [
    {
      title: "Who we are",
      paragraphs: [
        entityStatement,
        `${businessDetails.tradingName} serves young people, families, fathers, carers, and elders through community programmes, events, and outreach.`,
        `If you have a privacy question, email ${businessDetails.email} or write to us at our registered office: ${businessDetails.registeredOffice}.`,
      ],
    },
    {
      title: "Information we collect",
      bullets: [
        "Contact details you submit through forms, including your name, email address, phone number, subject, and message.",
        "Operational information you provide when making enquiries about programmes, partnerships, volunteering, events, or bookings.",
        "Transaction and supporter information you choose to provide in donation or payment flows, such as your name, email address, amount, and any optional message.",
        "Basic technical information such as cookie preferences, browser details, and website usage data needed to operate, secure, and improve the website.",
        "If online payments are enabled, payment information is collected and processed by Stripe or another payment partner. We do not store full card details on this website.",
      ],
    },
    {
      title: "How we use information",
      bullets: [
        "To respond to enquiries and deliver requested information.",
        "To manage bookings, events, programme participation, donations, and operational follow-up.",
        "To maintain website security, prevent misuse, and understand how the site is being used.",
        "To meet legal, regulatory, safeguarding, accounting, or reporting obligations.",
      ],
    },
    {
      title: "Our lawful bases",
      bullets: [
        "Legitimate interests: operating the website, responding to enquiries, administering programmes, events, donations, and bookings, maintaining proportionate records, and protecting the site and the people who use it.",
        "Contract or steps at your request before a contract: where you ask us to arrange or administer a paid booking, event place, stall booking, or other requested service.",
        "Legal obligation: where we must keep records, meet accounting, tax, safeguarding, fraud-prevention, or reporting duties, or respond to lawful requests.",
        "Consent: if we introduce optional non-essential cookies or similar tools, we will ask for consent where required and give you a way to change that choice.",
      ],
    },
    {
      title: "When we share information",
      paragraphs: [
        "We only share personal information where there is a valid reason to do so, such as using trusted service providers to host the website, route form enquiries, send operational notifications, or process payments. Depending on the interaction, that may include providers such as Stripe for payments and Telegram for internal enquiry notifications.",
        "We may also share information with banks, insurers, professional advisers, or public authorities where reasonably necessary for administration, safeguarding, fraud prevention, or where disclosure is required by law.",
        "We do not sell personal information.",
      ],
    },
    {
      title: "International transfers",
      paragraphs: [
        "Some of our service providers or their sub-processors may access, store, or process personal information outside the UK, including in the United States and other countries where they operate.",
        "Where this happens, we aim to use providers that offer appropriate safeguards for UK personal data, such as contractual protections or equivalent transfer measures. If you want more detail about the safeguards relevant to a particular service, contact us.",
      ],
    },
    {
      title: "Cookies and analytics",
      paragraphs: [
        "This website uses essential cookies or similar local storage items to remember core preferences, such as cookie-banner choices, and to support core functionality.",
        "We do not rely on non-essential analytics or marketing cookies as a default part of the website experience. If we introduce non-essential analytics, advertising, or similar technologies, we will update this notice and ask for consent where required.",
      ],
    },
    {
      title: "Retention, your rights, and complaints",
      paragraphs: [
        "We keep personal information only for as long as reasonably necessary for the purpose it was collected, including legal, safeguarding, financial, and operational record-keeping requirements.",
        "If UK data protection law applies to your request, you may have rights to ask for access to your personal information, ask us to correct inaccurate data, ask us to delete information when we no longer need it, ask us to restrict how we use it, object to certain uses, and in some cases ask for a portable copy.",
        `If you have a data protection concern, contact us at ${businessDetails.email}. If you remain dissatisfied, you also have the right to complain to the Information Commissioner's Office (ICO).`,
      ],
    },
  ],
};

export const termsContent: LegalPageContent = {
  eyebrow: "Terms & Conditions",
  title: "Website and payment terms",
  description:
    "These terms explain how this website may be used and how online enquiries, bookings, donations, and payments are handled by Hold It Down CIC.",
  lastUpdated: "17 April 2026",
  sections: [
    {
      title: "Using this website",
      paragraphs: [
        "By using this website, you agree to use it lawfully and not to interfere with the website, its forms, or any other visitor's access.",
        "You must not misuse the website, attempt unauthorised access, submit false information, or use the site for fraud, spam, or other unlawful activity.",
      ],
    },
    {
      title: "Company information",
      bullets: [
        `Legal name: ${businessDetails.legalName}`,
        `Trading name: ${businessDetails.tradingName}`,
        `Company number: ${businessDetails.companyNumber}`,
        `Registered in: ${businessDetails.registeredIn}`,
        `Registered office: ${businessDetails.registeredOffice}`,
        `Support email: ${businessDetails.email}`,
      ],
    },
    {
      title: "Our services and public information",
      paragraphs: [
        "This website describes Hold It Down CIC, its programmes, events, community activity, and ways to contact or support the organisation.",
        paymentScope,
      ],
    },
    {
      title: "Payments and confirmation",
      bullets: [
        "Payments must be authorised by the cardholder or payer.",
        "Where payment is taken online, confirmation is normally provided on-screen or by email after the payment has been accepted.",
        "Specific event, programme, donation, or booking pages may include additional commercial details such as dates, eligibility, capacity, deadlines, or pricing.",
        "If a listed offer, fee, or availability changes before payment is completed, the information shown at checkout or on the relevant page controls.",
      ],
    },
    {
      title: "Cancellation rights and dated activities",
      paragraphs: [
        "Donations do not carry a general cooling-off right once payment has been completed, subject to the mistake, duplicate-payment, and unauthorised-payment review process set out in our Refund Policy.",
        "Where a payment relates to an event, stall booking, programme session, or other leisure or activity service scheduled for a specific date or period, a statutory cooling-off right may not apply once the booking concerns reserved capacity for that dated activity.",
        "If a specific page, hosted checkout, invoice, or written agreement gives a different cancellation window, refund position, or attendance condition, that more specific term applies to that payment.",
      ],
    },
    {
      title: "Refunds, cancellations, and fulfilment",
      paragraphs: [
        "Our main refund and cancellation terms are set out in the Refund Policy on this website and form part of these terms.",
        "Where there is no physical shipping involved, fulfilment takes place by confirming a donation, sending event or booking details, or delivering the relevant service or programme access described on the applicable page.",
      ],
    },
    {
      title: "Intellectual property and third-party links",
      paragraphs: [
        "Unless stated otherwise, the website design, copy, logos, and original media on this site belong to Hold It Down CIC or are used with permission and must not be reused in a misleading or infringing way.",
        "This website may link to third-party platforms such as social media or payment providers. We are not responsible for third-party content, security, or policies outside our control.",
      ],
    },
    {
      title: "Liability and governing law",
      paragraphs: [
        "We aim to keep the website accurate and available, but we do not guarantee uninterrupted access or that all content will always be current. Nothing in these terms excludes liability that cannot lawfully be excluded.",
        "These terms are governed by the laws of England and Wales unless another mandatory law applies.",
      ],
    },
  ],
};

export const refundPolicyContent: LegalPageContent = {
  eyebrow: "Refund Policy",
  title: "Refund, cancellation, and fulfilment information",
  description:
    "This policy explains how Hold It Down CIC handles donations, event fees, and approved booking payments made through this website.",
  lastUpdated: "17 April 2026",
  sections: [
    {
      title: "What this policy covers",
      paragraphs: [
        paymentScope,
        "If a specific event page, booking page, invoice, or written agreement sets out different commercial terms, those specific terms apply alongside this policy.",
      ],
    },
    {
      title: "Donations",
      bullets: [
        "Donations are generally treated as final because funds are allocated to community activity and programme delivery.",
        "There is no general cooling-off right once a donation has been processed, although we will review genuine error, duplicate-payment, and unauthorised-payment requests in good faith.",
        "If you made a donation in error, paid the wrong amount, duplicated a payment, or believe a payment was unauthorised, contact us promptly and we will review the request in good faith.",
      ],
    },
    {
      title: "Event and booking payments",
      bullets: [
        "Some event, stall, and activity bookings relate to a specific date or reserved capacity. In those cases, a statutory cooling-off right may not apply, and the relevant page, hosted checkout, or written agreement may treat the booking as non-refundable once confirmed.",
        "If Hold It Down CIC cancels an event, programme session, or approved booking that you paid for and cannot offer a suitable alternative, we will normally offer a refund or credit.",
        "If you need to cancel, contact us as early as possible. Whether a refund can be offered depends on timing, committed costs, reserved capacity, and the terms shown on the relevant page.",
        "Where a place, stall, or service has been specifically reserved for you, late cancellations or non-attendance may be non-refundable if costs or capacity have already been committed.",
      ],
    },
    {
      title: "Fulfilment and delivery",
      bullets: [
        "This website does not currently advertise routine physical goods shipping.",
        "Fulfilment usually happens by sending a confirmation email, issuing event or programme details, or recording your donation successfully.",
        "If a future page includes physical goods or a delivery timeline, that page should state the relevant shipping or collection details.",
      ],
    },
    {
      title: "How to request help",
      paragraphs: [
        `For refund or cancellation requests, email ${businessDetails.email} with your name, payment date, amount, and enough detail for us to locate the transaction.`,
        "We review requests as quickly as reasonably possible and may ask for further information before confirming the outcome.",
      ],
    },
  ],
};

export const stripeVerificationContent: LegalPageContent = {
  eyebrow: "Stripe Verification",
  title: "Public website information for payment verification",
  description:
    "This page summarises the public organisation and policy information published on the Hold It Down CIC website to support payment processor and customer review.",
  lastUpdated: "17 April 2026",
  callouts: [
    {
      title: "Privacy Policy",
      description:
        "Explains what information the website collects, how it is used, and how visitors can contact us about privacy matters.",
      href: "/privacy-policy",
      cta: "Open privacy policy",
    },
    {
      title: "Terms & Conditions",
      description:
        "Explains website use, payment expectations, fulfilment, and the legal terms that apply to services and bookings on this site.",
      href: "/terms",
      cta: "Open terms",
    },
    {
      title: "Refund Policy",
      description:
        "Covers refunds, cancellations, donations, and fulfilment details for event and booking payments made through the website.",
      href: "/refund-policy",
      cta: "Open refund policy",
    },
    {
      title: "Customer Support",
      description:
        "Visitors can contact Hold It Down CIC through the public contact page and the support details shown in the footer and policies.",
      href: "/contact",
      cta: "Open contact page",
    },
  ],
  sections: [
    {
      title: "Organisation details published on this site",
      bullets: [
        entityStatement,
        `Trading name: ${businessDetails.tradingName}`,
        `Legal name: ${businessDetails.legalName}`,
        `Company type: ${businessDetails.organisationType}`,
        `Regulatory type: ${businessDetails.regulatoryType}`,
        `Company number: ${businessDetails.companyNumber}`,
        `Registered in: ${businessDetails.registeredIn}`,
        `Company status: ${businessDetails.companyStatus}`,
        `Incorporated on: ${businessDetails.incorporatedOn}`,
        `Support email: ${businessDetails.email}`,
        `Registered office: ${businessDetails.registeredOffice}`,
      ],
    },
    {
      title: "Current payment scope",
      paragraphs: [
        paymentScope,
        "Programme descriptions, events, support information, and contact details are published across the site so customers and reviewers can understand what Hold It Down CIC does before making contact or payment.",
      ],
    },
    {
      title: "Nature of organisation",
      bullets: businessDetails.sicCodes,
    },
  ],
};
