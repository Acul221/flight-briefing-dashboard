const siteUrl = "https://skydeckpro.netlify.app";
const defaultImage = "/og-image.png";

export const seo = {
  defaultTitle: "SkyDeckPro – Pilot Quiz & Logbook Platform",
  defaultDescription:
    "SkyDeckPro helps pilots study smarter with quizzes, OCR logbook, and aviation tools.",
  siteUrl,
  defaultImage,
  twitterHandle: "@SkyDeckPro", // opsional kalau punya akun Twitter/X
};

export function buildSeo({
  title,
  description,
  path = "/",
  image = defaultImage,
}) {
  const url = `${siteUrl}${path}`;
  return {
    title: title || seo.defaultTitle,
    description: description || seo.defaultDescription,
    image: image || defaultImage,
    url,
  };
}
