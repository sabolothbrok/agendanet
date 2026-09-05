export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/b/", "/platform", "/login", "/api/"],
      },
    ],
    sitemap: "https://agendanet.vercel.app/sitemap.xml",
  };
}
