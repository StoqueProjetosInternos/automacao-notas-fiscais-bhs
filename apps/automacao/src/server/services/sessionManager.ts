import { randomUUID } from 'crypto';

interface Session {
  id: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
  expiresAt: number;
}

// 30 minutos de inatividade do lado do servidor
const SESSION_TTL = 30 * 60 * 1000;

class SessionManager {
  private sessions = new Map<string, Session>();

  public createSession(user: { name: string; email: string; role: string }): string {
    const sessionId = `stoque-session-${randomUUID()}`;
    const expiresAt = Date.now() + SESSION_TTL;
    this.sessions.set(sessionId, { id: sessionId, user, expiresAt });
    console.log(`[SESSION] Sessão criada: ${sessionId}. Expira em: ${new Date(expiresAt).toLocaleTimeString()}`);
    return sessionId;
  }

  public validateSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      console.log(`[SESSION] Sessão expirada por tempo limite: ${sessionId}`);
      this.sessions.delete(sessionId);
      return null;
    }

    // Slide-expiration: estende a sessão a cada requisição válida
    session.expiresAt = Date.now() + SESSION_TTL;
    return session;
  }

  public destroySession(sessionId: string): void {
    if (this.sessions.delete(sessionId)) {
      console.log(`[SESSION] Sessão destruída voluntariamente: ${sessionId}`);
    }
  }

  constructor() {
    // Limpeza periódica em background a cada 10 minutos
    setInterval(() => {
      const now = Date.now();
      for (const [id, session] of this.sessions.entries()) {
        if (now > session.expiresAt) {
          this.sessions.delete(id);
          console.log(`[SESSION] Limpeza de sessão expirada por inatividade: ${id}`);
        }
      }
    }, 10 * 60 * 1000);
  }
}

export const sessionManager = new SessionManager();
