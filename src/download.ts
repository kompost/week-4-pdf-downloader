import { ReadableStream } from 'stream/web'
import { Observable } from 'rxjs'

export default function downloadPdf(url: string): Observable<ReadableStream<Uint8Array>> {
    return new Observable<ReadableStream<Uint8Array>>((subscriber) => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 20000)
        fetch(url, { signal: controller.signal })
            .then((response) => {
                clearTimeout(timeoutId) // Clear the timeout if the request completes in time

                if (!response.ok)
                    subscriber.error(new Error(`Error: ${response.statusText} on ${url}`))

                if (!response.body)
                    subscriber.error(new Error(`Error: Response body is empty on ${url}`))


                const contentType = response.headers.get('Content-Type')
                if (contentType !== 'application/pdf')
                    subscriber.error(new Error(`Error: Invalid content type: ${contentType}. Expected application/pdf. on ${url}`))

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
