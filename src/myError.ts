export interface errorOptions {
    msg: string
    code: number
}
export default class MyError extends Error {
    name: string
    code: number
    constructor(options: errorOptions) {
        super(options.msg)
        this.name = 'MyError'
        this.code = options.code
        Error.captureStackTrace(this, this.constructor)
    }
}