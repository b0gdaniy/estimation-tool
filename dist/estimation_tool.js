"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const glob = __importStar(require("glob"));
const validExtensions = ['.sol', '.vy', '.rs'];
const excludedPatterns = ['.*\\.t\\.sol$', '.*\\.s\\.sol$'];
function calculateSHA3_256Hash(fileContent) {
    return crypto_1.default.createHash('sha3-256').update(fileContent).digest('hex');
}
function countCodeLines(fileContent) {
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
function isExcluded(file) {
    return excludedPatterns.some((pattern) => new RegExp(pattern).test(file));
}
function formatCsvRow(filePath, hash, codeLines) {
    const firstColumn = `Path: ${filePath}\nSHA3: ${hash}`;
    return [`"${firstColumn}"`, codeLines.toString()];
}
function processFiles(targetFolder, outputFile) {
    const allFiles = glob.sync('**/*', { cwd: targetFolder, nodir: true });
    const data = ['File Path & SHA-3 Hash, Code Lines'];
    allFiles.forEach((file) => {
        const fullPath = path_1.default.join(targetFolder, file);
        if (isExcluded(file) || !validExtensions.includes(path_1.default.extname(file))) {
            return;
        }
        try {
            const relativePath = `./${file}`;
            const fileContent = fs_extra_1.default.readFileSync(fullPath);
            const hash = calculateSHA3_256Hash(fileContent);
            const codeLines = countCodeLines(fileContent.toString());
            const csvRow = formatCsvRow(relativePath, hash, codeLines);
            data.push(csvRow.join(', '));
            console.log(`Processed file: ${file}`);
        }
        catch (error) {
            console.error(`Error processing file ${file}: ${error}`);
        }
    });
    fs_extra_1.default.writeFileSync(outputFile, data.join('\n') + '\n');
}
const targetFolder = process.argv[2];
const baseFolder = path_1.default.dirname(targetFolder);
const outputFilename = `${path_1.default.basename(targetFolder)}_hash.csv`;
const outputFile = path_1.default.join(baseFolder, outputFilename);
processFiles(targetFolder, outputFile);
