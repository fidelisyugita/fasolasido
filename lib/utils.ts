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

export function getDateFromOrderNo(orderNo: string, format = "YYMMDD") {
  const orderDate = orderNo?.slice(4, 10);
  if (orderDate) return orderDate;
  return moment().format(format);
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

export async function modify(base64: string, percentage = 50) {
  if (!percentage) percentage = 50;
  console.log("percentage: ", percentage);

  const workbook = new Excel.Workbook();

  const encoded = base64.replace(/^data:\w+\/\w+;base64,/, "");
  const fileBuffer = Buffer.from(encoded, "base64");

  try {
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];

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

    let seqOrderNo = 0;
    let newWorksheet;

    let cash = 0;
    let qrPayment = 0;
    let debitCard = 0;
    let gofood = 0;
    let rowCount = worksheet.actualRowCount;
    let i = 1;
    let sheetCounter = 8; // first cell in sheet
    while (i < rowCount) {
      const prevRow = worksheet.getRow(i);
      const row = worksheet.getRow(i + 1);

      const prevOrderNo = String(prevRow.getCell(1).value);
      const orderNo = String(row.getCell(1).value);
      const orderDate = getDateFromOrderNo(orderNo);

      if (!newWorksheet || orderDate != getDateFromOrderNo(prevOrderNo)) {
        if (newWorksheet) {
          const lastRow = newWorksheet.actualRowCount + 4;
          // input total & label
          newWorksheet.getCell(`A${lastRow + 5}`).value = CASH;
          newWorksheet.getCell(`A${lastRow + 6}`).value = QR;
          newWorksheet.getCell(`A${lastRow + 7}`).value = DEBIT;
          newWorksheet.getCell(`A${lastRow + 8}`).value = GOFOOD;
          newWorksheet.getCell(`A${lastRow + 9}`).value = "TOTAL";
          newWorksheet.getCell(`B${lastRow + 5}`).value = `Rp ${cash}`;
          newWorksheet.getCell(`B${lastRow + 6}`).value = `Rp ${qrPayment}`;
          newWorksheet.getCell(`B${lastRow + 7}`).value = `Rp ${debitCard}`;
          newWorksheet.getCell(`B${lastRow + 8}`).value = `Rp ${gofood}`;
          newWorksheet.getCell(`B${lastRow + 9}`).value = `Rp ${
            cash + qrPayment + debitCard + gofood
          }`;
          cash = 0;
          qrPayment = 0;
          debitCard = 0;
          gofood = 0;
        }

        newWorksheet = workbook.addWorksheet(getDateFromOrderNo(orderNo)); // set new sheet
        sheetCounter = 6; // first cell in sheet
      }
      const anotherRow = newWorksheet?.getRow(sheetCounter);

      const prefixOrderNo = `${orderNo?.slice(0, 4)}${orderDate}`;
      // compare order time
      if (row.getCell(2).value != prevRow.getCell(2).value) {
        seqOrderNo += 1;
      }
      const suffixOrderNo = String(seqOrderNo).padStart(8, "0");

      row.getCell(1).value = `${prefixOrderNo}${suffixOrderNo}`; // modify order no
      row.commit();

      anotherRow.getCell(1).value = row.getCell(1).value;
      anotherRow.getCell(2).value = row.getCell(2).value;
      anotherRow.getCell(3).value = row.getCell(3).value;
      anotherRow.getCell(4).value = row.getCell(4).value;
      anotherRow.getCell(5).value = row.getCell(5).value;
      anotherRow.getCell(6).value = row.getCell(6).value;
      anotherRow.getCell(7).value = row.getCell(7).value;
      anotherRow.getCell(8).value = row.getCell(8).value;
      anotherRow.commit();

      // count by payment type
      switch (String(row.getCell(8))) {
        case QR:
          qrPayment += Number(anotherRow.getCell(7));
          break;
        case GOFOOD:
          gofood += Number(anotherRow.getCell(7));
          break;
        case DEBIT:
          debitCard += Number(anotherRow.getCell(7));
          break;
        default:
          cash += Number(anotherRow.getCell(7));
          break;
      }

      // remove unnecessary row
      if (i % removeEvery == 0) {
        worksheet.spliceRows(i + 2, removeCount);
        rowCount -= removeCount;
      }
      i += 1;
      sheetCounter += 1;
    }

    if (newWorksheet) {
      const lastRow = newWorksheet.actualRowCount + 4;
      // input total & label
      newWorksheet.getCell(`A${lastRow + 5}`).value = CASH;
      newWorksheet.getCell(`A${lastRow + 6}`).value = QR;
      newWorksheet.getCell(`A${lastRow + 7}`).value = DEBIT;
      newWorksheet.getCell(`A${lastRow + 8}`).value = GOFOOD;
      newWorksheet.getCell(`A${lastRow + 9}`).value = "TOTAL";
      newWorksheet.getCell(`B${lastRow + 5}`).value = `Rp ${cash}`;
      newWorksheet.getCell(`B${lastRow + 6}`).value = `Rp ${qrPayment}`;
      newWorksheet.getCell(`B${lastRow + 7}`).value = `Rp ${debitCard}`;
      newWorksheet.getCell(`B${lastRow + 8}`).value = `Rp ${gofood}`;
      newWorksheet.getCell(`B${lastRow + 9}`).value = `Rp ${
        cash + qrPayment + debitCard + gofood
      }`;
    }

    return workbook.xlsx.writeBuffer();
  } catch (error) {
    console.log("error: ", error);
  }
}
