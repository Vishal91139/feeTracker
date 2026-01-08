import { asyncHandler } from './../utils/asyncHandler.js';
import { ApiError } from './../utils/ApiError.js';
import { pool } from '../db/db.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import bcrypt from 'bcrypt';

const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password) {
        throw new ApiError(400, 'Please provide all required fields');
    }

    const [row] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if(!row || row.length === 0) {
        throw new ApiError(400, 'Invalid email');
    }

    const user = row[0];

    if(password !== user.password) {
        throw new ApiError(400, 'Invalid password');
    }

    delete(user.password);

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, 'Login successful')
        );
    
});

export { loginAdmin };