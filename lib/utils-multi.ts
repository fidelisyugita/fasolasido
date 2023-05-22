import Excel from "exceljs";
import { isNil, isEmpty } from "ramda";
import moment from "moment";

export function formatDate(txTime: any, format = "YYMMDD") {
  // const txDate = txTime?.slice(0, 10);
  // console.log("sliced txDate: ", txDate);
  // return moment(txDate, "YYYY-MM-DD").format(format);
  return moment(txTime).add("h", -7).format(format);
}

export function getHeader(date: string, format = "DD MMM YYYY") {
  if (isNil(date) || isEmpty(date)) null;
  return `GILASY.BELITUNG - ${moment(date, "YYMMDD").format(format)}`;
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

export async function modify(base64: string, percentage: number) {
  if (!percentage) percentage = 30;
  console.log("percentage: ", percentage);

  const workbook = new Excel.Workbook();

  const encoded = base64.replace(/^data:\w+\/\w+;base64,/, "");
  const fileBuffer = Buffer.from(encoded, "base64");

  try {
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];

    /**
     * prepare compression
     */
    let removeCount = 1; // in row
    let removeEvery = 1; // per row
    if (percentage < 10) percentage = 10;
    if (percentage > 90) percentage = 90;
    if (percentage < 50) {
      removeCount = parseInt(String((100 - percentage) / percentage));
    } else {
      removeEvery = parseInt(String(percentage / (100 - percentage)));
    }

    let newWorksheet;

    let total = 0;
    let rowCount = worksheet.actualRowCount;
    let i = 1;
    let sheetCounter = 4; // first cell in sheet
    while (i < rowCount) {
      const prevRow = worksheet.getRow(i);
      const row = worksheet.getRow(i + 1);

      const prevTxTime = prevRow.getCell(4).value;
      const txTime = row.getCell(4).value;

      const txDate = formatDate(txTime);

      if (!newWorksheet || txDate != formatDate(prevTxTime)) {
        if (newWorksheet) {
          const lastRow = newWorksheet.actualRowCount - 1;
          // input total & label
          newWorksheet.getCell(`B${lastRow + 3}`).value = "T O T A L";
          newWorksheet.getCell(`C${lastRow + 3}`).value = total;
          newWorksheet.getRow(lastRow + 3).font = { bold: true };

          total = 0;
        }

        newWorksheet = workbook.addWorksheet(txDate); // set new sheet
        sheetCounter = 4; // first cell in sheet

        /**
         * setup width
         */
        newWorksheet.columns = [
          { width: 14 },
          { width: 34 },
          { width: 14, style: { numFmt: '"Rp "#,###' } },
          { width: 16, style: { numFmt: "D MMM\\ h:mm\\ AM/PM" } },
          { width: 8 },
        ];

        /**
         * setup header
         * START
         */
        newWorksheet.mergeCells("A1", "E2");
        newWorksheet.getRow(1).font = { bold: true, size: 12 };
        newWorksheet.getRow(1).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        newWorksheet.getCell(`A1`).value = getHeader(txDate);

        newWorksheet.getRow(3).font = { bold: true };
        newWorksheet.getRow(3).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
        newWorksheet.getCell(`A3`).value = "Outlet";
        newWorksheet.getCell(`B3`).value = "Transaction ID";
        newWorksheet.getCell(`C3`).value = "Amount";
        newWorksheet.getCell(`D3`).value = "Time";
        newWorksheet.getCell(`E3`).value = "Payment";
        /**
         * setup header
         * END
         */
      }
      const anotherRow = newWorksheet?.getRow(sheetCounter);

      row.commit();

      anotherRow.getCell(1).value = row.getCell(1).value;
      anotherRow.getCell(2).value = row.getCell(2).value;
      anotherRow.getCell(3).value = row.getCell(3).value;
      anotherRow.getCell(4).value = row.getCell(4).value;
      anotherRow.getCell(5).value = row.getCell(5).value;
      anotherRow.commit();

      // count total
      total += Number(row.getCell(3));

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
      newWorksheet.getCell(`B${lastRow + 3}`).value = "T O T A L";
      newWorksheet.getCell(`C${lastRow + 3}`).value = total;
      newWorksheet.getRow(lastRow + 3).font = { bold: true };
    }

    return workbook.xlsx.writeBuffer();
  } catch (error) {
    console.log("error: ", error);
  }
}
