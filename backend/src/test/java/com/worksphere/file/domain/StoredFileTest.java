package com.worksphere.file.domain;

import com.worksphere.shared.exception.BusinessRuleException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StoredFileTest {

    private static final String VALID_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    @Test
    @DisplayName("Successfully creates StoredFile with valid attributes and ACTIVE status")
    void shouldCreateStoredFileSuccessfully() {
        UUID id = UUID.randomUUID();
        UUID uploaderId = UUID.randomUUID();

        StoredFile file = StoredFile.create(
                id,
                "document.pdf",
                id + ".pdf",
                "TASK_ATTACHMENT/2026/10/" + id + ".pdf",
                "application/pdf",
                "pdf",
                1024L,
                VALID_SHA256.toUpperCase(),
                uploaderId
        );

        assertThat(file.getId()).isEqualTo(id);
        assertThat(file.getOriginalName()).isEqualTo("document.pdf");
        assertThat(file.getStoredName()).isEqualTo(id + ".pdf");
        assertThat(file.getStoragePath()).isEqualTo("TASK_ATTACHMENT/2026/10/" + id + ".pdf");
        assertThat(file.getMimeType()).isEqualTo("application/pdf");
        assertThat(file.getExtension()).isEqualTo("pdf");
        assertThat(file.getSizeBytes()).isEqualTo(1024L);
        assertThat(file.getChecksumSha256()).isEqualTo(VALID_SHA256); // lowercased
        assertThat(file.getUploadedBy()).isEqualTo(uploaderId);
        assertThat(file.getStatus()).isEqualTo(StoredFileStatus.ACTIVE);
        assertThat(file.isActive()).isTrue();
        assertThat(file.getCreatedAt()).isNotNull();
        assertThat(file.getDeletedAt()).isNull();
    }

    @Test
    @DisplayName("Throws exception when size is zero or negative")
    void shouldRejectZeroOrNegativeSize() {
        UUID id = UUID.randomUUID();
        UUID uploaderId = UUID.randomUUID();

        assertThatThrownBy(() -> StoredFile.create(
                id,
                "empty.pdf",
                "empty.pdf",
                "path",
                "application/pdf",
                "pdf",
                0L,
                VALID_SHA256,
                uploaderId
        ))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Kích thước tệp phải lớn hơn 0 byte");

        assertThatThrownBy(() -> StoredFile.create(
                id,
                "neg.pdf",
                "neg.pdf",
                "path",
                "application/pdf",
                "pdf",
                -10L,
                VALID_SHA256,
                uploaderId
        ))
                .isInstanceOf(BusinessRuleException.class);
    }

    @Test
    @DisplayName("Throws exception when SHA-256 checksum length is not 64")
    void shouldRejectInvalidChecksumLength() {
        UUID id = UUID.randomUUID();
        UUID uploaderId = UUID.randomUUID();

        assertThatThrownBy(() -> StoredFile.create(
                id,
                "doc.pdf",
                "doc.pdf",
                "path",
                "application/pdf",
                "pdf",
                100L,
                "short-hash",
                uploaderId
        ))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Mã băm SHA-256 không hợp lệ");
    }

    @Test
    @DisplayName("Marks file as deleted when softDelete is called")
    void shouldSoftDelete() {
        UUID id = UUID.randomUUID();
        UUID uploaderId = UUID.randomUUID();

        StoredFile file = StoredFile.create(
                id,
                "doc.pdf",
                id + ".pdf",
                "path",
                "application/pdf",
                "pdf",
                100L,
                VALID_SHA256,
                uploaderId
        );

        assertThat(file.isActive()).isTrue();

        file.softDelete();

        assertThat(file.getStatus()).isEqualTo(StoredFileStatus.DELETED);
        assertThat(file.isActive()).isFalse();
        assertThat(file.getDeletedAt()).isNotNull();
    }
}
