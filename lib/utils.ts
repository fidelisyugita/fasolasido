import Excel from "exceljs";
import { isNil, isEmpty } from "ramda";
import moment from "moment";

export function addDay(date: string, amount = 1, format = "YYMMDD") {
  if (isNil(date) || isEmpty(date)) return null;
  return moment(date, format).add(amount, "day").format(format);
}

export function getBase64(filePath: any, callback: any) {
  const reader = new FileReader();
  reader.readAsDataURL(filePath);
  reader.onload = function () {
    callback(reader.result);
  };
  reader.onerror = function (error) {
    throw error;
  };
}

export async function modify(
  base64: string,
  lastOrderNo = "",
  percentage = 50
) {
  // if(!lastOrderNo) lastOrderNo = ""
  // if(!percentage) percentage = 50
  // console.log("base64: ", base64);
  const workbook = new Excel.Workbook();

  const encoded = base64.replace(/^data:\w+\/\w+;base64,/, "");
  const fileBuffer = Buffer.from(encoded, "base64");

  try {
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];

    let orderDate = addDay(lastOrderNo?.slice(4, 10));
    if (isNil(lastOrderNo) || isEmpty(lastOrderNo)) {
      lastOrderNo = String(worksheet.getRow(2).getCell(1).value);
      orderDate = lastOrderNo?.slice(4, 10) || "";
    }
    const prefixOrderNo = `${lastOrderNo?.slice(0, 4)}${orderDate}`;
    let suffixOrderNo = Number(lastOrderNo?.slice(10, 18) || "00000000");
    // console.log("prefixOrderNo: ", prefixOrderNo);

    /**
     * remove unnecessary column
     */
    worksheet.spliceColumns(2, 1);
    worksheet.spliceColumns(3, 14);
    worksheet.spliceColumns(5, 3);
    worksheet.spliceColumns(6, 2);
    worksheet.spliceColumns(7, 3);
    worksheet.spliceColumns(8, 10);
    worksheet.spliceColumns(9, 9);

    /**
     * prepare compression
     */
    let removeCount = 1; // in row
    let removeEvery = 1; // per row
    if (percentage < 20) percentage = 20;
    if (percentage > 80) percentage = 80;
    if (percentage < 50) {
      removeCount = parseInt(String((100 - percentage) / percentage));
    } else {
      removeEvery = parseInt(String(percentage / (100 - percentage)));
    }

    /**
     * modify order no & remove unnecessary row
     */
    let rowCount = worksheet.actualRowCount;
    let i = 1;
    while (i < rowCount) {
      const row = worksheet.getRow(i + 1); // first row after header
      const prevRow = worksheet.getRow(i);
      if (row.getCell(2).value != prevRow.getCell(2).value) {
        suffixOrderNo += 1;
      }
      row.getCell(1).value = `${prefixOrderNo}${suffixOrderNo}`;
      // console.log("suffixOrderNo: ", suffixOrderNo);
      row.commit();
      if (i % removeEvery == 0) {
        worksheet.spliceRows(i + 2, removeCount);
        rowCount -= removeCount;
      }
      i += 1;
    }
    return workbook.xlsx.writeBuffer();
  } catch (error) {
    console.log("error: ", error);
  }
}
