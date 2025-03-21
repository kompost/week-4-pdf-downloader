import { readExcelFile } from './excelHandler'
import { join } from 'path'
import save from './save'
import download from './download'
import { from, mergeMap, catchError, EMPTY, of } from 'rxjs'


const filePathGRI = join(__dirname, '../data/GRI_2017_2020 (1).xlsx')
const sheetNameGRI = '0'

const filePathMetaData = join(__dirname, '../data/Metadata2006_2016.xlsx')
const sheetNameMetaData = 'Metadata2006_2016'

const GRI = readExcelFile(filePathGRI)
const metaData = readExcelFile(filePathMetaData)

const concurrency_limit = 75;

Promise
    .all([GRI, metaData])
    .then(([griWorkbook, metaDataWorkbook]) => {
        const griWorksheet = griWorkbook.getWorksheet(sheetNameGRI)
        const metaWorksheet = metaDataWorkbook.getWorksheet(sheetNameMetaData)

        if (!griWorksheet || !metaWorksheet)
            throw new Error('Sheets not found')

        const downloadList = new Map<string, { url1: string, url2: string, isDownloaded: 'yes' | 'no' }>()
        // Iterate over each row in the worksheet
        griWorksheet.eachRow(row => {
            const brNumber = row.getCell('A').value as string
            const url1 = row.getCell('AL').value as string
            const url2 = row.getCell('AM').value as string

            // Add the record to the download list, with isDownloaded as 'no'
            downloadList.set(brNumber, { url1, url2, isDownloaded: 'no' })
        })

        // Match all the records to see if they need download or be skipped
        metaWorksheet.eachRow(row => {
            const brNumber = row.getCell('A').value as string

            // if the file is logged, remove it from the download list
            const record = downloadList.get(brNumber)
            if (record)
                downloadList.delete(brNumber)
        })

        from(downloadList).pipe(
            mergeMap(([key, { url1, url2 }]) =>
                download(url1).pipe(
                    catchError(err => {
                        console.error(`primary url error: ${err.message}`);
                        return download(url2).pipe(
                            catchError(err => {
                                console.error(`secondary url: ${err.message}`);
                                return EMPTY;
                                // const lastRow = metaWorksheet.lastRow!.number + 1;
                                // const row = metaWorksheet.getRow(lastRow);
                                // row.getCell('A').value = key;  // Set column A
                                // row.getCell('AT').value = 'no'; // Set column AT
                                // row.commit();
                                // return saveExcelFileObservable(metaDataWorkbook, filePathMetaData).pipe(
                                //     catchError(saveErr => EMPTY),
                                //     mergeMap(() => EMPTY) // Ensure EMPTY is returned
                                // );
                            })
                        )
                    }),
                    mergeMap(pdfBuffer =>
                        save(pdfBuffer, `./downloads/${key}.pdf`).pipe(
                            catchError(err => EMPTY),
                            // mergeMap(_ => {
                            //     const lastRow = metaWorksheet.lastRow!.number + 1;
                            //     const row = metaWorksheet.getRow(lastRow);
                            //     row.getCell('A').value = key;  // Set column A
                            //     row.getCell('AT').value = 'yes'; // Set column AT
                            //     row.commit();
                            //     return from(saveExcelFile(metaDataWorkbook, filePathMetaData)).pipe(
                            //         catchError(_ => EMPTY),
                            //         mergeMap((filepath) => of(`saved ${filepath}`)) // Ensure EMPTY is returned
                            //     );
                            // })
                        ),
                    )
                ),
                concurrency_limit) // Limit concurrent downloads
        ).subscribe({
            next: result => console.log(result),
            complete: () => console.log('All records processed')
        });
    })
    .catch(err => console.error(err))

