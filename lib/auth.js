import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export async function createSession(userId) {
  try {
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    
    const session = await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });
    
    return session;
  } catch (error) {
    console.error('Database error in createSession:', error);
    if (error.code === 'P1001' || error.message.includes('connect')) {
      throw new Error('Database connection failed');
    }
    throw error;
  }
}

export async function validateSession(token) {
  if (!token) return null;
  
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    });
    
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return null;
    }
    
    return {
      session,
      user: session.user
    };
  } catch (error) {
    console.error('Database error in validateSession:', error);
    if (error.code === 'P1001' || error.message.includes('connect')) {
      throw new Error('Database connection failed');
    }
    throw error;
  }
}

export async function deleteSession(token) {
  if (!token) return;
  
  try {
    await prisma.session.deleteMany({
      where: { token }
    });
  } catch (error) {
    console.error('Database error in deleteSession:', error);
    if (error.code === 'P1001' || error.message.includes('connect')) {
      throw new Error('Database connection failed');
    }
    throw error;
  }
}

export async function authenticateUser(username, password) {
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user) return null;
    
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) return null;
    
    return {
      id: user.id,
      username: user.username,
      name: user.name
    };
  } catch (error) {
    console.error('Database error in authenticateUser:', error);
    if (error.code === 'P1001' || error.message.includes('connect')) {
      throw new Error('Database connection failed');
    }
    throw error;
  }
}

function generateSessionToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}