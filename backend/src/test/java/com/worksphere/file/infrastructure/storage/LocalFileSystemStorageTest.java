package com.worksphere.file.infrastructure.storage;

import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalFileSystemStorageTest {

    @TempDir
    Path tempStorageDir;

    private LocalFileSystemStorageService storageService;

    @BeforeEach
    void setUp() {
        storageService = new LocalFileSystemStorageService(tempStorageDir);
    }

    @Test
    @DisplayName("Successfully stores and loads file as Resource")
    void shouldStoreAndLoadFile() throws IOException {
        String testContent = "WorkSphere storage test payload";
        String storagePath = "TASK_ATTACHMENT/2026/10/sample.txt";

        String savedPath = storageService.store(
                new ByteArrayInputStream(testContent.getBytes(StandardCharsets.UTF_8)),
                storagePath
        );

        assertThat(savedPath).isEqualTo(storagePath);
        assertThat(storageService.exists(storagePath)).isTrue();

        Resource resource = storageService.loadAsResource(storagePath);
        assertThat(resource.exists()).isTrue();
        try (var in = resource.getInputStream()) {
            assertThat(new String(in.readAllBytes(), StandardCharsets.UTF_8)).isEqualTo(testContent);
        }
    }

    @Test
    @DisplayName("Successfully deletes stored physical file")
    void shouldDeleteFile() {
        String testContent = "To be deleted";
        String storagePath = "AVATAR/2026/10/avatar.png";

        storageService.store(
                new ByteArrayInputStream(testContent.getBytes(StandardCharsets.UTF_8)),
                storagePath
        );
        assertThat(storageService.exists(storagePath)).isTrue();

        storageService.delete(storagePath);
        assertThat(storageService.exists(storagePath)).isFalse();
    }

    @Test
    @DisplayName("Rejects relative directory traversal with forward slashes")
    void shouldRejectPathTraversalForwardSlashes() {
        String evilPath = "../../../etc/passwd";
        ByteArrayInputStream stream = new ByteArrayInputStream("evil".getBytes());

        assertThatThrownBy(() -> storageService.store(stream, evilPath))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Đường dẫn tệp không hợp lệ");

        assertThatThrownBy(() -> storageService.loadAsResource(evilPath))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    @DisplayName("Rejects relative directory traversal with backslashes")
    void shouldRejectPathTraversalBackslashes() {
        String evilPath = "..\\..\\windows\\system32\\calc.exe";
        ByteArrayInputStream stream = new ByteArrayInputStream("evil".getBytes());

        assertThatThrownBy(() -> storageService.store(stream, evilPath))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Đường dẫn tệp không hợp lệ");
    }

    @Test
    @DisplayName("Throws ResourceNotFoundException when loading non-existent file")
    void shouldThrowWhenFileNotFound() {
        assertThatThrownBy(() -> storageService.loadAsResource("TASK_ATTACHMENT/2026/10/missing.pdf"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Không tìm thấy tệp");
    }

    @Test
    @DisplayName("Properly handles null or empty storage path")
    void shouldRejectNullOrEmptyStoragePath() {
        ByteArrayInputStream stream = new ByteArrayInputStream("test".getBytes());

        assertThatThrownBy(() -> storageService.store(stream, null))
                .isInstanceOf(BusinessRuleException.class);

        assertThatThrownBy(() -> storageService.store(stream, "   "))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    @DisplayName("Rejects overwrite when destination file already exists and preserves existing content")
    void shouldRejectOverwriteIfDestinationAlreadyExists() throws IOException {
        String originalContent = "Original destination content";
        String storagePath = "TASK_ATTACHMENT/2026/10/existing.txt";

        // Pre-create destination file
        storageService.store(
                new ByteArrayInputStream(originalContent.getBytes(StandardCharsets.UTF_8)),
                storagePath
        );
        assertThat(storageService.exists(storagePath)).isTrue();

        // Attempt to store with same storage key
        String overwriteAttempt = "Malicious overwrite content";
        assertThatThrownBy(() -> storageService.store(
                new ByteArrayInputStream(overwriteAttempt.getBytes(StandardCharsets.UTF_8)),
                storagePath
        ))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Tệp đích đã tồn tại trên hệ thống lưu trữ");

        // Verify existing destination bytes are preserved
        Resource resource = storageService.loadAsResource(storagePath);
        try (var in = resource.getInputStream()) {
            assertThat(new String(in.readAllBytes(), StandardCharsets.UTF_8)).isEqualTo(originalContent);
        }

        // Verify temp directory contains no lingering upload temp files
        Path tempDir = tempStorageDir.resolve(".tmp");
        try (var stream = Files.list(tempDir)) {
            assertThat(stream.filter(p -> p.getFileName().toString().startsWith("upload-"))).isEmpty();
        }
    }

    @Test
    @DisplayName("Rejects store/load/delete traversing symbolic link or junction pointing outside root")
    void shouldRejectSymlinkEscape() throws IOException {
        Path outsideDir = Files.createTempDirectory("worksphere-outside-");
        Path outsideFile = outsideDir.resolve("sensitive.txt");
        Files.writeString(outsideFile, "top-secret-content", StandardCharsets.UTF_8);

        try {
            Path symlinkInsideRoot = tempStorageDir.resolve("escapelink");
            boolean linkCreated = false;
            try {
                Files.createSymbolicLink(symlinkInsideRoot, outsideDir);
                linkCreated = true;
            } catch (Exception e) {
                // Symbolic link creation not permitted without Administrator privileges on Windows host
            }

            boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
            if (!isWindows) {
                assertThat(linkCreated)
                        .as("Symbolic link creation must succeed in Linux container environment")
                        .isTrue();
            }

            if (linkCreated) {
                // 1. Attempt STORE traversing symbolic link directory
                String storeAttackPath = "escapelink/attack.txt";
                ByteArrayInputStream stream = new ByteArrayInputStream(
                        "malicious-payload".getBytes(StandardCharsets.UTF_8)
                );

                assertThatThrownBy(() -> storageService.store(stream, storeAttackPath))
                        .isInstanceOf(BusinessRuleException.class)
                        .hasMessageContaining("Đường dẫn tệp không hợp lệ");

                // Verify outside directory was NOT created/written to
                assertThat(Files.exists(outsideDir.resolve("attack.txt"))).isFalse();

                // 2. Attempt LOAD traversing symbolic link directory
                String loadAttackPath = "escapelink/sensitive.txt";
                assertThatThrownBy(() -> storageService.loadAsResource(loadAttackPath))
                        .isInstanceOf(BusinessRuleException.class)
                        .hasMessageContaining("Đường dẫn tệp không hợp lệ");

                // 3. Attempt DELETE traversing symbolic link directory
                String deleteAttackPath = "escapelink/sensitive.txt";
                assertThatThrownBy(() -> storageService.delete(deleteAttackPath))
                        .isInstanceOf(BusinessRuleException.class)
                        .hasMessageContaining("Đường dẫn tệp không hợp lệ");

                // Verify outside file was NOT deleted or modified
                assertThat(Files.exists(outsideFile)).isTrue();
                assertThat(Files.readString(outsideFile, StandardCharsets.UTF_8)).isEqualTo("top-secret-content");

                // 4. Test direct symbolic link to outside file
                Path fileSymlink = tempStorageDir.resolve("filelink.txt");
                boolean fileLinkCreated = false;
                try {
                    Files.createSymbolicLink(fileSymlink, outsideFile);
                    fileLinkCreated = true;
                } catch (Exception ignored) {
                }

                if (fileLinkCreated) {
                    try {
                        assertThatThrownBy(() -> storageService.loadAsResource("filelink.txt"))
                                .isInstanceOf(BusinessRuleException.class);
                        assertThatThrownBy(() -> storageService.delete("filelink.txt"))
                                .isInstanceOf(BusinessRuleException.class);
                        assertThat(Files.exists(outsideFile)).isTrue();
                    } finally {
                        Files.deleteIfExists(fileSymlink);
                    }
                }
            }
        } finally {
            try {
                Files.deleteIfExists(tempStorageDir.resolve("escapelink"));
                Files.deleteIfExists(outsideFile);
                Files.deleteIfExists(outsideDir);
            } catch (Exception ignored) {
            }
        }
    }
}
