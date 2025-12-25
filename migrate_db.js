const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'work_dashboard.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Starting Migration...");

    // 1. Add new columns to reports table
    const columnsToAdd = [
        "ALTER TABLE reports ADD COLUMN active_status TEXT",
        "ALTER TABLE reports ADD COLUMN cinematography_log TEXT",
        "ALTER TABLE reports ADD COLUMN video_editing_log TEXT",
        "ALTER TABLE reports ADD COLUMN live_operating_log TEXT",
        "ALTER TABLE reports ADD COLUMN script_log TEXT"
    ];

    columnsToAdd.forEach(query => {
        db.run(query, (err) => {
            if (err) {
                // Ignore error if column likely exists
                console.log(`Note: ${err.message}`);
            } else {
                console.log(`Executed: ${query}`);
            }
        });
    });

    // 2. Create issues table
    db.run(`CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        title TEXT,
        is_solved INTEGER DEFAULT 0,
        solution TEXT
    )`, (err) => {
         if (err) console.error("Error creating issues table:", err);
         else console.log("Issues table ready.");
    });

    // 3. Create resources table
    db.run(`CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        title TEXT,
        url TEXT
    )`, (err) => {
         if (err) console.error("Error creating resources table:", err);
         else console.log("Resources table ready.");
    });
    
    // Wait a bit before closing to ensure async ops finish (simple approach for script)
    setTimeout(() => {
        db.close();
        console.log("Migration complete.");
    }, 2000);
});
