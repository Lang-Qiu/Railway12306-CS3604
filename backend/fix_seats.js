const db = require('./src/domain-providers/dbService');
const databaseManager = require('./src/infra-config/database');

async function fixSeats() {
    await databaseManager.initDatabase();
    
    // 1. Ensure seat types exist
    const seatTypes = [
        { name: '二等座', code: 'O' },
        { name: '一等座', code: 'M' },
        { name: '商务座', code: '9' },
        { name: '无座', code: 'W' },
        { name: '硬座', code: '1' },
        { name: '硬卧', code: '3' },
        { name: '软卧', code: '4' },
        { name: '动卧', code: 'F' }
    ];

    console.log('Checking seat types...');
    for (const st of seatTypes) {
        const existing = db.get('SELECT id FROM seat_types WHERE name = ?', [st.name]);
        if (!existing) {
            console.log(`Adding missing seat type: ${st.name}`);
            db.run('INSERT INTO seat_types (name, code) VALUES (?, ?)', [st.name, st.code]);
        }
    }

    // Reload seat types map
    const allSeatTypes = db.all('SELECT * FROM seat_types');
    const typeMap = {};
    allSeatTypes.forEach(t => typeMap[t.name] = t.id);

    // 2. Fix missing train seats
    const trains = db.all('SELECT * FROM trains');
    console.log(`Checking ${trains.length} trains for missing seats...`);

    for (const train of trains) {
        // Define price mapping based on train columns
        const seatConfig = [
            { type: '商务座', price: train.business_price, count: 20 },
            { type: '一等座', price: train.first_class_price, count: 50 },
            { type: '二等座', price: train.second_class_price, count: 500 },
            { type: '无座', price: train.no_seat_price, count: 100 },
            { type: '硬座', price: train.hard_seat_price || 0, count: 200 }, // Assuming hard_seat might be missing in schema but logic holds
            { type: '硬卧', price: train.hard_sleeper_price, count: 100 },
            { type: '软卧', price: train.soft_sleeper_price, count: 50 },
            { type: '动卧', price: train.dong_sleeper_price, count: 40 }
        ];

        for (const config of seatConfig) {
            if (config.price && config.price > 0) {
                const typeId = typeMap[config.type];
                if (!typeId) continue;

                const existingSeat = db.get(
                    'SELECT id FROM train_seats WHERE train_id = ? AND seat_type_id = ?',
                    [train.id, typeId]
                );

                if (!existingSeat) {
                    console.log(`Adding missing ${config.type} for train ${train.train_no}`);
                    db.run(
                        'INSERT INTO train_seats (train_id, seat_type_id, price, total_count, available_count) VALUES (?, ?, ?, ?, ?)',
                        [train.id, typeId, config.price, config.count, config.count]
                    );
                }
            }
        }
    }
    
    databaseManager.saveDatabase();
    console.log('Fix completed.');
}

fixSeats().catch(console.error);
