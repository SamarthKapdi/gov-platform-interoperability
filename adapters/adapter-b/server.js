const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const normalizedRoutes = require('./routes/normalized');

const app = express();
const PORT = process.env.PORT || 3012;

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'adapter-b' });
});

app.use('/normalized', normalizedRoutes);

app.listen(PORT, () => {
  console.log(`Adapter B running on port ${PORT}`);
});
