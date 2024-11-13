import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../../../data/data.json');

const readData = () => {
  try {
      const data = fs.readFileSync(filePath, 'utf-8');
      if (!data) {
        return [];
    }
      return JSON.parse(data);
  } catch (error) {
      if (error.code === 'ENOENT') {
          return [];
      } else {
          throw error;
      }
  }
};
export default readData;