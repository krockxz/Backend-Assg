import { Request, Response, NextFunction } from 'express';
import { IdentifyRequest } from '../types';

export function validateIdentifyRequest(req: Request, res: Response, next: NextFunction): void {
  const body = req.body;
  const { email, phoneNumber } = body;

  if (email !== undefined && typeof email !== 'string') {
    res.status(400).json({
      error: 'Email must be a string'
    });
    return;
  }

  if (phoneNumber !== undefined) {
    if (typeof phoneNumber === 'number') {
      req.body.phoneNumber = phoneNumber.toString();
    } else if (typeof phoneNumber !== 'string') {
      res.status(400).json({
        error: 'Phone number must be a string or number'
      });
      return;
    }
  }

  if (email && email.includes('@') === false) {
    res.status(400).json({
      error: 'Invalid email format'
    });
    return;
  }

  if (!email && !phoneNumber) {
    res.status(400).json({
      error: 'Either email or phoneNumber must be provided'
    });
    return;
  }

  next();
}