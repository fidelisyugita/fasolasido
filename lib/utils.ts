import Excel from "exceljs";
import { isNil, isEmpty } from "ramda";
import moment from "moment";

const CASH = "CASH";
const QR = "QR";
const DEBIT = "Kartu Debit";
const GOFOOD = "GoFOOD";

export function addDay(date: string, amount = 1, format = "YYMMDD") {
  if (isNil(date) || isEmpty(date)) return null;
  return moment(date, format).add(amount, "day").format(format);
}

export function transformBody(body: any, callback: any) {
  const reader = new FileReader();
  reader.readAsDataURL(body.excelBase64);
  reader.onload = function () {
    const newBody = { ...body, excelBase64: reader.result };
    callback(newBody);
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
  if (!lastOrderNo) lastOrderNo = "";
  if (!percentage) percentage = 50;
  console.log("lastOrderNo: ", lastOrderNo);
  console.log("percentage: ", percentage);

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

    let cash = 0;
    let qrPayment = 0;
    let debitCard = 0;
    let gofood = 0;
    let rowCount = worksheet.actualRowCount;
    let i = 1;
    while (i < rowCount) {
      const prevRow = worksheet.getRow(i);
      const row = worksheet.getRow(i + 1);
      if (row.getCell(2).value != prevRow.getCell(2).value) {
        // compare order time
        suffixOrderNo += 1;
      }
      row.getCell(1).value = `${prefixOrderNo}${suffixOrderNo}`; // modify order no
      row.commit();

      // count by payment type
      switch (String(row.getCell(8))) {
        case QR:
          qrPayment += Number(row.getCell(7));
          break;
        case GOFOOD:
          gofood += Number(row.getCell(7));
          break;
        case DEBIT:
          debitCard += Number(row.getCell(7));
          break;
        default:
          cash += Number(row.getCell(7));
          break;
      }

      // remove unnecessary row
      if (i % removeEvery == 0) {
        worksheet.spliceRows(i + 2, removeCount);
        rowCount -= removeCount;
      }
      i += 1;
    }

    // input total & label
    worksheet.getCell(`A${rowCount + 5}`).value = CASH;
    worksheet.getCell(`A${rowCount + 6}`).value = QR;
    worksheet.getCell(`A${rowCount + 7}`).value = DEBIT;
    worksheet.getCell(`A${rowCount + 8}`).value = GOFOOD;
    worksheet.getCell(`A${rowCount + 9}`).value = "TOTAL";
    worksheet.getCell(`B${rowCount + 5}`).value = `Rp ${cash}`;
    worksheet.getCell(`B${rowCount + 6}`).value = `Rp ${qrPayment}`;
    worksheet.getCell(`B${rowCount + 7}`).value = `Rp ${debitCard}`;
    worksheet.getCell(`B${rowCount + 8}`).value = `Rp ${gofood}`;
    worksheet.getCell(`B${rowCount + 9}`).value = `Rp ${
      cash + qrPayment + debitCard + gofood
    }`;

    return workbook.xlsx.writeBuffer();
  } catch (error) {
    console.log("error: ", error);
  }
}
