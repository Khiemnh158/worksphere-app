package com.worksphere.file.application;

/**
 * Utility for sanitizing original file names to prevent header injection and path traversal.
 */
public final class FilenameSanitizer {

    private static final int MAX_FILENAME_LENGTH = 255;
    private static final String DEFAULT_SAFE_FILENAME = "attachment";

    private FilenameSanitizer() {
        // Utility class
    }

    /**
     * Sanitizes an original filename by stripping paths, null bytes, CRLF, and control characters.
     *
     * @param originalName the raw name from the client
     * @return clean, safe basename
     */
    public static String sanitize(String originalName) {
        if (originalName == null || originalName.trim().isEmpty()) {
            return DEFAULT_SAFE_FILENAME;
        }

        // 1. Convert backslashes to slashes and take the basename
        String name = originalName.replace('\\', '/');
        int lastSlash = name.lastIndexOf('/');
        if (lastSlash >= 0) {
            name = name.substring(lastSlash + 1);
        }

        // 2. Remove null bytes, CRLF, and non-printable control characters
        name = name.replaceAll("[\\x00-\\x1F\\x7F]", "");

        // 3. Remove dangerous header characters such as quotes and semicolons if needed
        name = name.replace("\"", "").replace(";", "").trim();

        // 4. Remove leading/trailing dots or spaces
        while (name.startsWith(".") || name.startsWith(" ")) {
            name = name.substring(1).trim();
        }

        if (name.isEmpty()) {
            return DEFAULT_SAFE_FILENAME;
        }

        // 5. Truncate if exceeds MAX_FILENAME_LENGTH while preserving extension if possible
        if (name.length() > MAX_FILENAME_LENGTH) {
            int extDot = name.lastIndexOf('.');
            if (extDot > 0 && name.length() - extDot <= 20) {
                String ext = name.substring(extDot);
                name = name.substring(0, MAX_FILENAME_LENGTH - ext.length()) + ext;
            } else {
                name = name.substring(0, MAX_FILENAME_LENGTH);
            }
        }

        return name;
    }
}
