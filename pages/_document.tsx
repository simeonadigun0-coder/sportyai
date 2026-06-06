import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="Groove Slip" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Groove Slip" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1a3d1e" />

        {/* Apple icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-128.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72.png" />
        <link rel="shortcut icon" href="/icons/icon-96.png" />

        {/* SEO */}
        <meta name="description" content="AI-powered bet slip analyser for SportyBet Nigeria. Remove bad eggs, replace risky picks, get smarter codes." />
        <meta property="og:title" content="Groove Slip" />
        <meta property="og:description" content="Where sharp minds meet sharper picks" />
        <meta property="og:type" content="website" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}