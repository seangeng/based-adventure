export default function Profile({
  params,
}: {
  params: {
    id: string;
  };
}) {
  return (
    <html>
      <head>
        <title>Profile for {params.id}</title>
        <meta property="og:title" content={`Profile for ${params.id}`} />
        <meta
          property="og:image"
          content={`${process.env.DOMAIN}/api/profile-image?id=${params.id}`}
        />
        <meta name="fc:frame" content="vNext" />
        <meta
          name="fc:frame:image"
          content={`${process.env.DOMAIN}/api/profile-image?id=${params.id}`}
        />
        <meta
          name="fc:frame:post_url"
          content={`${process.env.DOMAIN}/api/profile?id=${params.id}`}
        />
        <meta name="fc:frame:button:1" content="Connect" />
      </head>
      <body></body>
    </html>
  );
}
