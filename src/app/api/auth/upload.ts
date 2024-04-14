import multer from 'multer';
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';

const upload = multer({ dest: 'public/images/' });

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    upload.single('file')(req, res, async (err: any) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        try {
            // Save form data to MySQL database
           console.log("req.body in api file",req.body)
            // Assuming you have a MySQL connection and a table named 'users'
            // await saveToDatabase(name, (req.file as Express.Multer.File).filename);

            return res.status(200).json({ message: 'File uploaded successfully!' });
        } catch (error) {
            console.error('Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    });
}

