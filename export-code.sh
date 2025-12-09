#!/bin/bash

# Export all code files to a markdown file
# Usage: ./export-code.sh [output-file]

OUTPUT_FILE="${1:-code-export.md}"

# Clear/create the output file
> "$OUTPUT_FILE"

echo "Exporting code to $OUTPUT_FILE..."

# Find all TypeScript files, excluding common non-source directories
find . \( \
    -name "node_modules" -o \
    -name ".next" -o \
    -name "dist" -o \
    -name "build" -o \
    -name "ui" -o \
    -name ".git" \
    -name "*.test.ts" \
\) -prune -o \( \
    -name "*.ts" -o \
    -name "*.tsx" \
\) -type f -print | sort | while read -r file; do
    # Get the relative path (remove leading ./)
    filepath="${file#./}"
    
    # Write the file path as h1 and the code in a code block
    echo "# $filepath" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "\`\`\`typescript" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "\`\`\`" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
done

echo "✅ Export complete! Check $OUTPUT_FILE"
