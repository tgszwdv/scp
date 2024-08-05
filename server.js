const express = require('express');
const fs = require('fs');
const scrape = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/update-data', async (req, res) => {
    await scrape();
    res.json({ message: 'Data updated successfully' });
});

app.get('/get-data', (req, res) => {
    const data = fs.readFileSync('processos.json', 'utf8');
    res.json(JSON.parse(data));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
