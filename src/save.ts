import { ReadableStream, WritableStream } from 'stream/web'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { Observable } from 'rxjs'

export default function save(fileStream: ReadableStream, filepath: string): Observable<string> {
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
                subscriber.next(filepath)
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
