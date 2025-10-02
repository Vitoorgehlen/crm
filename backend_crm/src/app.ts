import express from 'express';
import cors from 'cors';
import type { Application } from 'express';
import superUserRoutes from './routes/superUserRoutes';
import companyRoutes from './routes/companyRoutes';
import commissionRoutes from './routes/commissionRoutes';
import rolePermissionRoutes from './routes/rolePermissionRoutes';
import userRoutes from './routes/userRoutes';
import clientsRoutes from './routes/clientsRoutes';
import dealRoutes from './routes/dealRoutes';
import documentationCostRoutes from './routes/documentationCostRoutes';
import noteRoutes from './routes/noteRoutes';
import dealShareRoutes from './routes/dealShareRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import tokenRoutes from './routes/tokenRoutes';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.app.use(cors({
      origin: 'http://localhost:3000',
      credentials: true
    }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
  }

  routes() {
    this.app.use('/', superUserRoutes);
    this.app.use('/', companyRoutes);
    this.app.use('/', rolePermissionRoutes);
    this.app.use('/', userRoutes);
    this.app.use('/', commissionRoutes);
    this.app.use('/', clientsRoutes);
    this.app.use('/', dealRoutes);
    this.app.use('/', documentationCostRoutes);
    this.app.use('/', noteRoutes);
    this.app.use('/', dealShareRoutes);
    this.app.use('/', scheduleRoutes);
    this.app.use('/', tokenRoutes);
  }
}

export default new App().app;
