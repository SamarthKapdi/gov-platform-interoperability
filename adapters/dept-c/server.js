const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const normalizedRoutes = require('./routes/normalized');

const app = express();
const PORT = process.env.PORT || 3013;

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'adapter-c' });
});

// Normalized endpoints
app.use('/normalized', normalizedRoutes);

app.listen(PORT, () => {
  console.log(`Adapter C listening on port ${PORT}`);
});
