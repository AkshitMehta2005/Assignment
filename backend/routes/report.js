const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const {Readable} = require('stream');
const Report = require('../models/Report');
const schema = require('../gets_v0_1_schema.json'); // included in repo root
const {analyzeRows, normalizeHeader} = require('../utils/validate');
const {v4: uuidv4} = require('uuid');

const upload = multer({storage: multer.memoryStorage(), limits: {fileSize: 5 * 1024 * 1024}});

// POST /api/report/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const maxRows = parseInt(process.env.MAX_ROWS || '200', 10);
    let rows = [];
    let filename = req.file ? req.file.originalname : 'pasted.json';
    if(req.file && req.file.mimetype === 'application/json') {
      const data = JSON.parse(req.file.buffer.toString('utf8'));
      if(Array.isArray(data)) rows = data.slice(0, maxRows);
      else return res.status(400).json({error:'JSON must be an array of objects'});
    } else if(req.file && (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv'))) {
      // parse CSV from buffer
      const str = req.file.buffer.toString('utf8');
      await new Promise((resolve, reject)=>{
        const s = Readable.from([str]);
        s.pipe(csv())
         .on('data', (data)=> { if(rows.length < maxRows) rows.push(data); })
         .on('end', resolve)
         .on('error', reject);
      });
    } else if(req.body.paste) {
      // paste field contains JSON array or a single object
      const data = JSON.parse(req.body.paste);
      if(Array.isArray(data)) rows = data.slice(0, maxRows);
      else if(typeof data === 'object') rows = [data];
    } else {
      return res.status(400).json({error:'no file or paste provided'});
    }

    const analysis = analyzeRows(rows, schema);
    const report = new Report({
      originalFilename: filename,
      rowsSampled: rows.length,
      coverage: analysis.coverage,
      scores: analysis.scores,
      findings: analysis.findings
    });
    await report.save();
    res.json({id: report._id, report});
  } catch(err){
    console.error(err);
    res.status(500).json({error:err.message});
  }
});

// GET /api/report/:id
router.get('/:id', async (req, res) => {
  try {
    const r = await Report.findById(req.params.id);
    if(!r) return res.status(404).json({error:'not found'});
    res.json(r);
  } catch(err){ res.status(500).json({error:'server'}); }
});

module.exports = router;
