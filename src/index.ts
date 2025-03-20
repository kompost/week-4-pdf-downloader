import { readExcelFile, saveExcelFile } from './excelHandler'
import { join } from 'path'
import { downloadPdf, saveFile } from './downloader'
import { from, mergeMap, catchError, EMPTY } from 'rxjs'


const filePathGRI = join(__dirname, '../data/GRI_2017_2020 (1).xlsx')
const sheetNameGRI = '0'

const filePathMetaData = join(__dirname, '../data/Metadata2006_2016.xlsx')
const sheetNameMetaData = 'Metadata2006_2016'

const GRI = readExcelFile(filePathGRI)
const metaData = readExcelFile(filePathMetaData)

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

        // Match all the records to see if they need download
        metaWorksheet.eachRow(row => {
            const brNumber = row.getCell('A').value as string
            const isDownloaded = row.getCell('AT').value as string

            // if the file does not exists in the downloadlist, it needs to be downloaded
            const record = downloadList.get(brNumber)
            if (!record)
                return

            downloadList.set(brNumber, { ...record, isDownloaded: isDownloaded === 'yes' ? 'yes' : 'no' })
        })

        const observable = from(downloadList).pipe(
            mergeMap(([key, { url1, url2 }]) =>
                downloadPdf(url1).pipe(
                    catchError(err => {
                        console.error(`Failed to download from primary URL: ${err.message}`)
                        return downloadPdf(url2)
                    }),
                    mergeMap(pdfBuffer =>
                        saveFile(pdfBuffer, `./downloads/${key}.pdf`).pipe(
                            catchError(err => {
                                console.error(`Failed to save file for ${key}: ${err.message}`)
                                return EMPTY // Skip this file but continue processing others
                            })
                        )
                    ),
                    catchError(err => {
                        console.error(`Failed to download from fallback URL: ${err.message}`)
                        return EMPTY // Skip this entry but continue processing others
                    })
                ), 9) // Limit concurrent downloads
        )

        observable.subscribe({
            next: result => console.log(result),
            complete: () => console.log('All records processed')
        })
    })
    .catch(err => console.error(err))

