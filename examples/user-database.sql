-- BLOCK: User Management Database

-- SUBBLOCK1: Table Creation

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    role_name VARCHAR(30),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- SUBBLOCK1: Stored Procedures

-- SUBBLOCK2: Create User Procedure

DELIMITER //
CREATE PROCEDURE create_user(
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100)
)
BEGIN
    -- SUBBLOCK3: Validate Input
    IF p_username IS NULL OR p_email IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Username and email are required';
    END IF;
    
    -- SUBBLOCK3: Insert User
    INSERT INTO users (username, email) 
    VALUES (p_username, p_email);
    
    -- SUBBLOCK3: Assign Default Role
    INSERT INTO user_roles (user_id, role_name)
    VALUES (LAST_INSERT_ID(), 'user');
END //
DELIMITER ;

-- SUBBLOCK2: Get User with Roles

DELIMITER //
CREATE PROCEDURE get_user_details(IN p_user_id INT)
BEGIN
    -- SUBBLOCK3: Fetch User Info
    SELECT u.user_id, u.username, u.email, u.created_at
    FROM users u
    WHERE u.user_id = p_user_id;
    
    -- SUBBLOCK3: Fetch User Roles
    SELECT r.role_name
    FROM user_roles r
    WHERE r.user_id = p_user_id;
END //
DELIMITER ;

-- SUBBLOCK1: Query Operations

-- SUBBLOCK2: Active Users Report

SELECT 
    u.username,
    u.email,
    GROUP_CONCAT(r.role_name) as roles
FROM users u
LEFT JOIN user_roles r ON u.user_id = r.user_id
GROUP BY u.user_id
ORDER BY u.created_at DESC;

-- SUBBLOCK2: User Statistics

SELECT 
    COUNT(*) as total_users,
    COUNT(DISTINCT r.user_id) as users_with_roles
FROM users u
LEFT JOIN user_roles r ON u.user_id = r.user_id;
