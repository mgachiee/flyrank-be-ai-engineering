import { Request, Response } from "express";

export const profile = async (req: Request, res: Response) => {
    try {
        // Validated by middleware
        const user = req.user;

        return res.status(200).json({ profile: user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const dashboard = async (req: Request, res: Response) => {
    try {
        res.status(200).json({ message: "Welcome to the dashboard! This is a protected route." });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};