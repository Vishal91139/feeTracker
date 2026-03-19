import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express()

app.use(cors({
    origin: true,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import adminRouter from './routes/admin.routes.js'
import academicYearRouter from './routes/academic-year.routes.js'
import receiptRouter from './routes/receipts.routes.js'
import studentRouter from './routes/students.routes.js'
import studentAcademicsRouter from './routes/student-academics.routes.js'
import { ApiError } from './utils/ApiError.js'

app.use("/admin", adminRouter)
app.use("/academic-year", academicYearRouter)
app.use("/receipt", receiptRouter)
app.use("/student", studentRouter)
app.use("/student-academics", studentAcademicsRouter)

app.use((req, res, next) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`))
})

app.use((err, req, res, next) => {
    const statusCode = err?.statusCode || 500

    return res.status(statusCode).json({
        statusCode,
        data: null,
        message: err?.message || "Internal server error",
        success: false,
        errors: err?.errors || []
    })
})

export { app }