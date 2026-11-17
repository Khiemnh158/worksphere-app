ALTER TABLE department_work DROP CONSTRAINT department_work_status_check;
ALTER TABLE department_work ADD CONSTRAINT department_work_status_check CHECK(status IN ('ASSIGNED','IN_PROGRESS','BLOCKED','REVIEW','COMPLETED','HANDOVER','CANCELLED'));
