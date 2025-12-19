// Mock Service
const getPassengersByUserId = async (userId) => {
    // TODO: Implement DB access
    // involved tables: passengers
    return [
        { id: 1, name: '王小明', type: '成人', id_type: '居民身份证', id_no: '3301************678' },
        { id: 2, name: '李小红', type: '成人', id_type: '居民身份证', id_no: '1101************789' }
    ];
};

const searchPassengers = async (userId, query) => {
    // TODO: Implement DB access
    return [];
};

module.exports = {
    getPassengersByUserId,
    searchPassengers
};
