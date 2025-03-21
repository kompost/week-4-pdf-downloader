import { ReadableStream, WritableStream } from 'stream/web'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { Observable } from 'rxjs'

function downloadPdf(url: string): Observable<ReadableStream<Uint8Array>> {
    return new Observable<ReadableStream<Uint8Array>>((subscriber) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 seconds timeout

        fetch(url, { signal: controller.signal })
            .then((response) => {
                clearTimeout(timeoutId) // Clear the timeout if the request completes in time

                if (!response.ok)
                    throw new Error(`Error: ${response.statusText} on ${url}`)

                if (!response.body)
                    throw new Error(`Error: Response body is empty on ${url}`)


                const contentType = response.headers.get('Content-Type')
                if (contentType !== 'application/pdf')
                    throw new Error(`Error: Invalid content type: ${contentType}. Expected application/pdf. on ${url}`)


                // Convert Web ReadableStream to Node.js Readable stream
                const webStream = response.body as ReadableStream<Uint8Array>
                subscriber.next(webStream)
                subscriber.complete()
            })
            .catch((error) => {
                if (error.name === 'AbortError')
                    subscriber.error(new Error(`Error: Request timed out on ${url}`))
                else
                    subscriber.error(error)

            })
    })
}

function saveFile(fileStream: ReadableStream, filepath: string): Observable<string> {
    return new Observable<string>((subscriber) => {
        // Ensure the directory exists
        const dir = dirname(filepath)
        if (!existsSync(dir))
            mkdirSync(dir, { recursive: true })


        const writeStream = createWriteStream(filepath)
        const writable = new WritableStream({
            write(chunk) {
                return new Promise((resolve, reject) => {
                    writeStream.write(chunk, (err) => (err ? reject(err) : resolve()))
                })
            },
            close() {
                writeStream.end()
                subscriber.next(`File saved to ${filepath}`)
                subscriber.complete()
            },
            abort(err) {
                subscriber.error(err)
            },
        })

        // Correct Web Streams piping
        fileStream.pipeTo(writable).catch((err) => subscriber.error(err))
    })
}

export { downloadPdf, saveFile }

