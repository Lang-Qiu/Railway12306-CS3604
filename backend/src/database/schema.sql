-- Users
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100),
    name VARCHAR(50),
    id_card_number VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Passengers
CREATE TABLE IF NOT EXISTS passengers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    id_card_type VARCHAR(20) DEFAULT '二代居民身份证',
    id_card_number VARCHAR(30),
    phone VARCHAR(20),
    discount_type VARCHAR(20) DEFAULT '成人',
    verification_status VARCHAR(20) DEFAULT '已通过',
    seat_preference VARCHAR(20),
    special_needs VARCHAR(200),
    is_common BOOLEAN DEFAULT 1,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    train_id INT,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING (Confirmed Unpaid), PAID, CANCELLED, COMPLETED
    total_price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Order expiration time (created_at + 20 mins)
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (train_id) REFERENCES trains(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    passenger_id INT,
    seat_type_id INT,
    seat_no VARCHAR(20), -- Assigned seat number e.g., "01A"
    price DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (passenger_id) REFERENCES passengers(id),
    FOREIGN KEY (seat_type_id) REFERENCES seat_types(id)
);
