import { withIronSessionApiRoute } from "iron-session/next";
// import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

import { sessionOptions } from "lib/session";
import { modify } from "lib/utils";

export type Excel = any;

async function excelRoute(req: NextApiRequest, res: NextApiResponse<Excel>) {
  const { excelBase64, percentage } = req.body;

  const excelBuffer = await modify(excelBase64, percentage);
  // const response = await axios.post(
  //   "https://asia-southeast2-fasolasidon.cloudfunctions.net/excel/generate",
  //   { excelBase64, percentage, lastOrderNo },
  //   {
  //     method: "POST",
  //     responseType: "arraybuffer",
  //     headers: { "Content-Type": "application/json" },
  //   }
  // );

  // if (response.status == 200) {
  if (excelBuffer) {
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + `${new Date().getTime()}.xlsx`
    );

    // return res.send(response.data);
    return res.send(excelBuffer);
  }
}

export default withIronSessionApiRoute(excelRoute, sessionOptions);
