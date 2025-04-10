const mongoose = require('mongoose');
require('dotenv').config();

async function updateUserSchema() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crime-reporting');
        console.log('Connected to MongoDB');

        // Get the User collection
        const userCollection = mongoose.connection.collection('users');

        // Drop the existing username index
        await userCollection.dropIndex('username_1');
        console.log('Dropped existing username index');

        // Recreate the index without unique constraint
        await userCollection.createIndex({ username: 1 }, { sparse: true });
        console.log('Created new username index without unique constraint');

        console.log('Schema update completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
}

updateUserSchema(); 