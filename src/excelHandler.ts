import * as ExcelJs from 'exceljs';

export async function readExcelFile(filePath: string): Promise<ExcelJs.Workbook> {
    const workbook = new ExcelJs.Workbook();
    return workbook.xlsx.readFile(filePath)
}

export async function saveExcelFile(workbook: ExcelJs.Workbook, filePath: string): Promise<void> {
    return workbook.xlsx.writeFile(filePath);
}

