export function buildFrameMetaHTML({
  title,
  image,
  post_url,
  buttons,
}: {
  title: string;
  image: string;
  post_url: string;
  buttons: string[];
}) {
  // Build buttons meta
  let buttonsMeta = "";
  buttons.forEach((button, index) => {
    buttonsMeta += `<meta name="fc:frame:button:${
      index + 1
    }" content="${button}">`;
  });

  return `<!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <meta property="og:title" content="${title}">
            <meta property="og:image" content="${process.env.DOMAIN}/${image}">
            <meta name="fc:frame" content="vNext">
            <meta name="fc:frame:image" content="${process.env.DOMAIN}/${image}">
            <meta name="fc:frame:post_url" content="${process.env.DOMAIN}/${post_url}">
            ${buttonsMeta}
        </head>
        <body>
            <p>${title}</p>
        </body>
        </html>`;
}
