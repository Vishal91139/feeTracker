import { asyncHandler } from './../utils/asyncHandler.js';
import { ApiError } from './../utils/ApiError.js';
import { pool } from '../db/db.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password) {
        throw new ApiError(400, 'Please provide all required fields');
    }

    const [admin] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if(!admin || admin.length === 0) {
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

const changePassword = asyncHandler(async (req, res) => {
    const { id } = req.user;
    const { oldPassword, newPassword } = req.body;

    if(!oldPassword || !newPassword) {
        throw new ApiError(400, 'Please provide all required fields');
    }

    const [admin] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);

    if(!admin || admin.length === 0) {
        throw new ApiError(400, '!invalid request, please login again');
    }

    const user = admin[0];

    if(oldPassword !== user.password) {
        throw new ApiError(400, 'Invalid password');
    }

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, id]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, 'Password changed successfully')
        );
});

export { loginAdmin, changePassword };