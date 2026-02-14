// ============================================
// HOLD CMS — Content Types
// ============================================

// --- Site Content (JSONB sections) ---

export interface HeroContent {
    badge: string;
    heading_line1: string;
    heading_line2: string;
    heading_line3: string;
    subtitle: string;
    subtitle2: string;
    image: string;
    image_alt: string;
    cta_primary_text: string;
    cta_primary_link: string;
    cta_secondary_text: string;
    cta_secondary_link: string;
}

export interface AboutFocusArea {
    icon: string;
    text: string;
}

export interface AboutContent {
    callout_title: string;
    callout_text: string;
    image: string;
    image_alt: string;
    badge_year: string;
    badge_location: string;
    section_label: string;
    heading: string;
    paragraphs: string[];
    focus_areas: AboutFocusArea[];
}

export interface CTAButton {
    text: string;
    link: string;
    primary?: boolean;
}

export interface CTAContent {
    heading: string;
    description: string;
    buttons: CTAButton[];
}

export interface ContactItem {
    label: string;
    value: string;
    href: string | null;
    icon: string;
}

export interface ContactContent {
    section_label: string;
    heading: string;
    description: string;
    items: ContactItem[];
}

export interface SupportWay {
    icon: string;
    title: string;
    desc: string;
}

export interface SupportContent {
    section_label: string;
    heading: string;
    description: string;
    ways: SupportWay[];
    cta_text: string;
}

export interface GalleryContent {
    section_label: string;
    heading: string;
    description: string;
    video_src: string;
    video_poster: string;
    video_caption: string;
}

export interface ProgramsSectionContent {
    section_label: string;
    heading_prefix: string;
    heading_highlight1: string;
    heading_mid: string;
    heading_highlight2: string;
    description: string;
    flagship_label: string;
    flagship_title: string;
    flagship_desc: string;
    flagship_desc2: string;
    flagship_image: string;
    flagship_image_alt: string;
    flagship_tags: string[];
}

export interface MissionValue {
    num: string;
    title: string;
    desc: string;
    icon: string;
}

export interface MissionContent {
    pill: string;
    heading_line1: string;
    heading_line2_prefix: string;
    heading_line2_highlight: string;
    description: string;
    values: MissionValue[];
}

// --- Structured tables ---

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    image_url: string | null;
    sort_order: number;
}

export interface GalleryImage {
    id: string;
    src: string;
    alt: string;
    caption: string;
    sort_order: number;
}

export interface Program {
    id: string;
    title: string;
    description: string;
    tags: string[];
    image_url: string | null;
    image_alt: string;
    is_flagship: boolean;
    sort_order: number;
}

export interface Initiative {
    id: string;
    title: string;
    detail: string;
    sort_order: number;
}

export interface EventGalleryItem {
    src: string;
    alt: string;
}

export interface EventData {
    id: string;
    slug: string;
    title: string;
    date: string;
    location: string;
    description: string;
    highlights: string[];
    impact: string[];
    image: string;
    image_alt: string;
    badge: string;
    gallery: EventGalleryItem[];
    sort_order: number;
}

export interface Stat {
    id: string;
    label: string;
    value: number;
    suffix: string;
    prefix: string;
    duration: number;
    sort_order: number;
}

// --- Cookie Banner ---

export interface CookieBannerContent {
    message: string;
    accept_text: string;
    decline_text: string;
    policy_link?: string;
    enabled: boolean;
}

// --- Custom sections (rendered dynamically on the homepage) ---

export interface CustomSectionButton {
    text: string;
    href: string;
    variant?: "primary" | "secondary";
}

export interface CustomSection {
    id: string;
    section_label?: string;
    heading: string;
    body?: string[];
    image?: string | null;
    image_alt?: string;
    buttons?: CustomSectionButton[];
    layout?: "image_left" | "image_right" | "no_image";
    bg?: "default" | "elevated";
    sort_order: number;
}

// --- CMS Action types (from OpenRouter AI) ---

export type CMSAction =
    | { action: "update_section"; section: string; content: Record<string, unknown> }
    | { action: "update_section_field"; section: string; field: string; value: unknown }
    | { action: "add_team_member"; name: string; role: string; image_url?: string }
    | { action: "remove_team_member"; name: string }
    | { action: "update_team_member"; name: string; updates: Partial<TeamMember> }
    | { action: "add_gallery_image"; src: string; alt: string; caption: string }
    | { action: "remove_gallery_image"; caption: string }
    | { action: "add_program"; title: string; description: string; tags: string[]; image_url?: string; image_alt?: string }
    | { action: "update_program"; title: string; updates: Partial<Program> }
    | { action: "remove_program"; title: string }
    | { action: "add_event"; event: Partial<EventData> }
    | { action: "update_event"; slug: string; updates: Partial<EventData> }
    | { action: "update_stat"; label: string; value: number; suffix?: string; prefix?: string }
    | { action: "add_initiative"; title: string; detail: string }
    | { action: "remove_initiative"; title: string }
    | { action: "add_custom_section"; section: Omit<CustomSection, "id" | "sort_order"> & { id?: string; sort_order?: number } }
    | { action: "update_custom_section"; id: string; updates: Partial<CustomSection> }
    | { action: "remove_custom_section"; id: string }
    | { action: "reorder_custom_sections"; ids: string[] }
    | { action: "get_status" }
    | { action: "undo" }
    | { action: "unknown"; message: string };
