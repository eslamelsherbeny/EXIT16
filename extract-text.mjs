import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// المجلدات التي سيتم البحث فيها (تأكد أنك تستخدم src/app أو app حسب مشروعك)
const DIRS_TO_SCAN = [path.join(__dirname, 'app'), path.join(__dirname, 'components')];
const OUTPUT_FILE = path.join(__dirname, 'dictionaries', 'extracted_ar.json');

// Regex للبحث عن الكلمات العربية
const arabicRegex = /[\u0600-\u06FF][\u0600-\u06FF\s0-9!؟.,؛:]*[\u0600-\u06FF]/g;

const extractedData = {};

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(arabicRegex);

      if (matches && matches.length > 0) {
        // تنظيف الكلمات المتكررة والفارغة
        const uniqueMatches = [...new Set(matches.map(m => m.trim()).filter(m => m.length > 1))];
        
        if (uniqueMatches.length > 0) {
          // استخدام اسم الملف كمفتاح رئيسي للتنظيم
          const fileName = path.basename(fullPath, '.tsx');
          extractedData[fileName] = {};
          
          uniqueMatches.forEach((match, index) => {
            // توليد مفتاح بالإنجليزية أو مفتاح رقمي للكلمة
            extractedData[fileName][`text_${index + 1}`] = match;
          });
        }
      }
    }
  });
}

DIRS_TO_SCAN.forEach(dir => {
  if (fs.existsSync(dir)) scanDirectory(dir);
});

// إنشاء المجلد إذا لم يكن موجوداً
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(extractedData, null, 2), 'utf8');
console.log('✅ تم سحب كل النصوص بنجاح إلى ملف dictionaries/extracted_ar.json');
