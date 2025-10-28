import { ContactModel } from '../models/Contact';
import { Contact, ConsolidatedContact, IdentifyRequest } from '../types';

export class IdentityService {
  async identify(request: IdentifyRequest): Promise<ConsolidatedContact> {
    const { email, phoneNumber } = request;
    
    if (!email && !phoneNumber) {
      throw new Error('Either email or phoneNumber must be provided');
    }

    const existingContacts = await this.findMatchingContacts(email, phoneNumber);
    
    if (existingContacts.length === 0) {
      const newContact = await ContactModel.createPrimary(email, phoneNumber);
      return {
        primaryId: newContact.id,
        emails: newContact.email ? [newContact.email] : [],
        phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
        secondaryIds: []
      };
    }

    const primaryContact = this.findOldestPrimary(existingContacts);
    const linkedContacts = await this.getAllLinkedContacts(primaryContact.id);
    
    const hasNewInfo = this.shouldCreateSecondaryContact(linkedContacts, email, phoneNumber);
    
    if (hasNewInfo) {
      await ContactModel.createSecondary(email, phoneNumber, primaryContact.id);
      const updatedContacts = await this.getAllLinkedContacts(primaryContact.id);
      return this.consolidateContacts(updatedContacts);
    }

    return this.consolidateContacts(linkedContacts);
  }

  private async findMatchingContacts(email?: string, phoneNumber?: string): Promise<Contact[]> {
    const contacts: Contact[] = [];
    const seen = new Set<number>();

    if (email) {
      const emailContacts = await ContactModel.findByEmail(email);
      emailContacts.forEach(c => {
        if (!seen.has(c.id)) {
          contacts.push(c);
          seen.add(c.id);
        }
      });
    }

    if (phoneNumber) {
      const phoneContacts = await ContactModel.findByPhone(phoneNumber);
      phoneContacts.forEach(c => {
        if (!seen.has(c.id)) {
          contacts.push(c);
          seen.add(c.id);
        }
      });
    }

    return contacts;
  }

  private findOldestPrimary(contacts: Contact[]): Contact {
    const primaries = contacts.filter(c => c.linkPrecedence === 'primary');
    
    if (primaries.length > 0) {
      return primaries.reduce((oldest, current) => 
        new Date(oldest.createdAt) < new Date(current.createdAt) ? oldest : current
      );
    }

    const oldest = contacts.reduce((oldest, current) => 
      new Date(oldest.createdAt) < new Date(current.createdAt) ? oldest : current
    );

    ContactModel.updateLinkedId(oldest.id, oldest.id);
    return oldest;
  }

  private async getAllLinkedContacts(primaryId: number): Promise<Contact[]> {
    const allContacts: Contact[] = [];
    const toProcess = [primaryId];
    const processed = new Set<number>();

    while (toProcess.length > 0) {
      const currentId = toProcess.pop()!;
      
      if (processed.has(currentId)) continue;
      processed.add(currentId);

      const contact = await ContactModel.findById(currentId);
      if (contact) {
        allContacts.push(contact);
        
        const linked = await ContactModel.findByLinkedId(currentId);
        linked.forEach(c => {
          if (!processed.has(c.id)) {
            toProcess.push(c.id);
          }
        });
      }
    }

    return allContacts;
  }

  private shouldCreateSecondaryContact(
    existingContacts: Contact[],
    email?: string,
    phoneNumber?: string
  ): boolean {
    const emails = new Set(existingContacts.map(c => c.email).filter(Boolean));
    const phones = new Set(existingContacts.map(c => c.phoneNumber).filter(Boolean));

    if (email && !emails.has(email)) return true;
    if (phoneNumber && !phones.has(phoneNumber)) return true;

    return false;
  }

  private consolidateContacts(contacts: Contact[]): ConsolidatedContact {
    const primary = contacts.find(c => c.linkPrecedence === 'primary') || 
                   contacts.reduce((oldest, current) => 
                     new Date(oldest.createdAt) < new Date(current.createdAt) ? oldest : current
                   );

    const emails = [...new Set(contacts.map(c => c.email).filter(Boolean) as string[])];
    const phoneNumbers = [...new Set(contacts.map(c => c.phoneNumber).filter(Boolean) as string[])];
    const secondaryIds = contacts
      .filter(c => c.linkPrecedence === 'secondary')
      .map(c => c.id)
      .sort((a, b) => a - b);

    emails.sort((a, b) => {
      if (a === primary.email) return -1;
      if (b === primary.email) return 1;
      return a.localeCompare(b);
    });

    phoneNumbers.sort((a, b) => {
      if (a === primary.phoneNumber) return -1;
      if (b === primary.phoneNumber) return 1;
      return a.localeCompare(b);
    });

    return {
      primaryId: primary.id,
      emails,
      phoneNumbers,
      secondaryIds
    };
  }
}