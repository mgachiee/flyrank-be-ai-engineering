import { Request, Response, NextFunction } from "express";
import { supabase } from "../configs/supabase";

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(" ")[1]; // Extract token from "Bearer <token>"

        if (!token) {
            return res.status(401).json({ error: "Access token required" });
        }

        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            console.error("Error in authentication middleware:", error);
            return res.status(401).json({ error: "Invalid or expired token" });
        }

        req.user = data.user;
        req.user.token = token;
        next();
    } catch (error) {
        console.error("Error in authentication middleware:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};