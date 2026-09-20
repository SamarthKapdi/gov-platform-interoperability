const express = require('express');
const { toXml, toXmlList } = require('../helpers/xml');
const router = express.Router();

module.exports = (db) => {
  // GET /registry/applicants
  router.get('/', (req, res) => {
    try {
      const applicants = db.prepare('SELECT * FROM applicants').all();
      // Transform keys to PascalCase for XML
      const transformed = applicants.map(app => ({
        ApplicantID: app.applicant_id,
        FullName: app.full_name,
        DOB: app.dob,
        Phone: app.phone,
        Email: app.email,
        Address: app.address,
        RegisteredAt: app.registered_at
      }));
      res.type('application/xml').send(toXmlList('Applicants', 'Applicant', transformed));
    } catch (err) {
      res.status(500).type('application/xml').send(toXml('Error', { Message: err.message }));
    }
  });

  // GET /registry/applicants/:applicant_id
  router.get('/:applicant_id', (req, res) => {
    try {
      const applicant = db.prepare('SELECT * FROM applicants WHERE applicant_id = ?').get(req.params.applicant_id);
      if (!applicant) {
        return res.status(404).type('application/xml').send(toXml('Error', { Message: 'Applicant not found' }));
      }
      const transformed = {
        ApplicantID: applicant.applicant_id,
        FullName: applicant.full_name,
        DOB: applicant.dob,
        Phone: applicant.phone,
        Email: applicant.email,
        Address: applicant.address,
        RegisteredAt: applicant.registered_at
      };
      res.type('application/xml').send(toXml('Applicant', transformed));
    } catch (err) {
      res.status(500).type('application/xml').send(toXml('Error', { Message: err.message }));
    }
  });

  
  router.post('/', (req, res) => {
    try {
      const { ApplicantID, FullName, DOB, Phone, Email, Address } = req.body;
      const now = new Date().toISOString();
      const stmt = db.prepare('INSERT INTO applicants (applicant_id, full_name, dob, phone, email, address, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
      stmt.run(ApplicantID, FullName, DOB, Phone, Email, Address, now);
      res.status(201).type('application/xml').send('<Success>True</Success>');
    } catch (error) {
      res.status(500).type('application/xml').send('<Error><Message>' + error.message + '</Message></Error>');
    }
  });

  return router;
};
