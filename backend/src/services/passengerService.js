const dbService = require('../domain-providers/dbService');

const toDomain = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        idCardType: row.id_card_type,
        idCardNumber: row.id_card_number,
        phone: row.phone,
        discountType: row.discount_type,
        verificationStatus: row.verification_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
};

const getPassengersByUserId = async (userId) => {
    const rows = dbService.all('SELECT * FROM passengers WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows.map(toDomain);
};

const searchPassengers = async (userId, query) => {
    const rows = dbService.all(
        'SELECT * FROM passengers WHERE user_id = ? AND name LIKE ?', 
        [userId, `%${query}%`]
    );
    return rows.map(toDomain);
};

const createPassenger = async (userId, passenger) => {
    const { name, idCardType, idCardNumber, phone, discountType, verificationStatus } = passenger;
    
    // Default values if not provided
    const type = idCardType || '二代居民身份证';
    const status = verificationStatus || '已通过'; // In real app, this might start as 'Pending'
    const discount = discountType || '成人';
    const phoneNumber = phone || null;

    const result = dbService.run(
        `INSERT INTO passengers (
            user_id, name, id_card_type, id_card_number, phone, discount_type, verification_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, name, type, idCardNumber, phoneNumber, discount, status]
    );

    return { 
        id: result.lastID,
        userId,
        ...passenger,
        idCardType: type,
        discountType: discount,
        verificationStatus: status,
        phone: phoneNumber
    };
};

const updatePassenger = async (userId, passengerId, passenger) => {
    const { name, idCardType, idCardNumber, phone, discountType, verificationStatus } = passenger;
    
    // Construct dynamic update query
    let fields = [];
    let params = [];

    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (idCardType !== undefined) { fields.push('id_card_type = ?'); params.push(idCardType); }
    if (idCardNumber !== undefined) { fields.push('id_card_number = ?'); params.push(idCardNumber); }
    if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
    if (discountType !== undefined) { fields.push('discount_type = ?'); params.push(discountType); }
    if (verificationStatus !== undefined) { fields.push('verification_status = ?'); params.push(verificationStatus); }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');

    if (fields.length === 1) { // Only updated_at
        return { success: true }; // Nothing to update
    }

    params.push(userId);
    params.push(passengerId);

    const result = dbService.run(
        `UPDATE passengers SET ${fields.join(', ')} WHERE user_id = ? AND id = ?`,
        params
    );

    return { success: result.changes > 0 };
};

const deletePassenger = async (userId, passengerId) => {
    const result = dbService.run(
        'DELETE FROM passengers WHERE user_id = ? AND id = ?',
        [userId, passengerId]
    );
    return { success: result.changes > 0 };
};

module.exports = {
    getPassengersByUserId,
    searchPassengers,
    createPassenger,
    updatePassenger,
    deletePassenger
};
