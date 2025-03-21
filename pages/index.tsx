import React, { useState } from "react";
import axios from "axios";
import { withIronSessionSsr } from "iron-session/next";

import { sessionOptions } from "lib/session";
import { User } from "pages/api/user";

import Layout from "components/Layout";
import Form from "components/Form";
import { FetchError } from "lib/fetchJson";
import { transformBody } from "lib/utils";

import { InferGetServerSidePropsType } from "next";

// Make sure to check https://nextjs.org/docs/basic-features/layouts for more info on how to use layouts
export default function Home({
  user,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setLoading] = useState(false);

  return (
    <Layout>
      <div className="home">
        <Form
          errorMessage={errorMsg}
          isLoading={isLoading}
          onSubmit={async function handleSubmit(event) {
            event.preventDefault();
            setErrorMsg("");
            setLoading(true);

            // console.log(event.currentTarget["file-input"].files[0]);

            const body = {
              excelBase64: event.currentTarget["file-input"].files[0],
              percentage: event.currentTarget?.percentage?.value,
              lastOrderNo: event.currentTarget?.lastOrderNo?.value,
            };

            if (body.excelBase64.size > 300 * 1024) {
              setErrorMsg("File should be less than 300KB 🥲");
              setLoading(false);
              return;
            }

            transformBody(body, async (reqBody: any) => {
              try {
                const res = await axios.post("/api/excel", reqBody, {
                  responseType: "arraybuffer",
                  headers: {
                    "Content-Type": "application/json",
                    Accept:
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  },
                });
                // console.log("res: ", res);

                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", "file.xlsx"); //or any other extension
                document.body.appendChild(link);
                link.click();

                // return await axios.post(
                //   "https://asia-southeast2-fasolasidon.cloudfunctions.net/excel/generate",
                //   {
                //     method: "POST",
                //     responseType: "arraybuffer",
                //     headers: {
                //       "Content-Type": "application/json",
                //       Accept:
                //         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                //     },
                //     body: JSON.stringify(body),
                //   }
                // );
                setLoading(false);
              } catch (error) {
                if (error instanceof FetchError) {
                  setErrorMsg(error.data.message);
                } else {
                  console.error("An unexpected error happened:", error);
                }
                setLoading(false);
              }
            });
          }}
        />
      </div>
    </Layout>
  );
}

export const getServerSideProps = withIronSessionSsr(async function ({
  req,
  res,
}) {
  const user = req.session.user;

  if (user === undefined) {
    res.setHeader("location", "/login");
    res.statusCode = 302;
    res.end();
    return {
      props: {
        user: { isLoggedIn: false, accessToken: "", id: "" } as User,
      },
    };
  }

  return {
    props: { user: req.session.user },
  };
},
sessionOptions);
