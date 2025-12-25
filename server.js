const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Reports Routes
app.get('/api/reports', (req, res) => {
    const { date } = req.query;
    if (date) {
        db.get('SELECT * FROM reports WHERE date = ?', [date], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(row || {});
        });
    } else {
        db.all('SELECT * FROM reports ORDER BY date DESC', [], (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    }
});

app.post('/api/reports', (req, res) => {
    const { date, in_time, out_time, tasks, status, active_status, cinematography_log, video_editing_log, live_operating_log, script_log } = req.body;
    const last_updated = new Date().toISOString();

    db.get('SELECT id FROM reports WHERE date = ?', [date], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (row) {
            // Update existing report
            db.run(
                `UPDATE reports SET in_time = ?, out_time = ?, tasks = ?, status = ?, active_status = ?, cinematography_log = ?, video_editing_log = ?, live_operating_log = ?, script_log = ?, last_updated = ? WHERE date = ?`,
                [in_time, out_time, tasks, status, active_status, cinematography_log, video_editing_log, live_operating_log, script_log, last_updated, date],
                function (err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({ message: 'Report updated', id: row.id });
                }
            );
        } else {
            // Insert new report
            db.run(
                `INSERT INTO reports (date, in_time, out_time, tasks, status, active_status, cinematography_log, video_editing_log, live_operating_log, script_log, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [date, in_time, out_time, tasks, status, active_status, cinematography_log, video_editing_log, live_operating_log, script_log, last_updated],
                function (err) {
                    if (err) {
                        console.log('Error insert', err);
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({ message: 'Report created', id: this.lastID });
                }
            );
        }
    });
});

// Issues Routes
app.get('/api/issues', (req, res) => {
    const { date } = req.query;
    let query = 'SELECT * FROM issues ORDER BY id DESC';
    let params = [];
    if (date) {
        query = 'SELECT * FROM issues WHERE date = ? ORDER BY id DESC';
        params = [date];
    }
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/issues', (req, res) => {
    const { date, title, is_solved, solution } = req.body;
    db.run(
        `INSERT INTO issues (date, title, is_solved, solution) VALUES (?, ?, ?, ?)`,
        [date, title, is_solved, solution],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Issue created', id: this.lastID });
        }
    );
});

app.put('/api/issues/:id', (req, res) => {
    const { id } = req.params;
    const { is_solved, solution } = req.body;
    db.run(
        `UPDATE issues SET is_solved = ?, solution = ? WHERE id = ?`,
        [is_solved, solution, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Issue updated', changes: this.changes });
        }
    );
});


// Resources Routes
app.get('/api/resources', (req, res) => {
    db.all('SELECT * FROM resources ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/resources', (req, res) => {
    const { type, title, url } = req.body;
    db.run(
        `INSERT INTO resources (type, title, url) VALUES (?, ?, ?)`,
        [type, title, url],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Resource added', id: this.lastID });
        }
    );
});

// Projects Routes
app.get('/api/projects', (req, res) => {
    db.all('SELECT * FROM projects ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/projects', (req, res) => {
    const { title, category, description } = req.body;
    const created_at = new Date().toISOString();

    db.run(
        `INSERT INTO projects (title, category, description, created_at) VALUES (?, ?, ?, ?)`,
        [title, category, description, created_at],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Project created', id: this.lastID });
        }
    );
});

app.delete('/api/projects/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM projects WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Project deleted', changes: this.changes });
    });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
