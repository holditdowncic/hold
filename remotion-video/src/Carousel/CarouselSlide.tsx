import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { CarouselSlideInputProps } from "../Video/types";

const colors = {
  panel: "#f6f3ee",
  ink: "#10233a",
  body: "#2b3645",
  accent: "#14b8a6",
  divider: "rgba(16, 35, 58, 0.08)",
};

const safeText = (value: unknown): string =>
  String(value ?? "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const headingSize = (heading: string, role: string): number => {
  const len = safeText(heading).length;
  if (role === "cover") {
    if (len <= 24) return 98;
    if (len <= 36) return 84;
    return 72;
  }
  if (role === "conclusion") {
    if (len <= 24) return 86;
    if (len <= 38) return 76;
    return 68;
  }
  if (len <= 24) return 76;
  if (len <= 36) return 68;
  return 60;
};

const bodySize = (body: string): number => {
  const len = safeText(body).length;
  if (len <= 72) return 40;
  if (len <= 108) return 36;
  return 32;
};

export const CarouselSlide: React.FC<CarouselSlideInputProps> = ({ slide }) => {
  const role = safeText(slide?.role || "information").toLowerCase();
  const heading = safeText(slide?.heading);
  const subline = safeText(slide?.subline);
  const backgroundImageUrl = safeText(slide?.backgroundImageUrl);
  const slideIndex = clamp(Number(slide?.slideIndex || 0), 0, 99);
  const totalSlides = clamp(Number(slide?.totalSlides || 5), 1, 99);

  const isCover = role === "cover";
  const isConclusion = role === "conclusion";
  const headingFontSize = headingSize(heading, role);
  const sublineFontSize = isCover ? bodySize(subline) : Math.max(30, bodySize(subline) - 1);
  const copyLength = heading.length + subline.length;
  const topHeight = isCover
    ? copyLength > 200
      ? "56%"
      : "54%"
    : copyLength > 220
      ? "51%"
      : copyLength > 160
        ? "47%"
        : "44%";

  const eyebrowLabel = isCover
    ? "For carers right now"
    : isConclusion
      ? "Keep moving forward"
      : "What matters now";

  const imageScale = isCover ? 1.04 : 1.01;
  const imagePosition = isCover ? "center 18%" : "center center";
  const imageOverlay = isCover
    ? "linear-gradient(180deg, rgba(8,18,30,0.04) 0%, rgba(8,18,30,0.28) 100%)"
    : "linear-gradient(180deg, rgba(8,18,30,0.02) 0%, rgba(8,18,30,0.18) 100%)";
  const brandTextColor = isCover ? "#143244" : "#204154";

  return (
    <AbsoluteFill style={{ backgroundColor: colors.panel }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 10,
          background:
            "linear-gradient(90deg, #14b8a6 0%, #0ea5a8 48%, #0f766e 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            position: "relative",
            height: topHeight,
            padding: isCover ? "74px 68px 42px 68px" : "56px 68px 18px 68px",
            display: "flex",
            flexDirection: "column",
            justifyContent: isCover ? "center" : "flex-start",
            boxSizing: "border-box",
            background:
              "radial-gradient(circle at top right, rgba(20,184,166,0.08), transparent 42%)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: isCover ? 34 : 18,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: isCover ? 44 : 32,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: colors.accent,
                }}
              />
              <div
                style={{
                  color: "#375063",
                  fontFamily:
                    "\"Avenir Next\", \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif",
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: 0.2,
                }}
              >
                {eyebrowLabel}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: isCover ? "10px 16px" : "8px 14px",
                  borderRadius: 999,
                  backgroundColor: "rgba(20,184,166,0.12)",
                  border: "1px solid rgba(20,184,166,0.16)",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: colors.accent,
                    boxShadow: "0 0 0 5px rgba(20,184,166,0.14)",
                  }}
                />
                <div
                  style={{
                    color: brandTextColor,
                    fontFamily:
                      "\"Avenir Next\", \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif",
                    fontSize: isCover ? 24 : 22,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                  }}
                >
                  Dignitate
                </div>
              </div>

              <div
                style={{
                  color: "rgba(16,35,58,0.58)",
                  fontFamily:
                    "\"Avenir Next\", \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif",
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: 0.8,
                }}
              >
                {String(slideIndex + 1).padStart(2, "0")}/{String(totalSlides).padStart(2, "0")}
              </div>
            </div>
          </div>

          <div
            style={{
              color: colors.ink,
              fontFamily:
                "\"Avenir Next\", \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif",
              fontSize: headingFontSize,
              lineHeight: 1.04,
              fontWeight: 700,
              letterSpacing: -1.8,
              maxWidth: "94%",
              marginBottom: isCover ? 22 : 14,
              display: "-webkit-box",
              WebkitLineClamp: isCover ? 3 : 4,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
              textWrap: "balance" as any,
            }}
          >
            {heading}
          </div>

          <div
            style={{
              color: colors.body,
              fontFamily:
                "\"Avenir Next\", \"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif",
              fontSize: sublineFontSize,
              lineHeight: 1.2,
              fontWeight: 500,
              maxWidth: "92%",
              display: "-webkit-box",
              WebkitLineClamp: isCover ? 5 : 7,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}
          >
            {subline}
          </div>

          <div
            style={{
              position: "absolute",
              left: 68,
              right: 68,
              bottom: 0,
              height: 2,
              backgroundColor: colors.divider,
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            height: `calc(100% - ${topHeight})`,
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(16,35,58,0.08), rgba(20,184,166,0.1))",
          }}
        >
          {backgroundImageUrl ? (
            <>
              <Img
                src={backgroundImageUrl}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: imagePosition,
                  transform: `scale(${imageScale})`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: imageOverlay,
                }}
              />
            </>
          ) : null}

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: isConclusion ? 12 : 8,
              background:
                "linear-gradient(90deg, #14b8a6 0%, #0ea5a8 48%, #0f766e 100%)",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
