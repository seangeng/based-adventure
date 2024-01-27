export default function StartScreen() {
  return (
    <html>
      <head>
        <title>Mint</title>
        <meta property="og:title" content="Tested!" />
        <meta property="og:image" content="/api/welcome" />
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:image" content="/api/welcome" />
        <meta
          name="fc:frame:post_url"
          content="https://based-adventure.vercel.app/api/start"
        />
        <meta name="fc:frame:button:1" content="Minted to" />
      </head>
      <body>
        <p>Choose your own text-based adventure.</p>
        {/* other content */}
      </body>
    </html>
  );
}
