import { pool } from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addAcademicYear = asyncHandler(async(req, res) => {
    const { year } = req.body;

    if(!year) {
        throw new ApiError(400, "Academic year is required");
    }

    const [row] = await pool.query(`INSERT INTO academic_years(year_name) VALUES(?)`, [year]);

    return res.status(201)
        .json(
            new ApiResponse(201, row, "Academic year added successfully")
        )
});

const getAllAcademicYears = asyncHandler(async(req, res) => {
    const [rows] = await pool.query(`SELECT * FROM academic_years`);

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
    const { is_current, is_active } = req.body;

    if(is_current === undefined && is_active === undefined) {
        throw new ApiError(400, "is_current or is_active is required");
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

        if(is_current === 1) {
            await connection.query(
                `UPDATE academic_years SET is_current = 0 WHERE id != ?`, [id]
            );
        }

        if(is_active === 1) {
            await connection.query(
                `UPDATE academic_years SET is_active = 0 WHERE id != ?`, [id]
            );
        }

        // Prevent unsetting if no other year is being set
        if(is_current === 0) {
            const [[current]] = await connection.query(
                `SELECT id FROM academic_years WHERE is_current = 1 AND id != ?`, [id]
            );
            if(!current) {
                throw new ApiError(400, "Cannot unset is_current. Set another year as current first.");
            }
        }

        if(is_active === 0) {
            const [[active]] = await connection.query(
                `SELECT id FROM academic_years WHERE is_active = 1 AND id != ?`, [id]
            );
            if(!active) {
                throw new ApiError(400, "Cannot unset is_active. Set another year as active first.");
            }
        }

        // Update the target row
        await connection.query(
            `UPDATE academic_years SET is_current = ?, is_active = ? WHERE id = ?`,
            [is_current, is_active, id]
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