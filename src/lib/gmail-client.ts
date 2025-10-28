interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    parts?: Array<{
      mimeType: string;
      body: {
        data: string;
      };
    }>;
  };
}

export interface Email {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  body: string;
  date: string;
}

export class GmailClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getRecentEmails(maxResults: number = 15): Promise<Email[]> {
    try {
      // First, get message IDs
      const listResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!listResponse.ok) {
        throw new Error('Failed to fetch emails list');
      }

      const listData = await listResponse.json();
      const messageIds = listData.messages?.map((msg: { id: string }) => msg.id) || [];

      // Then, get full message details for each
      const emailPromises = messageIds.map((id: string) => this.getMessage(id));
      const emails = await Promise.all(emailPromises);

      return emails.filter(Boolean) as Email[];
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  private async getMessage(messageId: string): Promise<Email | null> {
    try {
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) return null;

      const message: GmailMessage = await response.json();

      return {
        id: message.id,
        subject: this.getHeaderValue(message.payload.headers, 'Subject'),
        from: this.getHeaderValue(message.payload.headers, 'From'),
        snippet: message.snippet,
        body: this.extractBody(message.payload),
        date: this.getHeaderValue(message.payload.headers, 'Date'),
      };
    } catch (error) {
      console.error('Error fetching message:', error);
      return null;
    }
  }

  private getHeaderValue(headers: Array<{name: string; value: string}>, name: string): string {
    return headers.find(header => header.name === name)?.value || '';
  }

  private extractBody(payload: GmailMessage['payload']): string {
    if (payload.parts) {
      // Look for text/plain part
      const textPart = payload.parts.find(part => 
        part.mimeType === 'text/plain' && part.body.data
      );
      if (textPart) {
        return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }
    
    // If no parts or no text part, return snippet
    return '';
  }
}