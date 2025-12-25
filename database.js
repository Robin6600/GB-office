const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'work_dashboard.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

db.serialize(() => {
    // Create reports table
    db.run(`CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE,
        in_time TEXT,
        out_time TEXT,
        tasks TEXT,
        status TEXT,
        last_updated TEXT,
        active_status TEXT,
        cinematography_log TEXT,
        video_editing_log TEXT,
        live_operating_log TEXT,
        script_log TEXT
    )`);

    // Create projects table
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        category TEXT,
        description TEXT,
        created_at TEXT
    )`);

    // Create issues table
    db.run(`CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        title TEXT,
        is_solved INTEGER DEFAULT 0,
        solution TEXT
    )`);

    // Create resources table
    db.run(`CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        title TEXT,
        url TEXT
    )`);
});

module.exports = db;
