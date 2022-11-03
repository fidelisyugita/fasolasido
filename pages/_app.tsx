import { AppProps } from 'next/app'
import { SWRConfig } from 'swr'
import fetchJson from 'lib/fetchJson'

import "@fortawesome/fontawesome-free/css/all.min.css";
import "styles/tailwind.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig
      value={{
        fetcher: fetchJson,
        onError: (err) => {
          console.error(err)
        },
      }}
    >
      <Component {...pageProps} />
    </SWRConfig>
  )
}

export default MyApp
