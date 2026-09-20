import multer from "multer";

// set up multer with memory storage for handling file uploads
const storage = multer.memoryStorage();

export const upload = multer({ storage });
