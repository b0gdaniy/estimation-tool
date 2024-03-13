import hashlib
import os
import csv
import fnmatch

def calculate_sha3_256_hash(file_path):
    hasher = hashlib.sha3_256()
    with open(file_path, 'rb') as file:
        buf = file.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = file.read(65536)
    return hasher.hexdigest()

def count_code_lines(file_path):
    code_lines = 0
    in_block_comment = False
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            for line in file:
                stripped_line = line.strip()
                if stripped_line.startswith("/*"):
                    in_block_comment = True
                if in_block_comment and "*/" in stripped_line:
                    in_block_comment = False
                    stripped_line = stripped_line.split("*/")[-1]
                if not in_block_comment and not stripped_line.startswith("//") and stripped_line:
                    code_lines += 1
    except Exception as e:
        print(f"Error processing file {file_path}: {e}")
    return code_lines

def make_relative_path(path, start):
    rel_path = os.path.relpath(path, start=start)
    if not rel_path.startswith('.'):
        rel_path = f"./{rel_path}"
    return rel_path

def is_valid_file(file_name):
    valid_extensions = ['.sol', '.vy', '.rs']
    excluded_patterns = ['*.t.sol', '*.s.sol']

    for pattern in excluded_patterns:
        if fnmatch.fnmatch(file_name, pattern):
            return False

    return any(file_name.endswith(ext) for ext in valid_extensions)

def main(target_folder):
    base_folder = os.path.abspath(os.path.join(target_folder, os.pardir))
    output_filename = os.path.basename(os.path.normpath(target_folder)) + '_hash.csv'
    output_file = os.path.join(base_folder, output_filename)

    with open(output_file, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['File Path & SHA-3 Hash', 'Code Lines'])

        for root, dirs, files in os.walk(target_folder):
            for file in files:
                if not is_valid_file(file):
                    continue
                file_path = os.path.join(root, file)
                relative_file_path = make_relative_path(file_path, base_folder)
                hash_value = calculate_sha3_256_hash(file_path)
                code_lines = count_code_lines(file_path)
                combined_info = f"Path: {relative_file_path}\nSHA3: {hash_value}"
                writer.writerow([combined_info, code_lines])
                print(f"Processed file: {relative_file_path}")

if __name__ == "__main__":
    target_folder = input("Enter the path of the folder to count: ")
    main(target_folder)
