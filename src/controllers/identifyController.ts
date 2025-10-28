import { Request, Response } from 'express';
import { IdentityService } from '../services/IdentityService';
import { IdentifyRequest } from '../types';

const identityService = new IdentityService();

export async function identifyController(req: Request, res: Response): Promise<void> {
  try {
    const { email, phoneNumber }: IdentifyRequest = req.body;
    
    if (!email && !phoneNumber) {
      res.status(400).json({
        error: 'Either email or phoneNumber must be provided'
      });
      return;
    }

    const result = await identityService.identify({ email, phoneNumber });
    
    res.status(200).json({
      contact: {
        primaryContatctId: result.primaryId,
        emails: result.emails,
        phoneNumbers: result.phoneNumbers,
        secondaryContactIds: result.secondaryIds
      }
    });
  } catch (error) {
    console.error('Error in identify controller:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}