import { Helmet } from "react-helmet-async";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

const SITE = "https://pizzavolante-dashboard.com";
const DEFAULT_IMAGE = `${SITE}/images/hero-pizza.webp`;

const Seo = ({ title, description, path, image, jsonLd }: SeoProps) => {
  const url = `${SITE}${path}`;
  const img = image ?? DEFAULT_IMAGE;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
      ))}
    </Helmet>
  );
};

export default Seo;
