import { Request, Response } from "express";
import { supabase } from "../configs/supabase";

export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            console.error("Error signing up user:", error);
            return res.status(500).json({ error: "Internal server error" });
        }

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Error signing up user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (!data.session || error) {
            console.error("Error logging in user:", error);
            return res.status(401).json({ error: "Invalid login credentials" });
        }

        const token = {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
        };

        res.status(200).json({ message: "User logged in successfully", token });
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const token = req.user?.token;
        await supabase.auth.signOut(token);
        res.status(204).send();
    } catch (error) {
        console.error("Error logging out user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};