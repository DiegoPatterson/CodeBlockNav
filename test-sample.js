"use strict";
/**
 * Sample Test File - CodeBlock Navigator Demo
 *
 * This file demonstrates the BLOCK and SUBBLOCK syntax
 * to show how blocks appear in the sidebar tree view
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = exports.ApiController = exports.DatabaseService = exports.AuthService = void 0;
// BLOCK: Authentication System
class AuthService {
    // SUBBLOCK1: Login Handler
    async login(credentials) {
        // SUBBLOCK2: Validate Input
        const validation = validateCredentials(credentials);
        if (!validation.valid) {
            throw new Error('Invalid credentials');
        }
        // SUBBLOCK2: Query Database
        const user = await this.db.findUser(credentials.email);
        if (!user) {
            throw new Error('User not found');
        }
        // SUBBLOCK2: Compare Password
        const passwordMatch = await comparePassword(credentials.password, user.passwordHash);
        if (!passwordMatch) {
            throw new Error('Invalid password');
        }
        // SUBBLOCK2: Generate Token
        const token = this.generateToken(user);
        return { ...user, token };
    }
    // SUBBLOCK1: Logout Handler
    logout(userId) {
        // SUBBLOCK2: Clear Session
        this.sessionStore.delete(userId);
        // SUBBLOCK2: Invalidate Tokens
        this.tokenBlacklist.add(userId);
    }
    // SUBBLOCK1: Token Management
    generateToken(user) {
        // SUBBLOCK2: Create Payload
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };
        // SUBBLOCK2: Sign Token
        const token = jwt.sign(payload, process.env.JWT_SECRET);
        return token;
    }
}
exports.AuthService = AuthService;
// BLOCK: Database Layer
class DatabaseService {
    // SUBBLOCK1: Connection Management
    async connect() {
        // SUBBLOCK2: Initialize Pool
        this.pool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            database: process.env.DB_NAME
        });
        // SUBBLOCK2: Test Connection
        await this.pool.query('SELECT 1');
        console.log('Database connected');
    }
    // SUBBLOCK1: Query Builders
    async findUser(email) {
        // SUBBLOCK2: Build Query
        const query = 'SELECT * FROM users WHERE email = $1';
        // SUBBLOCK2: Execute Query
        const result = await this.pool.query(query, [email]);
        return result.rows[0] || null;
    }
    // SUBBLOCK1: Transaction Handlers
    async withTransaction(callback) {
        // SUBBLOCK2: Begin Transaction
        const client = await this.pool.connect();
        await client.query('BEGIN');
        try {
            // SUBBLOCK2: Execute Callback
            const result = await callback();
            // SUBBLOCK2: Commit
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            // SUBBLOCK2: Rollback
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            // SUBBLOCK2: Release Connection
            client.release();
        }
    }
}
exports.DatabaseService = DatabaseService;
// BLOCK: API Handlers
class ApiController {
    // SUBBLOCK1: Request Parsing
    parseBody(body) {
        // SUBBLOCK2: Validate JSON
        try {
            // SUBBLOCK3: Parse JSON
            return JSON.parse(body);
        }
        catch (e) {
            // SUBBLOCK3: Handle Parse Error
            throw new Error('Invalid JSON');
        }
    }
    // SUBBLOCK1: Response Formatting
    formatResponse(data, status = 200) {
        // SUBBLOCK2: Set Headers
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        };
        // SUBBLOCK2: Serialize Data
        const body = JSON.stringify(data);
        return {
            status,
            headers,
            body
        };
    }
    // SUBBLOCK1: Error Handling
    handleError(error) {
        // SUBBLOCK2: Log Error
        console.error(error);
        // SUBBLOCK2: Format Error Response
        return this.formatResponse({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, 500);
    }
}
exports.ApiController = ApiController;
// BLOCK: Utilities
class Utils {
    // SUBBLOCK1: String Operations
    static capitalize(str) {
        // SUBBLOCK2: Split and Transform
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    // SUBBLOCK1: Data Validation
    static isValidEmail(email) {
        // SUBBLOCK2: Email Regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
exports.Utils = Utils;
