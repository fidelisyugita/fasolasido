import Excel from "exceljs";
import { isNil, isEmpty } from "ramda";
import moment from "moment";

const CASH = "CASH";
const QR = "QR";
const DEBIT = "Kartu Debit";
const DEBITBCA = "Debit BCA";
const DEBITMANDIRI = "Debit Mandiri";
const DEBITBRI = "Debit BRI";
const GOFOOD = "GoFOOD";

export function addDay(date: string, amount = 1, format = "YYMMDD") {
  if (isNil(date) || isEmpty(date)) return null;
  return moment(date, format).add(amount, "day").format(format);
}

export function moneyFormat(value = 0) {
  return value;
  // if (!value) return;
  // const formattedMoney = value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
  // return `Rp ${formattedMoney.split(".")[0]}`;
}

export function getDateFromOrderNo(orderNo: string, format = "YYMMDD") {
  const orderDate = orderNo?.slice(4, 10);
  if (orderDate) return orderDate;
  return moment().format(format);
}

export function getHeader(date: string, format = "ddd_YYMMDD") {
  if (isNil(date) || isEmpty(date)) null;
  return `KOHVI_BELITUNG_${moment(date, "YYMMDD").format(format)}`;
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

export async function generateExcel(body: any) {
  const { excelBase64, percentage, lastOrderNo } = body;

  const excelBuffer = await modify(excelBase64, percentage, lastOrderNo);

  return excelBuffer;
}

export async function modify(
  base64: string,
  percentage: number,
  lastOrderNo: string
) {
  if (!percentage) percentage = 50;
  console.log("percentage: ", percentage);
  console.log("lastOrderNo: ", lastOrderNo);

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
    worksheet.spliceColumns(8, 12);
    worksheet.spliceColumns(9, 9);

    /**
     * remove unnecessary row
     * minus value
     */
    let actualLastRow = worksheet.actualRowCount;
    while (Number(worksheet.getCell(`G${actualLastRow}`).value) < 0) {
      actualLastRow -= 1;
    }

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

    let seqOrderNo = Number(lastOrderNo || 0);
    let newWorksheet;

    let cash = 0;
    let qrPayment = 0;
    let debitCard = 0;
    let debitBca = 0;
    let debitMandiri = 0;
    let debitBri = 0;
    let gofood = 0;
    let rowCount = actualLastRow;
    console.log(
      `LAST (G${rowCount}).value: `,
      worksheet.getCell(`G${rowCount}`).value
    );
    let i = 1;
    let sheetCounter = 6; // first cell in sheet
    while (i < rowCount) {
      const prevRow = worksheet.getRow(i);
      const row = worksheet.getRow(i + 1);

      const prevOrderNo = String(prevRow.getCell(1).value);
      const orderNo = String(row.getCell(1).value);
      const orderDate = getDateFromOrderNo(orderNo);

      if (!newWorksheet || orderDate != getDateFromOrderNo(prevOrderNo)) {
        if (newWorksheet) {
          const lastRow = newWorksheet.actualRowCount - 1;
          // input total & label
          newWorksheet.getCell(`A${lastRow + 5}`).value = CASH;
          newWorksheet.getCell(`A${lastRow + 6}`).value = QR;
          newWorksheet.getCell(`A${lastRow + 7}`).value = DEBIT;
          newWorksheet.getCell(`A${lastRow + 8}`).value = DEBITBCA;
          newWorksheet.getCell(`A${lastRow + 9}`).value = DEBITMANDIRI;
          newWorksheet.getCell(`A${lastRow + 10}`).value = DEBITBRI;
          newWorksheet.getCell(`A${lastRow + 11}`).value = GOFOOD;
          newWorksheet.getCell(`A${lastRow + 12}`).value = "T O T A L";
          newWorksheet.getCell(`B${lastRow + 5}`).value = moneyFormat(cash);
          newWorksheet.getCell(`B${lastRow + 6}`).value =
            moneyFormat(qrPayment);
          newWorksheet.getCell(`B${lastRow + 7}`).value =
            moneyFormat(debitCard);
          newWorksheet.getCell(`B${lastRow + 8}`).value = moneyFormat(debitBca);
          newWorksheet.getCell(`B${lastRow + 9}`).value =
            moneyFormat(debitMandiri);
          newWorksheet.getCell(`B${lastRow + 10}`).value =
            moneyFormat(debitBri);
          newWorksheet.getCell(`B${lastRow + 11}`).value = moneyFormat(gofood);
          newWorksheet.getCell(`B${lastRow + 12}`).value = moneyFormat(
            cash +
              qrPayment +
              debitCard +
              debitBca +
              debitMandiri +
              debitBri +
              gofood
          );
          newWorksheet.getCell(`A${lastRow + 12}`).alignment = {
            horizontal: "right",
          };
          newWorksheet.getRow(lastRow + 12).font = { bold: true };

          cash = 0;
          qrPayment = 0;
          debitCard = 0;
          debitBca = 0;
          debitMandiri = 0;
          debitBri = 0;
          gofood = 0;
        }

        console.log("newWorksheet orderDate: ", orderDate);

        newWorksheet = workbook.addWorksheet(orderDate); // set new sheet
        sheetCounter = 6; // first cell in sheet

        /**
         * setup width
         */
        newWorksheet.columns = [
          { width: 18 },
          { width: 20, style: { numFmt: '"Rp "#,###' } },
          { width: 22 },
          { width: 22 },
          { width: 6, style: { alignment: { horizontal: "center" } } },
          {
            width: 12,
            style: { numFmt: '"Rp "#,###' },
          },
          {
            width: 12,
            style: { numFmt: '"Rp "#,###' },
          },
          { width: 12 },
        ];

        /**
         * setup header
         * START
         */
        newWorksheet.mergeCells("A1", "H3");
        newWorksheet.getRow(1).font = { bold: true, size: 12 };
        newWorksheet.getRow(1).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        newWorksheet.getCell(`A1`).value = getHeader(orderDate);

        newWorksheet.mergeCells("A4", "A5");
        newWorksheet.mergeCells("B4", "B5");
        newWorksheet.mergeCells("C4", "C5");
        newWorksheet.mergeCells("D4", "D5");
        newWorksheet.mergeCells("E4", "E5");
        newWorksheet.mergeCells("F4", "F5");
        newWorksheet.mergeCells("G4", "G5");
        newWorksheet.mergeCells("H4", "H5");
        newWorksheet.getRow(4).font = { bold: true, size: 11 };
        newWorksheet.getRow(4).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        newWorksheet.getCell(`A4`).value = "Order Time";
        newWorksheet.getCell(`B4`).value = "Order No";
        newWorksheet.getCell(`C4`).value = "Item Category";
        newWorksheet.getCell(`D4`).value = "Item";
        newWorksheet.getCell(`E4`).value = "Qty";
        newWorksheet.getCell(`F4`).value = "Price";
        newWorksheet.getCell(`G4`).value = `Subtotal Net`;
        newWorksheet.getCell(`H4`).value = "Payment Type";
        /**
         * setup header
         * END
         */
      }
      const anotherRow = newWorksheet?.getRow(sheetCounter);

      const prefixOrderNo = `${orderNo?.slice(0, 4)}${orderDate}`;
      // compare order time
      if (row.getCell(2).value != prevRow.getCell(2).value) {
        seqOrderNo += 1;
      }
      const suffixOrderNo = String(seqOrderNo).padStart(9, "0");

      row.getCell(1).value = `${prefixOrderNo}${suffixOrderNo}`; // modify order no
      row.commit();

      // QR check
      row.getCell(8).value = row
        .getCell(8)
        .value?.toString()
        .toLowerCase()
        .includes("qr")
        ? QR
        : row.getCell(8).value;

      if (!String(row.getCell(4).value).includes("Ongkir")) {
        const payment = row.getCell(8).value;
        anotherRow.getCell(1).value = row.getCell(2).value; // swap order no
        anotherRow.getCell(2).value = row.getCell(1).value; // to order time
        anotherRow.getCell(3).value = row.getCell(3).value;
        anotherRow.getCell(4).value = row.getCell(4).value;
        anotherRow.getCell(5).value = row.getCell(5).value;
        anotherRow.getCell(6).value = moneyFormat(Number(row.getCell(6).value));
        anotherRow.getCell(7).value = moneyFormat(Number(row.getCell(7).value));
        anotherRow.getCell(8).value = String(payment).includes("Transfer")
          ? DEBIT
          : payment;

        anotherRow.commit();

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
          case DEBITBCA:
            debitBca += Number(row.getCell(7));
            break;
          case DEBITMANDIRI:
            debitMandiri += Number(row.getCell(7));
            break;
          case DEBITBRI:
            debitBri += Number(row.getCell(7));
            break;
          default:
            cash += Number(row.getCell(7));
            break;
        }
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
      const lastRow = newWorksheet.actualRowCount - 1;
      // input total & label
      newWorksheet.getCell(`A${lastRow + 5}`).value = CASH;
      newWorksheet.getCell(`A${lastRow + 6}`).value = QR;
      newWorksheet.getCell(`A${lastRow + 7}`).value = DEBIT;
      newWorksheet.getCell(`A${lastRow + 8}`).value = DEBITBCA;
      newWorksheet.getCell(`A${lastRow + 9}`).value = DEBITMANDIRI;
      newWorksheet.getCell(`A${lastRow + 10}`).value = DEBITBRI;
      newWorksheet.getCell(`A${lastRow + 11}`).value = GOFOOD;
      newWorksheet.getCell(`A${lastRow + 12}`).value = "T O T A L";
      newWorksheet.getCell(`B${lastRow + 5}`).value = moneyFormat(cash);
      newWorksheet.getCell(`B${lastRow + 6}`).value = moneyFormat(qrPayment);
      newWorksheet.getCell(`B${lastRow + 7}`).value = moneyFormat(debitCard);
      newWorksheet.getCell(`B${lastRow + 8}`).value = moneyFormat(debitBca);
      newWorksheet.getCell(`B${lastRow + 9}`).value = moneyFormat(debitMandiri);
      newWorksheet.getCell(`B${lastRow + 10}`).value = moneyFormat(debitBri);
      newWorksheet.getCell(`B${lastRow + 11}`).value = moneyFormat(gofood);
      newWorksheet.getCell(`B${lastRow + 12}`).value = moneyFormat(
        cash +
          qrPayment +
          debitCard +
          debitBca +
          debitMandiri +
          debitBri +
          gofood
      );
      newWorksheet.getCell(`A${lastRow + 12}`).alignment = {
        horizontal: "right",
      };
      newWorksheet.getRow(lastRow + 12).font = { bold: true };
    }

    return workbook.xlsx.writeBuffer();
  } catch (error) {
    console.log("error: ", error);
  }
}
