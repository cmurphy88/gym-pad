import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';

async function setupAuth() {
  try {
    // First check if we need to create a default user
    const existingUsers = await prisma.user.findMany();
    
    if (existingUsers.length === 0) {
      // Create default user
      const hashedPassword = await bcrypt.hash('password', 10);
      const defaultUser = await prisma.user.create({
        data: {
          email: 'conor@example.com',
          username: 'conormurphy',
          password: hashedPassword,
          name: 'Conor Murphy'
        }
      });
      
      console.log('Created default user:', defaultUser.username);
      
      // Update any existing workouts to associate with this user
      const existingWorkouts = await prisma.workout.findMany({
        where: {
          userId: null
        }
      });
      
      if (existingWorkouts.length > 0) {
        await prisma.workout.updateMany({
          where: {
            userId: null
          },
          data: {
            userId: defaultUser.id
          }
        });
        
        console.log(`Updated ${existingWorkouts.length} workouts to associate with default user`);
      }
    }
    
    console.log('Auth setup complete');
  } catch (error) {
    console.error('Error setting up auth:', error);
    throw error;
  }
}

setupAuth();