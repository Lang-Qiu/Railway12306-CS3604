const db = require('../domain-providers/dbService');

const createOrder = async (userId, trainId, passengers) => {
    // TODO: Implement DB Transaction
    // 1. Check ticket availability (train_seats)
    // 2. Create order (orders)
    // 3. Create order items (order_items)
    // 4. Update seat availability (train_seats)
    
    // involved tables: orders, order_items, train_seats, trains, passengers
    
    // For now, simple insert for testing
    const result = db.run(
        `INSERT INTO orders (user_id, train_id, status, total_price, created_at) VALUES (?, ?, 'PENDING', ?, datetime('now'))`,
        [userId, trainId, 100.0] // Simplified price
    );
    const orderId = result.lastID;

    // Insert order items
    // passengers is array of { id, seatTypeId } (simplified)
    for (const p of passengers) {
         db.run(
            `INSERT INTO order_items (order_id, passenger_id, seat_type_id, seat_no, price) VALUES (?, ?, ?, '06车07D号', 50.0)`,
            [orderId, p.passengerId || 1, p.seatTypeId || 1] // Mock IDs
         );
    }

    return {
        orderId: orderId,
        status: 'PENDING',
        message: 'Order created successfully'
    };
};

const getOrderDetails = async (orderId) => {
    // 1. Get order info with train info
    const orderSql = `
        SELECT 
            o.id, o.status, o.total_price, o.created_at,
            t.train_no, t.start_time, t.end_time, t.type as train_type,
            s_start.name as start_station_name,
            s_end.name as end_station_name
        FROM orders o
        LEFT JOIN trains t ON o.train_id = t.id
        LEFT JOIN stations s_start ON t.start_station_id = s_start.id
        LEFT JOIN stations s_end ON t.end_station_id = s_end.id
        WHERE o.id = ?
    `;
    const order = db.get(orderSql, [orderId]);
    
    if (!order) return null;

    // 2. Get passengers (order items)
    const itemsSql = `
        SELECT 
            oi.price, oi.seat_no,
            p.name, p.id_card_type, p.id_card_number, p.discount_type,
            st.name as seat_type_name
        FROM order_items oi
        LEFT JOIN passengers p ON oi.passenger_id = p.id
        LEFT JOIN seat_types st ON oi.seat_type_id = st.id
        WHERE oi.order_id = ?
    `;
    const items = db.all(itemsSql, [orderId]);

    // 3. Format result
    return {
        id: order.id.toString(),
        status: order.status,
        created_at: order.created_at,
        expires_at: null, // TODO
        train: {
            trainNumber: order.train_no,
            startStation: { name: order.start_station_name },
            endStation: { name: order.end_station_name },
            startTime: order.start_time,
            endTime: order.end_time,
            startDate: '2025-12-05' // TODO: Store date in order or train
        },
        passengers: items.map(item => ({
            name: item.name,
            idType: item.id_card_type,
            idNumber: item.id_card_number,
            ticketType: item.discount_type || '成人票',
            seatType: item.seat_type_name,
            coachNumber: item.seat_no ? item.seat_no.split('车')[0] + '车' : '',
            seatNumber: item.seat_no,
            price: item.price,
            status: order.status === 'PAID' ? '已支付' : '待支付'
        })),
        total_price: order.total_price
    };
};

module.exports = {
    createOrder,
    getOrderDetails
};
