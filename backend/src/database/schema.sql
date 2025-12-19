-- Orders
CREATE TABLE orders (
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

CREATE TABLE order_items (
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
