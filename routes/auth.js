import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { JWT_SECRET } from "../config.js";
import sendMail from "../utils/mailer.js";
const users = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data.json"), "utf-8"));

class AuthRouter {
    constructor() {
        this.router = Router();
        this.initializeRoutes();
    }

    initializeRoutes() {
        this.router.post("/login", this.login);
        this.router.post("/register", this.register);
        this.router.post("/forgot-password", this.forgotPassword);
        this.router.post("/reset-password", this.resetPassword);
    }

    async login(req, res) {
        const { email, password, rememberMe } = req.body;
        const user = users.find((user) => user.email === email);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: rememberMe ? '7d' : '1h'
        });
        res.json({
            message: "Login successful",
            token
        });
    }

    async register(req, res) {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = users.find((user) => user.email === email);
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: uuidv4(),
            username,
            email,
            password: hashedPassword,
            role: role || 'user',
            verified: false
        };

        users.push(newUser);
        fs.writeFileSync(path.join(process.cwd(), "data.json"), JSON.stringify(users, null, 2));

        res.status(201).json({ message: "User registered successfully" });
    }

    async forgotPassword(req, res) {
        console.log("Requête reçue :", req.body);
        const { email } = req.body;
        const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    
        if (!user) {
            console.log("Utilisateur non trouvé");
            return res.status(404).json({ message: "User not found" });
        }
    
        user.resetToken = uuidv4();
        fs.writeFileSync(path.join(process.cwd(), "data.json"), JSON.stringify(users, null, 2));
        console.log("Token généré :", user.resetToken);
    
        await sendMail(email, "Reset Password", `Your reset token: ${user.resetToken}`);
        res.json({ message: "Reset email sent" });
    }
    

    async resetPassword(req, res) {
        const { token, password } = req.body;
        const user = users.find(u => u.resetToken === token);

        if (!user) {
            return res.status(404).json({ message: "Invalid token" });
        }

        user.password = await bcrypt.hash(password, 10);
        delete user.resetToken;

        fs.writeFileSync(path.join(process.cwd(), "data.json"), JSON.stringify(users, null, 2));
        res.json({ message: "Password reset successful" });
    }
}

export default new AuthRouter().router;
