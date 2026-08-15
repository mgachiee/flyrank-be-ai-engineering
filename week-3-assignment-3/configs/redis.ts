import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

export const connectRedis = async (): Promise<void> => {
    try {
        await redisClient.connect();
        const response = await redisClient.ping();
        console.log(`Redis connection established! PING returned: ${response}`);
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        throw error; 
    }
};

export default redisClient;