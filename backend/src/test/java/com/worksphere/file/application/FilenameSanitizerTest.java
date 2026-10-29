package com.worksphere.file.application;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FilenameSanitizerTest {

    @Test
    @DisplayName("Strips relative path traversal with forward slashes")
    void shouldStripForwardSlashTraversal() {
        String result = FilenameSanitizer.sanitize("../../file.pdf");
        assertThat(result).isEqualTo("file.pdf");
    }

    @Test
    @DisplayName("Strips relative path traversal with backslashes")
    void shouldStripBackslashTraversal() {
        String result = FilenameSanitizer.sanitize("..\\..\\file.pdf");
        assertThat(result).isEqualTo("file.pdf");
    }

    @Test
    @DisplayName("Strips absolute Windows drive letter and path")
    void shouldStripWindowsDriveLetter() {
        String result = FilenameSanitizer.sanitize("C:\\temp\\file.pdf");
        assertThat(result).isEqualTo("file.pdf");
    }

    @Test
    @DisplayName("Strips Unix absolute root path")
    void shouldStripUnixAbsolutePath() {
        String result = FilenameSanitizer.sanitize("/etc/passwd");
        assertThat(result).isEqualTo("passwd");
    }

    @Test
    @DisplayName("Strips CRLF and header injection characters")
    void shouldStripCRLF() {
        String result = FilenameSanitizer.sanitize("file\r\nX-Test: injected.pdf");
        assertThat(result).doesNotContain("\r").doesNotContain("\n");
        assertThat(result).isEqualTo("fileX-Test: injected.pdf");
    }

    @Test
    @DisplayName("Preserves valid UTF-8 Vietnamese Unicode filenames")
    void shouldPreserveUnicode() {
        String unicodeName = "báo_cáo_tiến_độ_dự_án.pdf";
        String result = FilenameSanitizer.sanitize(unicodeName);
        assertThat(result).isEqualTo(unicodeName);
    }

    @Test
    @DisplayName("Handles double extension safely as a simple filename")
    void shouldHandleDoubleExtension() {
        String result = FilenameSanitizer.sanitize("document.tar.pdf");
        assertThat(result).isEqualTo("document.tar.pdf");
    }

    @Test
    @DisplayName("Truncates excessively long filenames while preserving extension")
    void shouldTruncateVeryLongFilename() {
        String longBase = "a".repeat(300);
        String result = FilenameSanitizer.sanitize(longBase + ".pdf");
        assertThat(result.length()).isLessThanOrEqualTo(255);
        assertThat(result).endsWith(".pdf");
    }

    @Test
    @DisplayName("Provides default filename for null or blank input")
    void shouldProvideDefaultFallback() {
        assertThat(FilenameSanitizer.sanitize(null)).isEqualTo("attachment");
        assertThat(FilenameSanitizer.sanitize("")).isEqualTo("attachment");
        assertThat(FilenameSanitizer.sanitize("    ")).isEqualTo("attachment");
        assertThat(FilenameSanitizer.sanitize("/")).isEqualTo("attachment");
        assertThat(FilenameSanitizer.sanitize("\\")).isEqualTo("attachment");
    }

    @Test
    @DisplayName("Strips null byte characters")
    void shouldStripNullBytes() {
        String result = FilenameSanitizer.sanitize("photo\0.png");
        assertThat(result).doesNotContain("\0");
        assertThat(result).isEqualTo("photo.png");
    }
}
