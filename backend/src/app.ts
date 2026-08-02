import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';
import apiRoutes from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing for the React Native/Expo frontend
app.use(cors());

// Middleware for parsing JSON payloads
app.use(express.json());

// Middleware for logging incoming requests
app.use((req, res, next) => {
  console.log(`[request] ${req.method} ${req.url} - body:`, JSON.stringify(req.body));
  next();
});

// Mount Swagger UI at /api-docs for route testing
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API base routing path
app.use('/api', apiRoutes);

// Simple healthcheck route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.listen(port, () => {
  console.log(`[server]: NirogApp Backend listening at http://localhost:${port}`);
});

export default app;
