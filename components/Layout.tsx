import Head from "next/head";
// import Header from "components/Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <title>Fasolasidon</title>
      </Head>

      {/* <Header /> */}

      <main>
        {/* <div className="container">{children}</div> */}
        <section className="relative w-full h-full py-40 min-h-screen">
          <div
            className="absolute top-0 w-full h-full bg-blueGray-800 bg-no-repeat bg-full"
            style={{
              backgroundImage: "url('/img/register_bg_2.png')",
            }}
          ></div>
          {children}
        </section>
      </main>
    </>
  );
}
