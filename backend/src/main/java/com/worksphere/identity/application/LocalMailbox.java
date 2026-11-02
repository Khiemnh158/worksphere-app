package com.worksphere.identity.application;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.*;

/** Explicit developer mailbox. No public HTTP endpoint and no external recipients. */
@Component
@Profile("dev")
@ConditionalOnProperty(name = "worksphere.mail.local-enabled", havingValue = "true")
public class LocalMailbox {
    private final JdbcTemplate db;
    private final RecoveryService recovery;
    private final Path folder;

    public LocalMailbox(
            JdbcTemplate db,
            RecoveryService recovery,
            @Value("${worksphere.mail.local-path}") String path) {
        this.db = db;
        this.recovery = recovery;
        this.folder = Path.of(path).toAbsolutePath();
    }

    @Scheduled(fixedDelay = 3000)
    @Transactional
    public void deliver() throws Exception {
        Files.createDirectories(folder);
        for (var row :
                db.queryForList(
                        "SELECT * FROM mail_outbox WHERE sent_at IS NULL AND expires_at>now() AND"
                            + " attempts<5 ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 20")) {
            String body =
                    "HỘP THƯ THỬ LOCAL · không gửi email thật\nTo: "
                            + row.get("recipient")
                            + "\nSubject: "
                            + row.get("subject")
                            + "\n\n"
                            + recovery.decrypt((String) row.get("encrypted_body"));
            Files.writeString(
                    folder.resolve(row.get("id") + ".txt"),
                    body,
                    StandardOpenOption.CREATE,
                    StandardOpenOption.TRUNCATE_EXISTING);
            db.update(
                    "UPDATE mail_outbox SET sent_at=now(),encrypted_body=NULL WHERE id=?",
                    row.get("id"));
        }
        db.update(
                "UPDATE mail_outbox SET encrypted_body=NULL WHERE expires_at<=now() AND"
                        + " encrypted_body IS NOT NULL");
    }
}
