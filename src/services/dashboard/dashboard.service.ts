
import { count } from "drizzle-orm";

import { db } from "../../db";
import { doctors } from "../../db/schema/doctor";
import { service } from "../../db/schema/service";
import { appointment } from "../../db/schema/appointment";
import { blog } from "../../db/schema/blog";
import { youtubeVideo } from "../../db/schema/youtube-video";

export const getDashboardStatsService = async () => {
    try {
        const [
            doctorCount,
            serviceCount,
            appointmentCount,
            blogCount,
            videoCount,
        ] = await Promise.all([
            db.select({ total: count() }).from(doctors),
            db.select({ total: count() }).from(service),
            db.select({ total: count() }).from(appointment),
            db.select({ total: count() }).from(blog),
            db.select({ total: count() }).from(youtubeVideo),
        ]);

        return {
            totalDoctors: doctorCount[0]?.total ?? 0,
            totalServices: serviceCount[0]?.total ?? 0,
            totalAppointments: appointmentCount[0]?.total ?? 0,
            totalBlogs: blogCount[0]?.total ?? 0,
            totalVideos: videoCount[0]?.total ?? 0,
        };
    } catch (error) {
        console.error("Dashboard Stats Error:", error);

        if (error instanceof Error) {
            console.error("Original DB Error:", error.cause);
        }

        throw error;
    }
};
