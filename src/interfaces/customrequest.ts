// custom.d.ts
import * as express from 'express';
express
declare global {
  namespace Express {
    interface Request {
      customData?: any;  // Add your custom properties here
    }
  }
}
