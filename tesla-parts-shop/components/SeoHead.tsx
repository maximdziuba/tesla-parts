import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoHeadProps {
  title?: string | null;
  description?: string | null;
  image?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

const DEFAULT_TITLE = 'Tesla Parts Center';
const DEFAULT_DESCRIPTION = 'Tesla Parts Center пропонує запчастини та аксесуари для вашого електромобіля.';

const SeoHead: React.FC<SeoHeadProps> = ({ title, description, image, fallbackTitle, fallbackDescription }) => {
  const safeTitle = title?.trim() || fallbackTitle?.trim() || DEFAULT_TITLE;
  const safeDescription = description?.trim() || fallbackDescription?.trim() || DEFAULT_DESCRIPTION;

  return (
    <Helmet>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />

      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:type" content="product" />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDescription} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
};

export default SeoHead;
