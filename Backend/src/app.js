import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pool } from './db/db.js';

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import adminRouter from './routes/admin.routes.js'
import academicYearRouter from './routes/academic-year.routes.js'

app.use("/admin", adminRouter)
app.use("/academic-year", academicYearRouter)

export { app }