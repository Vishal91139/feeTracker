import { pool } from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addAcademicYear = asyncHandler(async(req, res) => {
    const { year } = req.body;
    const normalizedYear = String(year ?? "").trim();

    if(!normalizedYear) {
        throw new ApiError(400, "Academic year is required");
    }

    const [[existingYear]] = await pool.query(
        `SELECT id FROM academic_years WHERE LOWER(TRIM(year_name)) = LOWER(TRIM(?)) LIMIT 1`,
        [normalizedYear]
    );

    if(existingYear) {
        throw new ApiError(409, "Academic year already exists");
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            `UPDATE academic_years SET is_current = 0, is_active = 0`
        );

        const [row] = await connection.query(
            `INSERT INTO academic_years(year_name, is_current, is_active) VALUES(?,?,?)`,
            [normalizedYear, 1, 1]
        );

        await connection.commit();

        return res.status(201)
            .json(
                new ApiResponse(201, row, "Academic year added successfully")
            )
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
});

const getAllAcademicYears = asyncHandler(async(req, res) => {
    const [rows] = await pool.query(`SELECT * FROM academic_years ORDER BY year_name DESC, id DESC`);

    if(!rows || rows.length === 0) {
        throw new ApiError(404, "No academic years found");
    }

    return res.status(200)
        .json(
            new ApiResponse(200, rows, "Academic years fetched successfully")
        )
});

const deleteAcademicYearById = asyncHandler(async(req, res) => {
    const { id } = req.params;

    if(!id) {
        throw new ApiError(400, "Academic year id is required");
    }

    // Prevent deleting current or active year
    const [[year]] = await pool.query(
        `SELECT is_current, is_active FROM academic_years WHERE id = ?`, [id]
    );

    if(!year) {
        throw new ApiError(404, "Academic year not found");
    }

    if(year.is_current || year.is_active) {
        throw new ApiError(400, "Cannot delete the current or active academic year");
    }

    const [row] = await pool.query(`DELETE FROM academic_years WHERE id = ?`, [id]);

    return res.status(200)
        .json(
            new ApiResponse(200, row, "Academic year deleted successfully")
        )
});

const setActiveYear = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if(!id) {
        throw new ApiError(400, "Academic year id is required");
    }

    // Check year exists
    const [[year]] = await pool.query(
        `SELECT id FROM academic_years WHERE id = ?`, [id]
    );

    if(!year) {
        throw new ApiError(404, "Academic year not found");
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Keep one global active academic year for search/filter context.
        await connection.query(
            `UPDATE academic_years SET is_active = 0 WHERE id != ?`, [id]
        );

        await connection.query(
            `UPDATE academic_years SET is_active = ? WHERE id = ?`,
            [1, id]
        );

        await connection.commit();

        return res.status(200).json(
            new ApiResponse(200, null, "Academic year updated successfully")
        );

    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
});

export { 
    addAcademicYear,
    getAllAcademicYears,
    deleteAcademicYearById,
    setActiveYear    
};