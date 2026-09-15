const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const normalizedRoutes = require('./routes/normalized');

const app = express();
const PORT = 3011;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'adapter-a' });
});

// Normalized API routes using generic strategy pattern
app.use('/normalized', normalizedRoutes);

app.listen(PORT, () => {
  console.log(`Adapter A (Dept A Connector) listening on port ${PORT}`);
});
