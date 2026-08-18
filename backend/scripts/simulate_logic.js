
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Worker from './models/Worker.js';

dotenv.config();

async function simulate() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Direct test of the internal logic we implemented
    const simulateRequest = async (adminView) => {
        let filter = {};
        const statusFilter = adminView === "true" ? {} : { status: "Active" };
        console.log(`Filter generated for adminView="${adminView}":`, { ...filter, ...statusFilter });
        const workers = await Worker.find({ ...filter, ...statusFilter });
        console.log(`Result count: ${workers.length}`);
        const blocked = workers.filter(w => w.status === 'Blocked');
        console.log(`Blocked workers in result: ${blocked.length}`);
    };

    console.log("--- SIMULATING USER CALL (no param) ---");
    await simulateRequest(undefined);

    console.log("--- SIMULATING ADMIN CALL (adminView='true') ---");
    await simulateRequest("true");

    process.exit(0);
}

simulate();
