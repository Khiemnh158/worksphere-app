package com.worksphere.file.application;

import com.worksphere.file.domain.FilePurpose;
import com.worksphere.file.domain.FileStorageService;
import com.worksphere.file.infrastructure.persistence.StoredFileRepository;
import com.worksphere.project.infrastructure.persistence.ProjectMemberRepository;
import com.worksphere.shared.security.WorkSphereUserPrincipal;
import com.worksphere.task.infrastructure.persistence.TaskAttachmentRepository;
import com.worksphere.task.infrastructure.persistence.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;

import java.io.InputStream;
import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FileApplicationServiceTest {

    @Mock
    private StoredFileRepository storedFileRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private TaskAttachmentRepository taskAttachmentRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private FileValidationService fileValidationService;

    private FileApplicationService fileApplicationService;

    @BeforeEach
    void setUp() {
        fileValidationService = new FileValidationService();
        fileApplicationService = new FileApplicationService(
                storedFileRepository,
                fileStorageService,
                fileValidationService,
                taskAttachmentRepository,
                taskRepository,
                projectMemberRepository,
                jdbcTemplate
        );
    }

    @Test
    @DisplayName("When metadata persistence fails and storage cleanup delete fails, original exception is not masked")
    void shouldNotMaskOriginalExceptionWhenStorageCleanupFails() {
        byte[] validPng = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, (byte) 0xC4, (byte) 0x89
        };
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", validPng);
        UUID userId = UUID.randomUUID();
        com.worksphere.identity.domain.User user = org.mockito.Mockito.mock(com.worksphere.identity.domain.User.class);
        when(user.getId()).thenReturn(userId);
        WorkSphereUserPrincipal principal = new WorkSphereUserPrincipal(user);

        // Storage store succeeds
        when(fileStorageService.store(any(InputStream.class), anyString())).thenReturn("TASK_ATTACHMENT/2026/10/file.png");

        // Metadata save fails with DataIntegrityViolationException
        DataIntegrityViolationException originalException = new DataIntegrityViolationException("Database constraint violation");
        when(storedFileRepository.save(any())).thenThrow(originalException);

        // Compensating cleanup storage delete ALSO fails with an exception
        doThrow(new RuntimeException("Storage network timeout during cleanup")).when(fileStorageService).delete(anyString());

        // Assert: uploadFile throws the ORIGINAL exception (not the cleanup exception)
        assertThatThrownBy(() -> fileApplicationService.uploadFile(file, FilePurpose.TASK_ATTACHMENT, principal))
                .isSameAs(originalException);

        // Verify storage cleanup was attempted
        verify(fileStorageService).delete(anyString());
    }
}
