import React, { useState } from "react";

import Form from "../components/Form";
import Layout from "../components/Layout";
import { transformBody, generateExcel } from "../lib/utils";

function Home() {
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setLoading] = useState(false);

  return (
    <React.Fragment>
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

              // if (body.excelBase64.size > 300 * 1024) {
              //   setErrorMsg("File should be less than 300KB 🥲");
              //   setLoading(false);
              //   return;
              // }

              transformBody(body, async (reqBody: any) => {
                try {
                  const res: any = await generateExcel(reqBody);
                  // axios.post("/api/excel", reqBody, {
                  //   responseType: "arraybuffer",
                  //   headers: {
                  //     "Content-Type": "application/json",
                  //     Accept:
                  //       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  //   },
                  // });
                  // console.log("res: ", res);

                  const url = window.URL.createObjectURL(new Blob([res]));
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", "file.xlsx"); //or any other extension
                  document.body.appendChild(link);
                  link.click();

                  setLoading(false);
                } catch (error) {
                  console.error("An unexpected error happened:", error);
                  setLoading(false);
                }
              });
            }}
          />
        </div>
      </Layout>
    </React.Fragment>
  );
}

export default Home;
