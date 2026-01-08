import { pool } from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addAcademicYear = asyncHandler(async(req, res) => {
    const { year } = req.body;

    if(!year) {
        throw new ApiError(400, "Academic year is required");
    }

    const [row] = await pool.query(`Insert into academic_years(year_name) values(?)`, [year]);

    return res.status(201)
        .json(
            new ApiResponse(201, row, "Academic year added successfully")
        )
});

const getAcademicYears = asyncHandler(async(req, res) => {
    const [row] = await pool.query(`Select * from academic_years`,);

    return res.status(200)
        .json(
            new ApiResponse(200, row, "Academic years fetched successfully")
        )
});

export { addAcademicYear, getAcademicYears };