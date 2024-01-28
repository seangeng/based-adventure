export default function StartScreen() {
  const title = "Base Quest - Start your Adventure!";

  return (
    <html>
      <head>
        <title>Mint</title>
        <meta property="og:title" content={title} />
        <meta
          property="og:image"
          content={`${process.env.DOMAIN}/base-quest-start-screen.jpg`}
        />
        <meta name="fc:frame" content="vNext" />
        <meta
          name="fc:frame:image"
          content={`${process.env.DOMAIN}/base-quest-start-screen.jpg`}
        />
        <meta
          name="fc:frame:post_url"
          content={`${process.env.DOMAIN}/api/spawn`}
        />
        <meta name="fc:frame:button:1" content="Start your adventure" />
      </head>
      <body className="flex items-center justify-center h-screen w-screen">
        <img src={`/base-quest-start.jpg`} />
      </body>
    </html>
  );
}
