import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoHeadProps {
  title: string;
  description: string;
  image?: string;
}

const SeoHead: React.FC<SeoHeadProps> = ({ title, description, image }) => {
  const safeTitle = title?.trim() || 'Tesla Parts Center';
  const safeDescription = description?.trim() || 'Tesla Parts Center';

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
