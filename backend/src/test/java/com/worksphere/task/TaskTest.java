package com.worksphere.task;

import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.task.domain.Task;
import com.worksphere.task.domain.TaskPriority;
import com.worksphere.task.domain.TaskStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TaskTest {

    @Test
    @DisplayName("Create task initializes with status TODO and progress 0")
    void createTaskSuccess() {
        UUID taskId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        UUID reporterId = UUID.randomUUID();
        LocalDate startDate = LocalDate.of(2026, 10, 1);
        Instant dueDate = Instant.now().plus(7, ChronoUnit.DAYS);

        Task task = Task.create(
                taskId,
                projectId,
                null,
                null,
                "Implement login screen",
                "Create UI and connect auth API",
                TaskPriority.HIGH,
                reporterId,
                startDate,
                dueDate,
                480,
                reporterId
        );

        assertThat(task.getId()).isEqualTo(taskId);
        assertThat(task.getProjectId()).isEqualTo(projectId);
        assertThat(task.getTitle()).isEqualTo("Implement login screen");
        assertThat(task.getStatus()).isEqualTo(TaskStatus.TODO);
        assertThat(task.getPriority()).isEqualTo(TaskPriority.HIGH);
        assertThat(task.getProgressPercent()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(task.isDeleted()).isFalse();
        assertThat(task.getEstimatedMinutes()).isEqualTo(480);
    }

    @Test
    @DisplayName("Create task with blank title throws VALIDATION_ERROR")
    void createTaskBlankTitleThrows() {
        UUID taskId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        UUID reporterId = UUID.randomUUID();

        assertThatThrownBy(() -> Task.create(
                taskId,
                projectId,
                null,
                null,
                "   ",
                "Description",
                TaskPriority.MEDIUM,
                reporterId,
                null,
                null,
                100,
                reporterId
        )).isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("Create task with startDate after dueDate throws TASK_DATE_RANGE_INVALID")
    void createTaskInvalidDateRangeThrows() {
        UUID taskId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        UUID reporterId = UUID.randomUUID();
        LocalDate startDate = LocalDate.of(2026, 10, 15);
        Instant dueDate = Instant.parse("2026-10-10T17:00:00Z");

        assertThatThrownBy(() -> Task.create(
                taskId,
                projectId,
                null,
                null,
                "Test Task",
                "Description",
                TaskPriority.LOW,
                reporterId,
                startDate,
                dueDate,
                60,
                reporterId
        )).isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_DATE_RANGE_INVALID"));
    }

    @Test
    @DisplayName("Create task with negative estimatedMinutes throws VALIDATION_ERROR")
    void createTaskNegativeEstimatedMinutesThrows() {
        UUID taskId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        UUID reporterId = UUID.randomUUID();

        assertThatThrownBy(() -> Task.create(
                taskId,
                projectId,
                null,
                null,
                "Test Task",
                "Description",
                TaskPriority.LOW,
                reporterId,
                null,
                null,
                -10,
                reporterId
        )).isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("Create task with self parent throws TASK_PARENT_CYCLE_DETECTED")
    void createTaskSelfParentThrows() {
        UUID taskId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        UUID reporterId = UUID.randomUUID();

        assertThatThrownBy(() -> Task.create(
                taskId,
                projectId,
                taskId,
                null,
                "Self parent task",
                "Description",
                TaskPriority.LOW,
                reporterId,
                null,
                null,
                60,
                reporterId
        )).isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_PARENT_CYCLE_DETECTED"));
    }

    @Test
    @DisplayName("Soft delete marks task as deleted with timestamp and user")
    void softDeleteSuccess() {
        UUID taskId = UUID.randomUUID();
        UUID projectId = UUID.randomUUID();
        UUID reporterId = UUID.randomUUID();

        Task task = Task.create(
                taskId,
                projectId,
                null,
                null,
                "To be deleted",
                null,
                TaskPriority.LOW,
                reporterId,
                null,
                null,
                null,
                reporterId
        );

        task.softDelete(reporterId);

        assertThat(task.isDeleted()).isTrue();
        assertThat(task.getDeletedBy()).isEqualTo(reporterId);
        assertThat(task.getDeletedAt()).isNotNull();
    }
}
