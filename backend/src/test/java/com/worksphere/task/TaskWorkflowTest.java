package com.worksphere.task;

import com.worksphere.shared.exception.BusinessRuleException;
import com.worksphere.task.domain.Task;
import com.worksphere.task.domain.TaskPriority;
import com.worksphere.task.domain.TaskStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TaskWorkflowTest {

    private Task createSampleTask() {
        return Task.create(
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                null,
                "Workflow Sample Task",
                "Description",
                TaskPriority.MEDIUM,
                UUID.randomUUID(),
                null,
                null,
                120,
                UUID.randomUUID()
        );
    }

    @Test
    @DisplayName("Valid workflow: TODO -> IN_PROGRESS -> IN_REVIEW -> COMPLETED")
    void standardHappyWorkflowPath() {
        Task task = createSampleTask();
        UUID actor = UUID.randomUUID();

        // 1. TODO -> IN_PROGRESS
        task.changeStatus(TaskStatus.IN_PROGRESS, "Start working", actor);
        assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);

        // Update progress while IN_PROGRESS
        task.updateProgress(new BigDecimal("50.00"), actor);
        assertThat(task.getProgressPercent()).isEqualByComparingTo(new BigDecimal("50.00"));

        // 2. IN_PROGRESS -> IN_REVIEW
        task.changeStatus(TaskStatus.IN_REVIEW, "Submitted for review", actor);
        assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_REVIEW);

        // 3. IN_REVIEW -> COMPLETED
        task.changeStatus(TaskStatus.COMPLETED, "Approved by PM", actor);
        assertThat(task.getStatus()).isEqualTo(TaskStatus.COMPLETED);
        assertThat(task.getProgressPercent()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(task.getCompletedAt()).isNotNull();
    }

    @Test
    @DisplayName("Valid workflow: IN_REVIEW -> IN_PROGRESS (Rejection/Changes requested)")
    void reviewRejectionPath() {
        Task task = createSampleTask();
        UUID actor = UUID.randomUUID();

        task.changeStatus(TaskStatus.IN_PROGRESS, "Start", actor);
        task.changeStatus(TaskStatus.IN_REVIEW, "Submit", actor);

        task.changeStatus(TaskStatus.IN_PROGRESS, "Fix UI bugs", actor);
        assertThat(task.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("Valid cancellation: TODO -> CANCELLED and IN_PROGRESS -> CANCELLED")
    void cancellationPaths() {
        Task task1 = createSampleTask();
        UUID actor = UUID.randomUUID();
        task1.changeStatus(TaskStatus.CANCELLED, "Cancelled from TODO", actor);
        assertThat(task1.getStatus()).isEqualTo(TaskStatus.CANCELLED);
        assertThat(task1.getCompletedAt()).isNull();

        Task task2 = createSampleTask();
        task2.changeStatus(TaskStatus.IN_PROGRESS, "Start", actor);
        task2.changeStatus(TaskStatus.CANCELLED, "Cancelled from IN_PROGRESS", actor);
        assertThat(task2.getStatus()).isEqualTo(TaskStatus.CANCELLED);
        assertThat(task2.getCompletedAt()).isNull();
    }

    @Test
    @DisplayName("Direct transition TODO -> COMPLETED is rejected")
    void directTodoToCompletedRejected() {
        Task task = createSampleTask();
        UUID actor = UUID.randomUUID();

        assertThatThrownBy(() -> task.changeStatus(TaskStatus.COMPLETED, "Bypass review", actor))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_INVALID_STATUS_TRANSITION"));
    }

    @Test
    @DisplayName("Direct transition IN_PROGRESS -> COMPLETED is rejected")
    void directInProgressToCompletedRejected() {
        Task task = createSampleTask();
        UUID actor = UUID.randomUUID();
        task.changeStatus(TaskStatus.IN_PROGRESS, "Start", actor);

        assertThatThrownBy(() -> task.changeStatus(TaskStatus.COMPLETED, "Bypass review", actor))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_INVALID_STATUS_TRANSITION"));
    }

    @Test
    @DisplayName("Transition from COMPLETED (terminal state) is rejected")
    void completedIsTerminal() {
        Task task = createSampleTask();
        UUID actor = UUID.randomUUID();
        task.changeStatus(TaskStatus.IN_PROGRESS, "Start", actor);
        task.changeStatus(TaskStatus.IN_REVIEW, "Review", actor);
        task.changeStatus(TaskStatus.COMPLETED, "Done", actor);

        assertThatThrownBy(() -> task.changeStatus(TaskStatus.IN_PROGRESS, "Reopen", actor))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_TERMINAL_STATE"));
    }

    @Test
    @DisplayName("Transition from CANCELLED (terminal state) is rejected")
    void cancelledIsTerminal() {
        Task task = createSampleTask();
        UUID actor = UUID.randomUUID();
        task.changeStatus(TaskStatus.CANCELLED, "Cancel", actor);

        assertThatThrownBy(() -> task.changeStatus(TaskStatus.TODO, "Reopen", actor))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_TERMINAL_STATE"));
    }

    @Test
    @DisplayName("Update progress on CANCELLED task is rejected")
    void updateProgressOnCancelledRejected() {
        Task task = createSampleTask();
        UUID actor = UUID.randomUUID();
        task.changeStatus(TaskStatus.CANCELLED, "Cancel", actor);

        assertThatThrownBy(() -> task.updateProgress(new BigDecimal("30.00"), actor))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_TERMINAL_STATE"));
    }

    @Test
    @DisplayName("Update progress on COMPLETED task is rejected")
    void updateProgressOnCompletedRejected() {
        Task task = createSampleTask();
        UUID actor = UUID.randomUUID();
        task.changeStatus(TaskStatus.IN_PROGRESS, "Start", actor);
        task.changeStatus(TaskStatus.IN_REVIEW, "Review", actor);
        task.changeStatus(TaskStatus.COMPLETED, "Done", actor);

        assertThatThrownBy(() -> task.updateProgress(new BigDecimal("80.00"), actor))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_TERMINAL_STATE"));
    }

    @Test
    @DisplayName("Progress below 0 or above 100 is rejected")
    void invalidProgressPercentRejected() {
        Task task = createSampleTask();
        UUID actor = UUID.randomUUID();

        assertThatThrownBy(() -> task.updateProgress(new BigDecimal("-5.00"), actor))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_INVALID_PROGRESS"));

        assertThatThrownBy(() -> task.updateProgress(new BigDecimal("105.00"), actor))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getCode()).isEqualTo("TASK_INVALID_PROGRESS"));
    }
}
