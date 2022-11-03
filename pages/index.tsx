import React, { useState } from "react";
import axios from "axios";

import Layout from "components/Layout";
import Form from "components/Form";
import fetchJson, { FetchError } from "lib/fetchJson";
import { getBase64 } from "lib/utils";

// Make sure to check https://nextjs.org/docs/basic-features/layouts for more info on how to use layouts
export default function Home() {
  const [errorMsg, setErrorMsg] = useState("");

  return (
    <Layout>
      <div className="home">
        <Form
          errorMessage={errorMsg}
          onSubmit={async function handleSubmit(event) {
            event.preventDefault();
            setErrorMsg("");

            // console.log(event.currentTarget["file-input"].files[0]);
            try {
              getBase64(
                event.currentTarget["file-input"].files[0],
                async (base64File: any) => {
                  // console.log("base64File: ", base64File);

                  const body = {
                    excelBase64: base64File,
                    percentage: event.currentTarget?.percentage?.value,
                    lastOrderNo: event.currentTarget?.lastOrderNo?.value,
                  };

                  // console.log("body: ", JSON.stringify(body));

                  const res = await axios.post("/api/excel", body, {
                    responseType: "arraybuffer",
                    headers: {
                      "Content-Type": "application/json",
                      Accept:
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    },
                  });
                  console.log("res: ", res);

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
                }
              );
            } catch (error) {
              if (error instanceof FetchError) {
                setErrorMsg(error.data.message);
              } else {
                console.error("An unexpected error happened:", error);
              }
            }
          }}
        />
      </div>
    </Layout>
  );
}
