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
        seatPreference: row.seat_preference,
        specialNeeds: row.special_needs,
        isCommon: row.is_common,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
};

const getPassengersByUserId = async (userId) => {
    const rows = dbService.all('SELECT * FROM passengers WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows.map(toDomain);
};

const getPassengerById = async (id) => {
    const row = dbService.get('SELECT * FROM passengers WHERE id = ?', [id]);
    return toDomain(row);
};

const searchPassengers = async (userId, query) => {
    const rows = dbService.all(
        'SELECT * FROM passengers WHERE user_id = ? AND name LIKE ?', 
        [userId, `%${query}%`]
    );
    return rows.map(toDomain);
};

const createPassenger = async (userId, passenger) => {
    const { name, idCardType, idCardNumber, phone, discountType, verificationStatus, seatPreference, specialNeeds, isCommon } = passenger;
    
    // Default values if not provided
    const type = idCardType || '二代居民身份证';
    const status = verificationStatus || '已通过'; 
    const discount = discountType || '成人';
    const phoneNumber = phone || null;
    const sPreference = seatPreference || '无偏好';
    const sNeeds = specialNeeds || '';
    const common = isCommon !== undefined ? isCommon : 1;

    const result = dbService.run(
        `INSERT INTO passengers (
            user_id, name, id_card_type, id_card_number, phone, discount_type, verification_status, seat_preference, special_needs, is_common, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [userId, name, type, idCardNumber, phoneNumber, discount, status, sPreference, sNeeds, common]
    );

    return { 
        id: result.lastID,
        userId,
        ...passenger,
        idCardType: type,
        discountType: discount,
        verificationStatus: status,
        phone: phoneNumber,
        seatPreference: sPreference,
        specialNeeds: sNeeds,
        isCommon: common,
        version: 1
    };
};

const updatePassenger = async (userId, passengerId, passenger, currentVersion) => {
    const { name, idCardType, idCardNumber, phone, discountType, verificationStatus, seatPreference, specialNeeds, isCommon } = passenger;
    
    // Construct dynamic update query
    let fields = [];
    let params = [];

    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (idCardType !== undefined) { fields.push('id_card_type = ?'); params.push(idCardType); }
    if (idCardNumber !== undefined) { fields.push('id_card_number = ?'); params.push(idCardNumber); }
    if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
    if (discountType !== undefined) { fields.push('discount_type = ?'); params.push(discountType); }
    if (verificationStatus !== undefined) { fields.push('verification_status = ?'); params.push(verificationStatus); }
    if (seatPreference !== undefined) { fields.push('seat_preference = ?'); params.push(seatPreference); }
    if (specialNeeds !== undefined) { fields.push('special_needs = ?'); params.push(specialNeeds); }
    if (isCommon !== undefined) { fields.push('is_common = ?'); params.push(isCommon); }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    fields.push('version = version + 1'); // Increment version

    if (fields.length === 2) { // Only updated_at and version
        return { success: true }; 
    }

    params.push(userId);
    params.push(passengerId);
    
    let sql = `UPDATE passengers SET ${fields.join(', ')} WHERE user_id = ? AND id = ?`;
    
    if (currentVersion !== undefined) {
        sql += ' AND version = ?';
        params.push(currentVersion);
    }

    const result = dbService.run(sql, params);

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
    getPassengerById,
    searchPassengers,
    createPassenger,
    updatePassenger,
    deletePassenger
};
