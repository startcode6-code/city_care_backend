import { sql } from "drizzle-orm";
import { db } from "./index";

async function testConnection() {
    try {
        const result = await db.execute(sql`SELECT 1`);
        console.log(" ✅ Database connection successful:");
        
    } catch (error) {
        console.error("Error connecting to the database:", error);
    }
}

testConnection();