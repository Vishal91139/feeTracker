import dotenv from "dotenv"
import connectDB from "./db/db.js";
import { app } from "./app.js";
import { asyncHandler } from "./utils/asyncHandler.js";

dotenv.config({
    path: '.env'
})

const startServer = asyncHandler(async(req, res) => {
    try {
        await connectDB()

        const server = app.listen(process.env.PORT,"0.0.0.0", () => {
            console.log(`🚀 Server running on port ${process.env.PORT}`);
        });

        server.on("error", (error) => {
            console.error("❌ Server error:", error);
            process.exit(1);
        });

    } catch (error) {
        console.error("❌ MySQL connection failed:", error);
        process.exit(1);
    }
});

startServer()
