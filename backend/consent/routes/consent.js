const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { sendAuditLog } = require('../helpers/audit-client');

const router = express.Router();

router.post('/grant', async (req, res) => {
    try {
        const { citizenId, grantingDept, requestingDept, dataScope, purpose, expiresInDays } = req.body;
        
        if (!citizenId || !grantingDept || !requestingDept || !dataScope) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const id = uuidv4();
        const now = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 365));

        const stmt = req.db.prepare(`
            INSERT INTO consent_grants 
            (id, citizen_id, granting_dept, requesting_dept, data_scope, status, purpose, granted_at, expires_at, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            citizenId,
            grantingDept,
            requestingDept,
            dataScope,
            'ACTIVE',
            purpose || '',
            now.toISOString(),
            expiresAt.toISOString(),
            citizenId
        );

        // Audit log
        await sendAuditLog({
            action: 'CONSENT_GRANTED',
            entityType: 'CONSENT',
            entityId: id,
            actor: citizenId,
            actorRole: 'CITIZEN',
            department: grantingDept,
            metadata: JSON.stringify({ requestingDept, dataScope, purpose })
        });

        res.json({ success: true, consentId: id, status: 'ACTIVE', expiresAt });
    } catch (error) {
        console.error('Error granting consent:', error);
        res.status(500).json({ error: 'Failed to grant consent' });
    }
});

// Allow revoking via URL param to match frontend contract
router.post('/revoke/:id', async (req, res) => {
    req.body.consentId = req.params.id;
    await handleRevoke(req, res);
});

router.post('/revoke', async (req, res) => {
    await handleRevoke(req, res);
});

async function handleRevoke(req, res) {
    try {
        const { consentId } = req.body;
        
        if (!consentId) {
            return res.status(400).json({ error: 'Missing consentId' });
        }

        const row = req.db.prepare('SELECT * FROM consent_grants WHERE id = ?').get(consentId);
        console.log('Consent row before update:', row);

        const stmt = req.db.prepare(`
            UPDATE consent_grants 
            SET status = 'REVOKED', revoked_at = ?
            WHERE id = ? AND status = 'ACTIVE'
        `);

        const result = stmt.run(new Date().toISOString(), consentId);
        console.log('Update result:', result);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Consent not found or already revoked/expired' });
        }

        // Audit log
        await sendAuditLog({
            action: 'CONSENT_REVOKED',
            entityType: 'CONSENT',
            entityId: consentId,
            actor: 'SYSTEM', 
            actorRole: 'SYSTEM',
            department: 'SYSTEM',
            metadata: JSON.stringify({ reason: 'Revoked by user request' })
        });

        res.json({ success: true, message: 'Consent revoked successfully' });
    } catch (error) {
        console.error('Error revoking consent:', error);
        res.status(500).json({ error: 'Failed to revoke consent' });
    }
}

router.get('/check', (req, res) => {
    try {
        const { citizenId, grantingDept, requestingDept, dataScope } = req.query;

        if (!citizenId || !grantingDept || !requestingDept || !dataScope) {
            return res.status(400).json({ error: 'Missing required query parameters' });
        }

        const now = new Date().toISOString();

        const stmt = req.db.prepare(`
            SELECT id, expires_at FROM consent_grants 
            WHERE citizen_id = ? 
            AND granting_dept = ? 
            AND requesting_dept = ? 
            AND data_scope = ? 
            AND status = 'ACTIVE'
            AND expires_at > ?
            ORDER BY granted_at DESC LIMIT 1
        `);

        const consent = stmt.get(citizenId, grantingDept, requestingDept, dataScope, now);

        const accessGranted = consent ? 1 : 0;
        const reason = consent ? 'Active consent found' : 'No active consent found or expired';

        // Log access
        const logStmt = req.db.prepare(`
            INSERT INTO consent_access_log 
            (consent_id, accessing_dept, accessed_data, citizen_id, access_granted, reason, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        logStmt.run(
            consent ? consent.id : null,
            requestingDept,
            dataScope,
            citizenId,
            accessGranted,
            reason,
            new Date().toISOString()
        );

        if (consent) {
            return res.json({ granted: true, consentId: consent.id, expiresAt: consent.expires_at });
        } else {
            return res.json({ granted: false });
        }
    } catch (error) {
        console.error('Error checking consent:', error);
        res.status(500).json({ error: 'Failed to check consent' });
    }
});

router.get('/citizen/:citizenId', (req, res) => {
    try {
        const { citizenId } = req.params;
        const stmt = req.db.prepare(`SELECT * FROM consent_grants WHERE citizen_id = ? ORDER BY granted_at DESC`);
        const results = stmt.all(citizenId);
        res.json(results);
    } catch (error) {
        console.error('Error fetching citizen consents:', error);
        res.status(500).json({ error: 'Failed to fetch consents' });
    }
});

router.get('/citizen/:citizenId/log', (req, res) => {
    try {
        const { citizenId } = req.params;
        const stmt = req.db.prepare(`SELECT * FROM consent_access_log WHERE citizen_id = ? ORDER BY timestamp DESC`);
        const results = stmt.all(citizenId);
        res.json(results);
    } catch (error) {
        console.error('Error fetching consent logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

router.get('/stats', (req, res) => {
    try {
        const stats = {
            total: req.db.prepare('SELECT COUNT(*) as count FROM consent_grants').get().count,
            active: req.db.prepare("SELECT COUNT(*) as count FROM consent_grants WHERE status = 'ACTIVE'").get().count,
            revoked: req.db.prepare("SELECT COUNT(*) as count FROM consent_grants WHERE status = 'REVOKED'").get().count,
            expired: req.db.prepare("SELECT COUNT(*) as count FROM consent_grants WHERE status = 'EXPIRED'").get().count
        };
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

module.exports = router;
