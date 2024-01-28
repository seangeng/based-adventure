export default function StartScreen() {
  const title = "Base Quest - Start your Adventure!";

  return (
    <html>
      <head>
        <title>Mint</title>
        <meta property="og:title" content={title} />
        <meta
          property="og:image"
          content={`https://${process.env.VERCEL_URL}/base-quest-start.jpg`}
        />
        <meta name="fc:frame" content="vNext" />
        <meta
          name="fc:frame:image"
          content={`https://${process.env.VERCEL_URL}/base-quest-start.jpg`}
        />
        <meta
          name="fc:frame:post_url"
          content="https://eo6m4ikat6vrxtj.m.pipedream.net"
        />
        <meta name="fc:frame:button:1" content="Start your adventure" />
      </head>
      <body>
        <p>{title}</p>
      </body>
    </html>
  );
}
