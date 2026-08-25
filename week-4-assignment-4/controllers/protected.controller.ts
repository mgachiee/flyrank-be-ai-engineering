import { Request, Response } from "express";
import { supabase } from "../configs/supabase";

export const profile = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(" ")[1]; // Extract token from "Bearer <token>"

        if (!token) {
            return res.status(401).json({ error: "Access token required" });
        }

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            console.error("Error fetching user profile:", error);
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        return res.status(200).json({ profile: data.user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};