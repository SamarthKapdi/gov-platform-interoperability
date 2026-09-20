const express = require('express');
const { toXml, toXmlList } = require('../helpers/xml');
const router = express.Router();

module.exports = (db) => {
  // GET /registry/jobs
  router.get('/', (req, res) => {
    try {
      const jobs = db.prepare('SELECT * FROM job_applications').all();
      const transformed = jobs.map(job => ({
        ID: job.id,
        ApplicantID: job.applicant_id,
        JobRefNo: job.job_ref_no,
        JobTitle: job.job_title,
        Employer: job.employer,
        CurrentStatus: job.current_status,
        AppliedAt: job.applied_at,
        UpdatedAt: job.updated_at
      }));
      res.type('application/xml').send(toXmlList('JobApplications', 'JobApplication', transformed));
    } catch (err) {
      res.status(500).type('application/xml').send(toXml('Error', { Message: err.message }));
    }
  });

  // GET /registry/jobs/:applicant_id
  router.get('/:applicant_id', (req, res) => {
    try {
      const jobs = db.prepare('SELECT * FROM job_applications WHERE applicant_id = ?').all(req.params.applicant_id);
      const transformed = jobs.map(job => ({
        ID: job.id,
        ApplicantID: job.applicant_id,
        JobRefNo: job.job_ref_no,
        JobTitle: job.job_title,
        Employer: job.employer,
        CurrentStatus: job.current_status,
        AppliedAt: job.applied_at,
        UpdatedAt: job.updated_at
      }));
      res.type('application/xml').send(toXmlList('JobApplications', 'JobApplication', transformed));
    } catch (err) {
      res.status(500).type('application/xml').send(toXml('Error', { Message: err.message }));
    }
  });

  // PATCH /registry/jobs/:id/status
  router.patch('/:id/status', (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).type('application/xml').send(toXml('Error', { Message: 'Status is required' }));
      }
      
      const job = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(req.params.id);
      if (!job) {
        return res.status(404).type('application/xml').send(toXml('Error', { Message: 'Job application not found' }));
      }
      
      db.prepare('UPDATE job_applications SET current_status = ?, updated_at = ? WHERE id = ?').run(
        status, new Date().toISOString(), req.params.id
      );
      
      const updatedJob = db.prepare('SELECT * FROM job_applications WHERE id = ?').get(req.params.id);
      const transformed = {
        ID: updatedJob.id,
        ApplicantID: updatedJob.applicant_id,
        JobRefNo: updatedJob.job_ref_no,
        JobTitle: updatedJob.job_title,
        Employer: updatedJob.employer,
        CurrentStatus: updatedJob.current_status,
        AppliedAt: updatedJob.applied_at,
        UpdatedAt: updatedJob.updated_at
      };
      res.type('application/xml').send(toXml('JobApplication', transformed));
    } catch (err) {
      res.status(500).type('application/xml').send(toXml('Error', { Message: err.message }));
    }
  });

  return router;
};
