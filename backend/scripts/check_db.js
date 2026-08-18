import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Worker from './models/Worker.js';

dotenv.config();

async function check() {
    try {
        console.log("Connecting to Mongo...");
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/serviceApp");
        console.log("Finding all workers in db...");
        const workers = await Worker.find();
        console.log("Worker Count:", workers.length);
        workers.forEach(w => {
            if (w.status === 'Blocked') {
                console.log("--- BLOCKED WORKER OBJECT ---");
                console.log(JSON.stringify(w, null, 2));
            }
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
