import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import * as glob from 'glob';

const validExtensions = ['.sol', '.vy', '.rs', '.move'];
const excludedPatterns = ['.*\\.t\\.sol$', '.*\\.s\\.sol$'];

function calculateSHA3_256Hash(fileContent: Buffer): string {
    return crypto.createHash('sha3-256').update(fileContent).digest('hex');
}

function countCodeLines(fileContent: string): number {
    const lines = fileContent.split('\n');
    let codeLines = 0;
    let inBlockComment = false;

    lines.forEach((line) => {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('/*')) {
            inBlockComment = true;
        }
        if (inBlockComment && trimmedLine.endsWith('*/')) {
            inBlockComment = false;
            return;
        }
        if (!inBlockComment && !trimmedLine.startsWith('//') && trimmedLine !== '') {
            codeLines++;
        }
    });

    return codeLines;
}

function isExcluded(file: string): boolean {
    return excludedPatterns.some((pattern) => new RegExp(pattern).test(file));
}

function formatCsvRow(filePath: string, hash: string, codeLines: number): string[] {
    const firstColumn = `Path: ${filePath}\nSHA3: ${hash}`;
    return [`"${firstColumn}"`, codeLines.toString()];
}

function processFiles(targetFolder: string, outputFile: string): void {
    const allFiles = glob.sync('**/*', { cwd: targetFolder, nodir: true });

    const data: string[] = ['File Path & SHA-3 Hash, Code Lines'];

    allFiles.forEach((file) => {
        const fullPath = path.join(targetFolder, file);

        if (isExcluded(file) || !validExtensions.includes(path.extname(file))) {
            return;
        }

        try {
            const relativePath = `./${file}`;

            const fileContent = fs.readFileSync(fullPath);
            const hash = calculateSHA3_256Hash(fileContent);
            const codeLines = countCodeLines(fileContent.toString());

            const csvRow = formatCsvRow(relativePath, hash, codeLines);

            data.push(csvRow.join(', '));
            console.log(`Processed file: ${file}`);
        } catch (error) {
            console.error(`Error processing file ${file}: ${error}`);
        }
    });

    fs.writeFileSync(outputFile, data.join('\n') + '\n');
}

const targetFolder = process.argv[2];
const baseFolder = path.dirname(targetFolder);
const outputFilename = `${path.basename(targetFolder)}_hash.csv`;
const outputFile = path.join(baseFolder, outputFilename);

processFiles(targetFolder, outputFile);
